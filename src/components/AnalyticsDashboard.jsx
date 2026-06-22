// AnalyticsDashboard — session analytics computed entirely from the
// predictions log accumulated in Dashboard state. No backend endpoint
// needed, no fabricated data — every number shown is derived from real
// predictions made this session.
//
// Four panels:
//   1. Tier breakdown — donut chart (HIGH / MEDIUM / ROUTINE counts)
//   2. Cause frequency — horizontal bar chart (top causes by incident count)
//   3. Corridor activity — horizontal bar chart (top corridors by incident count)
//   4. Probability distribution — bucketed histogram of P(HIGH) scores

const TIER_COLORS = {
  HIGH:    "#ef4444",
  MEDIUM:  "#f59e0b",
  ROUTINE: "#6b7280",
};

// ── Donut chart (SVG, no dependency) ─────────────────────────────────────
function DonutChart({ data }) {
  // data: [{ label, value, color }]
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center h-28">
      <span className="font-data-md text-[10px] text-outline/40 tracking-widest">NO DATA</span>
    </div>
  );

  const cx = 56, cy = 56, r = 44, strokeW = 14;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={112} height={112} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth={strokeW} />
        {data.map((d, i) => {
          const dash = (d.value / total) * circumference;
          const gap  = circumference - dash;
          const seg  = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={d.color} strokeWidth={strokeW}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          );
          offset += dash;
          return seg;
        })}
        {/* Centre label */}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          style={{ transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px`,
                   fontFamily: "JetBrains Mono", fontSize: 16, fill: "#c4c6cf", fontWeight: 600 }}>
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
          style={{ transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px`,
                   fontFamily: "JetBrains Mono", fontSize: 7, fill: "#6b7280", letterSpacing: 1 }}>
          TOTAL
        </text>
      </svg>
      <div className="space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="font-data-md text-[10px] tracking-widest text-on-surface-variant truncate">{d.label}</span>
            <span className="font-data-md text-[11px] tracking-widest ml-auto pl-2" style={{ color: d.color }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal bar chart ──────────────────────────────────────────────────
function HBarChart({ data, color = "#c4c6cf" }) {
  // data: [{ label, value }], sorted descending by caller
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-16">
      <span className="font-data-md text-[10px] text-outline/40 tracking-widest">NO DATA</span>
    </div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between font-data-md text-[10px] tracking-widest mb-1">
            <span className="text-on-surface-variant truncate max-w-[75%]">{d.label}</span>
            <span className="text-primary">{d.value}</span>
          </div>
          <div className="h-0.5 bg-surface-container-lowest relative overflow-hidden">
            <div className="h-full model-bar"
              style={{ width: `${(d.value / max) * 100}%`, background: color,
                       animationDelay: `${i * 0.06}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Probability histogram ─────────────────────────────────────────────────
function ProbHistogram({ entries }) {
  const BUCKETS = [
    { label: "0–20%",   min: 0,   max: 0.2  },
    { label: "20–40%",  min: 0.2, max: 0.4  },
    { label: "40–60%",  min: 0.4, max: 0.6  },
    { label: "60–80%",  min: 0.6, max: 0.8  },
    { label: "80–100%", min: 0.8, max: 1.01 },
  ];
  const counts = BUCKETS.map(b =>
    entries.filter(e => {
      const p = e.prediction?.probability_high ?? 0;
      return p >= b.min && p < b.max;
    }).length
  );
  const max = Math.max(...counts, 1);

  if (entries.length === 0) return (
    <div className="flex items-center justify-center h-16">
      <span className="font-data-md text-[10px] text-outline/40 tracking-widest">NO DATA</span>
    </div>
  );

  return (
    <div className="flex items-end gap-1.5 h-20">
      {BUCKETS.map((b, i) => {
        const pct = (counts[i] / max) * 100;
        // Color buckets by where they fall relative to tier thresholds (~0.30 / ~0.82)
        const barColor = b.min >= 0.8 ? "#ef4444" : b.min >= 0.3 ? "#f59e0b" : "#6b7280";
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="font-data-md text-[9px] text-outline tracking-widest">{counts[i]}</span>
            <div className="w-full bg-surface-container-lowest relative" style={{ height: "48px" }}>
              <div className="absolute bottom-0 w-full model-bar"
                style={{ height: `${pct}%`, background: barColor,
                         animationDelay: `${i * 0.08}s`, minHeight: counts[i] > 0 ? "2px" : "0" }} />
            </div>
            <span className="font-data-md text-[8px] text-outline/50 tracking-widest">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────
function Panel({ title, badge, children }) {
  return (
    <div className="border border-outline-variant/50">
      <div className="panel-header px-3.5 py-2 border-b border-outline-variant/50 bg-surface-container-low flex items-center justify-between">
        <span className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">{title}</span>
        {badge && (
          <span className="font-label-caps text-[8px] text-outline tracking-widest">{badge}</span>
        )}
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ entries }) {
  // Tier breakdown
  const tierCounts = { HIGH: 0, MEDIUM: 0, ROUTINE: 0 };
  entries.forEach(e => { if (e.prediction?.tier) tierCounts[e.prediction.tier]++; });
  const tierData = ["HIGH", "MEDIUM", "ROUTINE"].map(t => ({
    label: t, value: tierCounts[t], color: TIER_COLORS[t],
  }));

  // Cause frequency — top 5
  const causeCounts = {};
  entries.forEach(e => {
    const c = e.input_summary?.event_cause?.replace(/_/g, " ").toUpperCase() || "UNKNOWN";
    causeCounts[c] = (causeCounts[c] || 0) + 1;
  });
  const causeData = Object.entries(causeCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Corridor activity — top 5
  const corridorCounts = {};
  entries.forEach(e => {
    const c = e.input_summary?.corridor || "UNKNOWN";
    corridorCounts[c] = (corridorCounts[c] || 0) + 1;
  });
  const corridorData = Object.entries(corridorCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Average probability
  const avgProb = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + (e.prediction?.probability_high ?? 0), 0) / entries.length * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="panel-header px-4 py-2.5 border-b border-outline-variant flex items-center justify-between flex-shrink-0 bg-surface-container-low">
        <span className="font-data-md text-[10px] text-on-surface-variant tracking-widest">
          SESSION ANALYTICS
        </span>
        <span className="font-label-caps text-[9px] text-outline tracking-widest">
          {entries.length} INCIDENT{entries.length !== 1 ? "S" : ""} THIS SESSION
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2 px-8">
            <span className="material-symbols-outlined text-[32px] text-outline/20 block">analytics</span>
            <p className="font-data-md text-[10px] text-outline/35 tracking-widest leading-relaxed">
              SUBMIT INCIDENTS OR RUN THE SIMULATOR TO POPULATE ANALYTICS
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto data-scrollbar p-4 space-y-4">

          {/* Summary stat row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "TOTAL", value: entries.length, color: "#c4c6cf" },
              { label: "HIGH RATE", value: `${tierCounts.HIGH > 0 ? Math.round(tierCounts.HIGH / entries.length * 100) : 0}%`, color: "#ef4444" },
              { label: "AVG P(HIGH)", value: `${avgProb}%`, color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-container-lowest border border-outline-variant/40 p-2 text-center">
                <div className="font-label-caps text-[8px] text-outline tracking-widest mb-1">{label}</div>
                <div className="font-data-md text-[14px] tracking-widest font-semibold" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Tier breakdown */}
          <Panel title="TIER BREAKDOWN" badge={`SESSION`}>
            <DonutChart data={tierData} />
          </Panel>

          {/* Cause frequency */}
          <Panel title="TOP CAUSES" badge="BY FREQUENCY">
            <HBarChart data={causeData} color="#c4c6cf" />
          </Panel>

          {/* Corridor activity */}
          <Panel title="CORRIDOR ACTIVITY" badge="BY FREQUENCY">
            <HBarChart data={corridorData} color="#6b7280" />
          </Panel>

          {/* Probability distribution */}
          <Panel title="PROBABILITY DISTRIBUTION" badge="P(HIGH) BUCKETS">
            <ProbHistogram entries={entries} />
          </Panel>

        </div>
      )}
    </div>
  );
}