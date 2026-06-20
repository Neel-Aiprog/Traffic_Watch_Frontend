export default function ModelVotingPanel({ individualScores }) {
  const models = [
    { key: "lightgbm", label: "LIGHTGBM_CLASSIFIER", defaultVal: 0.92 },
    { key: "xgboost", label: "XGBOOST_GRADIENT_BOOST", defaultVal: 0.88 },
    { key: "catboost", label: "CATBOOST_CATEGORICAL", defaultVal: 0.84 },
  ];

  return (
    <div className="bg-[#0b0e14] border border-slate-800 p-4 space-y-4 font-mono select-none">
      <h3 className="text-[10px] font-bold tracking-wider text-slate-400 border-b border-slate-900 pb-2">
        MODEL VOTING PANEL
      </h3>

      <div className="space-y-3">
        {models.map(({ key, label, defaultVal }) => {
          // If no dynamic individual score has loaded from parent API, maintain display numbers matching screen1.png
          const score = individualScores && individualScores[key] !== undefined ? individualScores[key] : defaultVal;
          const pct = Math.round(score * 100);
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold tracking-wide">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200 font-mono">{score.toFixed(2)}</span>
              </div>
              <div className="h-1.5 bg-[#07080a] border border-slate-900 overflow-hidden">
                <div 
                  className="h-full bg-slate-400 transition-all duration-500" 
                  style={{ width: `${pct}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}