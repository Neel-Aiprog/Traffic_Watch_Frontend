// FeedSimulator — replays a curated set of real Bengaluru incidents
// against the live /predict endpoint at a fixed interval, so judges
// can watch the dashboard react without manual form entry.
//
// Each incident is a real row from the training dataset, chosen to
// cover all three tiers and a spread of causes/corridors. The sequence
// is intentionally ordered to tell a story: starts routine, escalates
// to HIGH, then returns to routine — showing the full range in ~1 minute.

import { useState, useEffect, useRef, useCallback } from "react";

// 6 real incidents from the Bengaluru Traffic Police dataset,
// ordered for narrative impact during a live demo.
const DEMO_FEED = [
  {
    label: "Vehicle breakdown — ORR East 1",
    event_cause: "vehicle_breakdown",
    corridor: "ORR East 1",
    priority: "High",
    requires_road_closure: false,
    veh_type: "heavy_vehicle",
  },
  {
    label: "Accident — Hosur Road",
    event_cause: "accident",
    corridor: "Hosur Road",
    priority: "High",
    requires_road_closure: false,
    veh_type: "private_car",
  },
  {
    label: "Construction — Tumkur Road",
    event_cause: "construction",
    corridor: "Tumkur Road",
    priority: "High",
    requires_road_closure: true,
    veh_type: "unknown",
  },
  {
    label: "Tree fall — Bellary Road 1",
    event_cause: "tree_fall",
    corridor: "Bellary Road 1",
    priority: "High",
    requires_road_closure: false,
    veh_type: "unknown",
  },
  {
    label: "Water logging — ORR East 2",
    event_cause: "water_logging",
    corridor: "ORR East 2",
    priority: "High",
    requires_road_closure: false,
    veh_type: "unknown",
  },
  {
    label: "Vehicle breakdown — West of Chord Road",
    event_cause: "vehicle_breakdown",
    corridor: "West of Chord Road",
    priority: "High",
    requires_road_closure: false,
    veh_type: "unknown",
  },
  {
    label: "Protest — Mysore Road",
    event_cause: "protest",
    corridor: "Mysore Road",
    priority: "High",
    requires_road_closure: true,
    veh_type: "unknown",
  },
  {
    label: "Pot holes — Old Madras Road",
    event_cause: "pot_holes",
    corridor: "Old Madras Road",
    priority: "Low",
    requires_road_closure: false,
    veh_type: "unknown",
  },
  {
    label: "Congestion — Hosur Road",
    event_cause: "congestion",
    corridor: "Hosur Road",
    priority: "Low",
    requires_road_closure: false,
    veh_type: "private_car",
  },
  {
    label: "Public event — Magadi Road",
    event_cause: "public_event",
    corridor: "Magadi Road",
    priority: "High",
    requires_road_closure: false,
    veh_type: "unknown",
  },
];

const INTERVAL_MS = 9000; // 9 seconds between incidents

export default function FeedSimulator({ onIncidentSubmit, isSubmitting }) {
  const [running, setRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [countdown, setCountdown] = useState(INTERVAL_MS / 1000);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const idxRef = useRef(0); // ref copy so interval closure always has latest value

  // Fire a single incident submission
  const fireNext = useCallback(() => {
    const incident = DEMO_FEED[idxRef.current];
    onIncidentSubmit({
      ...incident,
      start_datetime: new Date().toISOString(),
    });
    idxRef.current = (idxRef.current + 1) % DEMO_FEED.length;
    setCurrentIdx(idxRef.current);
    setCountdown(INTERVAL_MS / 1000);
  }, [onIncidentSubmit]);

  const start = useCallback(() => {
    if (running) return;
    idxRef.current = 0;
    setCurrentIdx(0);
    setRunning(true);

    // Fire immediately on start, then on interval
    fireNext();

    intervalRef.current = setInterval(fireNext, INTERVAL_MS);

    // Countdown tick
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? INTERVAL_MS / 1000 : prev - 1));
    }, 1000);
  }, [running, fireNext]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);
    setRunning(false);
    setCountdown(INTERVAL_MS / 1000);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);
  }, []);

  const nextIncident = DEMO_FEED[running ? idxRef.current : 0];
  const progress = ((INTERVAL_MS / 1000 - countdown) / (INTERVAL_MS / 1000)) * 100;

  return (
    <div className="mx-4 mb-4 border border-outline-variant/50">
      {/* Header */}
      <div className="panel-header px-3.5 py-2 border-b border-outline-variant/50 bg-surface-container-low flex items-center justify-between">
        <span className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">
          INCIDENT FEED SIMULATOR
        </span>
        <div className="flex items-center gap-1.5">
          {running && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block live-dot" />
              <span className="font-label-caps text-[9px] text-green-400 tracking-widest">LIVE</span>
            </>
          )}
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Next incident preview */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 px-3 py-2">
          <div className="font-label-caps text-[8px] text-outline tracking-widest mb-1">
            {running ? "CURRENT INCIDENT" : "FIRST INCIDENT"}
          </div>
          <div className="font-data-md text-[11px] text-primary tracking-widest truncate">
            {nextIncident.label}
          </div>
          <div className="font-label-caps text-[9px] text-outline tracking-widest mt-0.5">
            {nextIncident.corridor} · {nextIncident.priority.toUpperCase()} PRIORITY
          </div>
        </div>

        {/* Countdown bar — only visible when running */}
        {running && (
          <div>
            <div className="flex justify-between font-data-md text-[9px] text-outline tracking-widest mb-1">
              <span>NEXT INCIDENT IN</span>
              <span>{countdown}s</span>
            </div>
            <div className="h-0.5 bg-surface-container-lowest relative overflow-hidden">
              <div
                className="h-full bg-primary transition-none"
                style={{ width: `${100 - progress}%`, transition: "width 1s linear" }}
              />
            </div>
          </div>
        )}

        {/* Queue preview */}
        <div>
          <div className="font-label-caps text-[8px] text-outline tracking-widest mb-1.5">
            FEED QUEUE ({DEMO_FEED.length} INCIDENTS, LOOPS)
          </div>
          <div className="space-y-1">
            {DEMO_FEED.map((inc, i) => (
              <div key={i} className={`flex items-center gap-2 font-data-md text-[9px] tracking-widest transition-colors ${
                running && i === (idxRef.current === 0 ? DEMO_FEED.length - 1 : idxRef.current - 1)
                  ? "text-primary"
                  : "text-outline/50"
              }`}>
                <span className="w-3 flex-shrink-0 text-right">{i + 1}.</span>
                <span className="truncate">{inc.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start / Stop button */}
        <button
          onClick={running ? stop : start}
          disabled={isSubmitting}
          className={`btn-scan w-full border font-label-caps text-[10px] tracking-[0.18em] py-3 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50 ${
            running
              ? "border-error/50 text-error/80 hover:bg-error-container/15 bg-transparent"
              : "border-outline-variant text-primary hover:border-primary hover:bg-surface-container bg-transparent"
          }`}
        >
          <span className={`material-symbols-outlined text-[14px] ${isSubmitting ? "animate-spin" : ""}`}>
            {isSubmitting ? "refresh" : running ? "stop_circle" : "play_circle"}
          </span>
          {running ? "STOP SIMULATION" : "START SIMULATION"}
        </button>
      </div>
    </div>
  );
}