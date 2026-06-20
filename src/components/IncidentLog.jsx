const TIER_CFG = {
  HIGH:    { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)", text: "#fca5a5" },
  MEDIUM:  { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", text: "#fcd34d" },
  ROUTINE: { bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)", text: "#9ca3af" },
};

export default function IncidentLog({ entries }) {
  return (
    <div className="flex flex-col h-full">
      <div className="panel-header px-4 py-2.5 border-b border-outline-variant flex items-center justify-between flex-shrink-0 bg-surface-container-low">
        <span className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">INCIDENT LOG</span>
        <span className="material-symbols-outlined text-[15px] text-outline">history</span>
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 border-b border-outline-variant/30">
          <span className="font-label-caps text-[9px] text-outline tracking-widest">CORRIDOR / CAUSE</span>
          <span className="font-label-caps text-[9px] text-outline tracking-widest">TIER</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto data-scrollbar">
        {entries.length === 0 ? (
          <div className="p-6 text-center font-data-md text-[10px] text-outline/35 tracking-widest leading-relaxed">
            NO RECORDED DATA IN<br />LOG SESSION HISTORY
          </div>
        ) : entries.map((entry, idx) => {
          const tier = entry.prediction.tier;
          const tc = TIER_CFG[tier] || TIER_CFG.ROUTINE;
          const time = new Date(entry.received_at).toLocaleTimeString("en-IN", { hour12: false });
          return (
            <div key={entry.event_id}
              className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 border-b border-outline-variant/20 hover:bg-surface-container/40 transition-colors log-row-enter"
              style={{ animationDelay: `${idx * 0.04}s` }}>
              <div className="min-w-0">
                <div className="font-data-md text-[11px] text-primary tracking-widest truncate">
                  {entry.input_summary.corridor}
                </div>
                <div className="font-label-caps text-[9px] text-outline tracking-widest mt-0.5">
                  {entry.input_summary.event_cause.replace(/_/g, " ").toUpperCase()} / {time}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center">
                <span className="font-label-caps text-[9px] tracking-widest px-2 py-0.5 border"
                  style={{ color: tc.text, background: tc.bg, borderColor: tc.border }}>
                  {tier}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}