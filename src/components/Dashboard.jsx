import { useState, useCallback, useEffect } from "react";
import IncidentForm from "./IncidentForm";
import PredictionResult from "./PredictionResult";
import ModelVotingPanel from "./ModelVotingPanel";
import IncidentLog from "./IncidentLog";
import ParticleField from "./ParticleField";
import { predictSeverity, SessionExpiredError, logout } from "./Api";


function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); });
  return <span className="font-data-md text-[10px] text-outline tracking-widest tabular-nums">{time.toTimeString().slice(0, 8)}</span>;
}

export default function Dashboard({ sessionToken, userInfo, onSessionExpired }) {
  const [latestResult, setLatestResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [log, setLog] = useState([]);
  const [activeNav, setActiveNav] = useState("incidents");
  const [backendOk, setBackendOk] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSubmitIncident = useCallback(async (payload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await predictSeverity(payload, sessionToken);
      setLatestResult(result);
      setLog(prev => [result, ...prev]);
      setBackendOk(true);
    } catch (err) {
      if (err instanceof SessionExpiredError) { onSessionExpired(); return; }
      setError(err.message || "Prediction failed — retry.");
      setBackendOk(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionToken, onSessionExpired]);

  const handleLogout = useCallback(async () => {
    try {
      await logout(sessionToken);
    } catch (err) {
      // Logout errors are non-critical - we still want to clear local state
      console.warn("Logout failed:", err);
    }
    onSessionExpired();
  }, [sessionToken, onSessionExpired]);

  const displayName = userInfo?.username?.toUpperCase() || "UNIT_702";

  return (
    <div className="min-h-screen flex flex-col bg-primary-container relative" style={{
      backgroundImage: "linear-gradient(rgba(30,41,59,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(30,41,59,0.15) 1px,transparent 1px)",
      backgroundSize: "32px 32px",
    }}>
      <ParticleField count={16} />
      <div className="scanline" />

      {/* Top nav */}
      <header className="h-11 bg-surface-container-low border-b border-outline-variant flex items-center px-5 gap-4 flex-shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-data-md text-[14px] text-primary tracking-[0.1em]">TRAFFIC WATCH</span>
          <div className="w-1 h-1 bg-error rounded-full animate-pulse" />
        </div>
        <div className="w-px h-5 bg-outline-variant mx-1" />
        <div className="flex items-center gap-1 border-b border-outline-variant/40 pb-0.5">
        </div>
        <div className="flex-1" />
        <Clock />
        <div className="w-px h-4 bg-outline-variant" />
        {/* <span className="material-symbols-outlined text-[17px] text-outline hover:text-primary transition-colors cursor-pointer">wifi_tethering</span> */}
        <div className="relative">
          <button onClick={() => setProfileOpen(p => !p)}
            className="flex items-center hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px] text-outline">account_circle</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-8 w-44 bg-surface-container-low border border-outline-variant z-50 shadow-2xl">
              <div className="px-3 py-3 border-b border-outline-variant">
                <div className="font-data-md text-[11px] text-primary tracking-widest">{displayName}</div>
                <div className="font-label-caps text-[9px] text-outline tracking-widest mt-0.5">
                  {userInfo?.role?.toUpperCase() || "OPERATOR"}
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 font-label-caps text-[10px] text-error/80 tracking-widest hover:bg-error-container/15 hover:text-error transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">logout</span>
                DISCONNECT
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Connection banner */}
      {!backendOk && (
        <div className="bg-error-container/80 border-b border-error/30 px-5 py-2 flex items-center justify-between flex-shrink-0 z-30 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-data-md text-[11px] text-error tracking-widest">
            <span className="material-symbols-outlined text-[14px]">error</span>
            CONNECTION FAILURE: BACKEND UNREACHABLE
          </div>
          <button onClick={() => setBackendOk(true)}
            className="font-label-caps text-[9px] text-error/70 tracking-widest hover:text-error underline underline-offset-2 transition-colors">
            RETRY HANDSHAKE
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* Left sidebar */}
        <aside className="w-52 bg-surface-container-low border-r border-outline-variant flex flex-col flex-shrink-0">
          {/* User card */}
          <div className="p-3.5 border-b border-outline-variant flex items-center gap-2.5">
            <div className="w-9 h-9 bg-surface-container border border-outline-variant flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px] text-outline">person</span>
            </div>
            <div className="min-w-0">
              <div className="font-data-md text-[11px] text-primary tracking-widest truncate">{displayName}</div>
              <div className="font-label-caps text-[9px] text-outline tracking-widest">SECTOR A-12</div>
            </div>
          </div>

          {/* System status */}
          <div className="border-t border-outline-variant p-3.5 flex-col space-y-2">
            <div className="flex items-center justify-between text-[9px] text-outline/70">
              <span>SYSTEM STATUS</span>
              <span className="text-[10px]">{backendOk ? "ONLINE" : "OFFLINE"}</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-outline/70">
              <span>LAST SYNC</span>
              <span className="text-[10px]">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* System settings */}
          <div className="border-t border-outline-variant p-3.5 flex items-center gap-2.5 hover:bg-surface-container/40 transition-colors cursor-pointer">

          </div>
        </aside>

        {/* 3-column content */}
        <div className="flex-1 grid grid-cols-[260px_1fr_270px] overflow-hidden min-w-0">

          {/* Col 1: form */}
          <div className="border-r border-outline-variant flex flex-col overflow-hidden bg-surface-container-low/40">
            <IncidentForm onSubmit={handleSubmitIncident} isSubmitting={isSubmitting} />
          </div>

          {/* Col 2: prediction engine */}
          <div className="border-r border-outline-variant flex flex-col overflow-y-auto data-scrollbar bg-surface-container-low/20">
            <div className="panel-header px-4 py-2.5 border-b border-outline-variant flex items-center justify-between flex-shrink-0 bg-surface-container-low sticky top-0 z-10">
              <span className="font-data-md text-[10px] text-on-surface-variant tracking-widest">PREDICTION ENGINE</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block live-dot" />
                <span className="font-label-caps text-[9px] text-green-400 tracking-widest">LIVE_STREAMING</span>
              </div>
            </div>
            <PredictionResult result={latestResult} error={error} />

          </div>

          {/* Col 3: log */}
          <div className="flex flex-col overflow-hidden bg-surface-container-low/30">
            <IncidentLog entries={log} />
          </div>
        </div>
      </div>
    </div>
  );
}