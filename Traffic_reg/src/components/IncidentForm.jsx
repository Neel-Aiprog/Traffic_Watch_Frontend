import { useState } from "react";

const EVENT_CAUSES = [
  "vehicle_breakdown","accident","construction","water_logging",
  "tree_fall","pot_holes","congestion","road_conditions",
  "procession","public_event","protest","vip_movement","debris","others",
];
const KNOWN_CORRIDORS = [
  "Mysore Road","Bellary Road 1","Bellary Road 2","Tumkur Road",
  "Hosur Road","ORR North 1","ORR North 2","ORR East 1","ORR East 2",
  "ORR West 1","Old Madras Road","Magadi Road","Bannerghata Road",
  "West of Chord Road","Non-corridor",
];
const VEH_TYPES = ["unknown","private_car","two_wheeler","bus","heavy_vehicle"];

const initialFormState = {
  event_cause: "", corridor: "", priority: "High",
  requires_road_closure: false, veh_type: "",
};

function Toggle({ value, onChange, onLabel, offLabel }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(!value)}
        className="relative w-10 h-5 border border-outline-variant transition-colors duration-200 flex-shrink-0"
        style={{ background: value ? "rgba(196,198,207,0.15)" : "transparent" }}>
        <div className="absolute top-0.5 h-4 w-4 border border-outline-variant transition-all duration-200 bg-outline-variant"
          style={{ left: value ? "calc(100% - 18px)" : "2px", background: value ? "#c4c6cf" : "#45474b" }} />
      </button>
      <span className="font-data-md text-[11px] tracking-widest transition-colors duration-200"
        style={{ color: value ? "#c4c6cf" : "#45474b" }}>
        {value ? onLabel : offLabel}
      </span>
    </div>
  );
}

const selectCls = "w-full bg-surface-container-lowest border border-outline-variant text-primary font-data-md text-[11px] px-3 py-2 outline-none focus:border-primary transition-colors tracking-widest appearance-none cursor-pointer";
const labelCls = "block font-label-caps text-[10px] text-outline-variant tracking-widest mb-1.5";

export default function IncidentForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialFormState);
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, start_datetime: new Date().toISOString() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Panel header */}
      <div className="panel-header px-4 py-2.5 border-b border-outline-variant flex items-center justify-between flex-shrink-0 bg-surface-container-low">
        <span className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">INCIDENT ENTRY</span>

      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto data-scrollbar p-4 space-y-4">
        <div>
          <label className={labelCls}>EVENT_CAUSE</label>
          <div className="relative">
            <select className={selectCls} value={form.event_cause} onChange={e => update("event_cause", e.target.value)}>
              <option value="" disabled>-- SELECT EVENT CAUSE --</option>
              {EVENT_CAUSES.map(c => <option key={c} value={c}>{c.replace(/_/g, "_").toUpperCase()}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] text-outline pointer-events-none">expand_more</span>
          </div>
        </div>

        <div>
          <label className={labelCls}>CORRIDOR_ID</label>
          <input
            list="corridor-opts" value={form.corridor}
            onChange={e => update("corridor", e.target.value)}
            placeholder="ENTER TRAFFIC CORRIDOR LINK..."
            className="w-full bg-surface-container-lowest border border-outline-variant text-primary font-data-md text-[11px] px-3 py-2 outline-none focus:border-primary transition-colors tracking-widest placeholder:text-outline/40 tw-input"
          />
          <datalist id="corridor-opts">
            {KNOWN_CORRIDORS.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div className="border-b border-outline-variant/40 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className={`${labelCls} mb-0`}>PRIORITY_OVERRIDE</label>
            <Toggle value={form.priority === "High"}
              onChange={v => update("priority", v ? "High" : "Low")}
              onLabel="HIGH" offLabel="LOW" />
          </div>
          <div className="flex items-center justify-between">
            <label className={`${labelCls} mb-0`}>ROAD_CLOSURE</label>
            <Toggle value={form.requires_road_closure}
              onChange={v => update("requires_road_closure", v)}
              onLabel="ACTIVE" offLabel="INACTIVE" />
          </div>
        </div>

        <div>
          <label className={labelCls}>VEHICLE_TYPE</label>
          <div className="relative">
            <select className={selectCls} value={form.veh_type} onChange={e => update("veh_type", e.target.value)}>
              <option value="" disabled>-- SELECT VEHICLE TYPE --</option>
              {VEH_TYPES.map(v => <option key={v} value={v}>{v.replace(/_/g, "_").toUpperCase()}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] text-outline pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="p-4 border-t border-outline-variant flex-shrink-0">
        <button type="submit" disabled={isSubmitting}
          className="btn-scan w-full bg-transparent border border-outline-variant text-primary font-label-caps text-[10px] tracking-[0.18em] py-3.5 hover:border-primary hover:bg-surface-container transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50">
          <span className={`material-symbols-outlined text-[14px] ${isSubmitting ? "animate-spin" : ""}`}>
            {isSubmitting ? "refresh" : "bolt"}
          </span>
          {isSubmitting ? "PREDICTING..." : "PREDICT SEVERITY"}
        </button>
      </div>
    </form>
  );
}