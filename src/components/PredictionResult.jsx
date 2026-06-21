const TIER_CFG = {
  HIGH:    { color: "#ef4444", dimColor: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", label: "HIGH",    badgeClass: "tier-badge-high" },
  MEDIUM:  { color: "#f59e0b", dimColor: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", label: "MEDIUM",  badgeClass: "tier-badge-medium" },
  ROUTINE: { color: "#6b7280", dimColor: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.15)", label: "ROUTINE", badgeClass: "" },
};

function CircleGauge({ pct, color }) {
  const r = 52, cx = 66, cy = 66;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center py-5">
      <div className="relative" style={{ width: 132, height: 132 }}>
        <svg width="132" height="132" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={`${dash} ${circumference}`} strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-data-lg text-[22px]" style={{ color, lineHeight: 1 }}>{pct}%</span>
          <span className="font-label-caps text-[8px] text-outline tracking-widest mt-0.5">PROBABILITY</span>
        </div>
      </div>
    </div>
  );
}

export default function PredictionResult({ result, error }) {
  if (error) return (
    <div className="mx-4 mt-4 flex items-center gap-2 bg-error-container/15 border border-error/25 px-3 py-3 font-data-md text-[11px] text-error tracking-widest">
      <span className="material-symbols-outlined text-[14px]">error</span>{error}
    </div>
  );

  if (!result) return (
    <div className="mx-4 mt-4 border border-outline-variant/30 px-4 py-10 text-center font-data-md text-[10px] text-outline/40 tracking-widest leading-relaxed">
      AWAITING INPUT METRICS TO COMPUTE<br />EVALUATION PARAMETERS...
    </div>
  );

  const { prediction, recommendation } = result;
  const pct = Math.round(prediction.probability_high * 100);
  const cfg = TIER_CFG[prediction.tier] || TIER_CFG.ROUTINE;
  const barClass = `prob-bar prob-bar-${prediction.tier.toLowerCase()}`;

  return (
    <div className="mx-4 mt-4 border" style={{ borderColor: cfg.border, background: cfg.dimColor }}>
      {/* Tier badge */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <span className="font-label-caps text-[10px] text-outline-variant tracking-widest">PREDICTION RESULT</span>
        <span className={`font-label-caps text-[10px] tracking-widest px-3 py-1 border ${cfg.badgeClass}`}
          style={{ color: cfg.color, borderColor: cfg.border, background: cfg.dimColor }}>
          {cfg.label}
        </span>
      </div>

      <CircleGauge pct={pct} color={cfg.color} />

      <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/20 pt-3">
        {/* Probability bar */}
        <div>
          <div className="flex justify-between font-data-md text-[10px] text-outline tracking-widest mb-1.5">
            <span>P(HIGH SEVERITY)</span>
            <span style={{ color: cfg.color }}>{pct}%</span>
          </div>
          <div className="h-1 bg-surface-container-lowest relative overflow-hidden">
            <div className={`h-full ${barClass}`} style={{ width: `${pct}%`, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
          </div>
        </div>

        {/* Recommendation message */}
        <p className="font-data-md text-[11px] text-on-surface-variant leading-relaxed tracking-wide border-l-2 pl-3"
          style={{ borderColor: cfg.color }}>
          {recommendation.message}
        </p>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
          {[
            { label: "MANPOWER", value: `UNIT_0${recommendation.manpower_units}` },
            { label: "BARRICADES", value: recommendation.barricade ? "TYPE_3" : "NONE" },
            { label: "ALERT", value: recommendation.alert_control_room ? "BROADCAST" : "SILENT" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container-lowest border border-outline-variant/40 p-1.5 sm:p-2 text-center">
              <div className="font-label-caps text-[7px] sm:text-[8px] text-outline tracking-widest mb-1 truncate">{label}</div>
              <div className="font-data-md text-[9px] sm:text-[10px] tracking-widest truncate"
                style={{ color: label === "ALERT" && recommendation.alert_control_room ? cfg.color : "#c4c6cf" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}