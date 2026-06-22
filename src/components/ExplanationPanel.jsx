// ExplanationPanel — shows the top SHAP-derived contributing factors for
// the most recent prediction. Each bar shows how strongly that specific
// feature VALUE pushed THIS incident toward HIGH or toward ROUTINE.
// This is per-prediction attribution (averaged across the 3 ensemble
// models), not a generic global feature importance ranking.

export default function ExplanationPanel({ factors }) {
  if (!factors || factors.length === 0) return null;

  return (
    <div className="mx-4 mb-4 border border-outline-variant/50">
      {/* Panel header — matches PREDICTION ENGINE / MODEL VOTING PANEL style */}
      <div className="panel-header px-3.5 py-2 border-b border-outline-variant/50 bg-surface-container-low flex items-center justify-between">
        <span className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">
          WHY THIS TIER
        </span>
        <span className="font-label-caps text-[8px] text-outline tracking-widest">
          SHAP ATTRIBUTION
        </span>
      </div>

      <div className="p-3.5 space-y-3.5">
        {factors.map((f, i) => {
          const isHigh = f.direction === "HIGH";
          const barColor  = isHigh ? "#ef4444" : "#6b7280";
          const textColor = isHigh ? "#fca5a5" : "#9ca3af";
          const dirLabel  = isHigh ? "↑ TOWARD HIGH" : "↓ TOWARD ROUTINE";

          return (
            <div key={i} className="space-y-1.5">
              {/* Feature label + value + direction badge */}
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-data-md text-[10px] tracking-widest min-w-0">
                  <span className="text-outline">{f.feature}:</span>{" "}
                  <span className="text-primary">{f.value}</span>
                </div>
                <span
                  className="font-label-caps text-[8px] tracking-widest flex-shrink-0 px-1.5 py-0.5 border"
                  style={{
                    color: textColor,
                    borderColor: isHigh ? "rgba(239,68,68,0.3)" : "rgba(107,114,128,0.3)",
                    background: isHigh ? "rgba(239,68,68,0.08)" : "rgba(107,114,128,0.08)",
                  }}
                >
                  {dirLabel}
                </span>
              </div>

              {/* Strength bar */}
              <div className="h-0.5 bg-surface-container-lowest relative overflow-hidden">
                <div
                  className="h-full model-bar"
                  style={{
                    width: `${f.relative_strength}%`,
                    background: barColor,
                    animationDelay: `${i * 0.08}s`,
                    transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>

              {/* Rank indicator — leftmost = strongest */}
              {i === 0 && (
                <div className="font-label-caps text-[8px] text-outline/40 tracking-widest">
                  PRIMARY DRIVER
                </div>
              )}
            </div>
          );
        })}

        <p className="font-label-caps text-[8px] text-outline/30 tracking-widest pt-1 border-t border-outline-variant/20">
          ATTRIBUTION AVERAGED ACROSS LIGHTGBM / XGBOOST / CATBOOST
        </p>
      </div>
    </div>
  );
}