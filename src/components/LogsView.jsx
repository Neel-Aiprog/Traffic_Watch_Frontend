import { useState, useMemo } from "react";

const TIER_CFG = {
  HIGH:    { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.35)",   text: "#fca5a5" },
  MEDIUM:  { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.35)",  text: "#fcd34d" },
  ROUTINE: { bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)", text: "#9ca3af" },
};

function TierBadge({ tier }) {
  const cfg = TIER_CFG[tier] || TIER_CFG.ROUTINE;
  return (
    <span className="font-label-caps text-[9px] tracking-widest px-2 py-0.5 border flex-shrink-0"
      style={{ color: cfg.text, background: cfg.bg, borderColor: cfg.border }}>
      {tier}
    </span>
  );
}

export default function LogsView({ entries }) {
  const [tierFilter, setTierFilter] = useState("ALL");
  const [causeFilter, setCauseFilter] = useState("");
  const [sortField, setSortField] = useState("time");

  const uniqueCauses = useMemo(() =>
    [...new Set(entries.map(e => e.input_summary?.event_cause || "").filter(Boolean))].sort()
  , [entries]);

  const filtered = useMemo(() => {
    let rows = [...entries];
    if (tierFilter !== "ALL") rows = rows.filter(e => e.prediction?.tier === tierFilter);
    if (causeFilter) rows = rows.filter(e => e.input_summary?.event_cause === causeFilter);
    if (sortField === "tier") {
      const order = { HIGH: 0, MEDIUM: 1, ROUTINE: 2 };
      rows.sort((a, b) => (order[a.prediction?.tier] ?? 3) - (order[b.prediction?.tier] ?? 3));
    } else if (sortField === "prob") {
      rows.sort((a, b) => (b.prediction?.probability_high ?? 0) - (a.prediction?.probability_high ?? 0));
    }
    return rows;
  }, [entries, tierFilter, causeFilter, sortField]);

  const selectCls = "bg-surface-container-lowest border border-outline-variant text-primary font-data-md text-[10px] px-2 py-1.5 outline-none focus:border-primary transition-colors tracking-widest appearance-none cursor-pointer";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="panel-header px-4 py-2.5 border-b border-outline-variant flex items-center justify-between flex-shrink-0 bg-surface-container-low">
        <span className="font-data-md text-[10px] text-on-surface-variant tracking-widest">INCIDENT LOGS</span>
        <span className="font-label-caps text-[9px] text-outline tracking-widest">
          {filtered.length} / {entries.length} RECORDS
        </span>
      </div>

      {/* Filter bar */}
      <div className="px-4 py-2.5 border-b border-outline-variant/50 flex items-center gap-2 flex-shrink-0 flex-wrap bg-surface-container-low/40">
        <select className={selectCls} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
          <option value="ALL">ALL TIERS</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="ROUTINE">ROUTINE</option>
        </select>

        <select className={selectCls} value={causeFilter} onChange={e => setCauseFilter(e.target.value)}>
          <option value="">ALL CAUSES</option>
          {uniqueCauses.map(c => (
            <option key={c} value={c}>{c.replace(/_/g, " ").toUpperCase()}</option>
          ))}
        </select>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <span className="font-label-caps text-[8px] text-outline tracking-widest">SORT:</span>
          {[["time","TIME"],["tier","TIER"],["prob","P(HIGH)"]].map(([val, label]) => (
            <button key={val} onClick={() => setSortField(val)}
              className={`font-label-caps text-[8px] tracking-widest px-2 py-1 border transition-colors ${
                sortField === val
                  ? "border-primary text-primary bg-surface-container"
                  : "border-outline-variant text-outline hover:text-on-surface-variant"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      {entries.length > 0 && (
        <div className="grid grid-cols-[1fr_80px_52px_60px] gap-2 px-4 py-2 border-b border-outline-variant/30 flex-shrink-0">
          {["CORRIDOR / CAUSE / TIME", "PRIORITY", "P(HIGH)", "TIER"].map(h => (
            <span key={h} className="font-label-caps text-[8px] text-outline tracking-widest">{h}</span>
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="flex-1 overflow-y-auto data-scrollbar">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-2 px-8">
              <span className="material-symbols-outlined text-[32px] text-outline/20 block">history</span>
              <p className="font-data-md text-[10px] text-outline/35 tracking-widest leading-relaxed">
                NO INCIDENTS LOGGED THIS SESSION.<br />SUBMIT AN INCIDENT OR RUN THE SIMULATOR.
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center font-data-md text-[10px] text-outline/35 tracking-widest">
            NO RECORDS MATCH CURRENT FILTERS
          </div>
        ) : filtered.map((entry, idx) => {
          const tier     = entry.prediction?.tier || "ROUTINE";
          const prob     = Math.round((entry.prediction?.probability_high ?? 0) * 100);
          const time     = new Date(entry.received_at).toLocaleTimeString("en-IN", { hour12: false });
          const cause    = (entry.input_summary?.event_cause || "").replace(/_/g, " ").toUpperCase();
          const corridor = entry.input_summary?.corridor || "—";
          const priority = entry.input_summary?.priority || "—";
          const cfg      = TIER_CFG[tier] || TIER_CFG.ROUTINE;

          return (
            <div key={entry.event_id || idx}
              className="grid grid-cols-[1fr_80px_52px_60px] gap-2 px-4 py-3 border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors log-row-enter items-center"
              style={{ animationDelay: `${Math.min(idx, 20) * 0.02}s` }}>

              <div className="min-w-0">
                <div className="font-data-md text-[11px] text-primary tracking-widest truncate">{corridor}</div>
                <div className="font-label-caps text-[9px] text-outline tracking-widest mt-0.5 truncate">{cause}</div>
                <div className="font-label-caps text-[8px] text-outline/50 tracking-widest mt-0.5">
                  {time}
                  {entry.operator && (
                    <span className="ml-2 text-outline/30">· {entry.operator.toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="font-data-md text-[10px] tracking-widest"
                style={{ color: priority === "High" ? "#c4c6cf" : "#6b7280" }}>
                {priority.toUpperCase()}
              </div>

              <div>
                <div className="font-data-md text-[10px] tracking-widest mb-1" style={{ color: cfg.text }}>
                  {prob}%
                </div>
                <div className="h-0.5 bg-surface-container-lowest">
                  <div className="h-full" style={{ width: `${prob}%`, background: cfg.text, transition: "width 0.5s ease" }} />
                </div>
              </div>

              <div><TierBadge tier={tier} /></div>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      {entries.length > 0 && (
        <div className="flex-shrink-0 border-t border-outline-variant/30 px-4 py-2 flex items-center gap-4">
          {["HIGH","MEDIUM","ROUTINE"].map(t => {
            const count = entries.filter(e => e.prediction?.tier === t).length;
            const cfg = TIER_CFG[t];
            return (
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.text }} />
                <span className="font-label-caps text-[8px] tracking-widest" style={{ color: cfg.text }}>
                  {t}: {count}
                </span>
              </div>
            );
          })}
          <div className="flex-1" />
          <span className="font-label-caps text-[8px] text-outline/40 tracking-widest">
            SESSION ONLY · NOT PERSISTED
          </span>
        </div>
      )}
    </div>
  );
}