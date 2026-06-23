import { useState, useEffect } from "react";
import ParticleField from "./ParticleField";

// Vite environment variable for backend URL - falls back to localhost for development
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const GRID_STYLE = (
  <style>{`
    @keyframes grid-drift {
      from { background-position: 0 0; }
      to   { background-position: 32px 0; }
    }
    .grid-animated {
      animation: grid-drift 4s linear infinite;
    }
  `}</style>
);
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); },[]);
  return <>{time.toTimeString().slice(0, 8)}</>;
}

function HudLine({ text, delay = 0 }) {
  return (
    <div className="typewriter overflow-hidden whitespace-nowrap"
      style={{ animationDelay: `${delay}s`, opacity: 0, animationFillMode: "forwards" }}>
      {text}
    </div>
  );
}

export default function AccessGate({ onAccessGranted, isRegisterMode = false, onAuthModeToggle }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    setErrorMessage(null);
  }, [isRegisterMode]);

  async function handleVerify(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setErrorMessage("OPERATOR_ID AND ACCESS_CODE REQUIRED"); return; }
    if (isRegisterMode && password !== confirmPassword) { setErrorMessage("ACCESS_CODE MISMATCH — RETRY"); return; }
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      let response;
      if (isRegisterMode) {
        response = await fetch(`${BASE_URL}/register`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password, role }),
        });
      } else {
        response = await fetch(`${BASE_URL}/access/verify`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        });
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        let errorText = `AUTH_ERROR_${response.status}`;

        if (typeof err.detail === "string") {
          errorText = err.detail;
        } else if (Array.isArray(err.detail)) {
          errorText = err.detail
            .map(d => (typeof d === "string" ? d : d.msg || JSON.stringify(d)))
            .join(", ");
        } else if (typeof err.detail === "object" && err.detail !== null) {
          errorText = err.detail.message || err.detail.msg || JSON.stringify(err.detail);
        }

        throw new Error(errorText);
      }
      const data = await response.json();
      if (isRegisterMode) {
        const loginRes = await fetch(`${BASE_URL}/access/verify`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        });
        const loginData = await loginRes.json();
        onAccessGranted(loginData.token, { username: loginData.username, role: loginData.role });
      } else {
        onAccessGranted(data.token, { username: data.username, role: data.role });
      }
    } catch (err) {
      setErrorMessage(err.message || "CONNECTION FAILED: BACKEND UNREACHABLE");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsVerifying(false);
    }
  }

  const inputBase = "w-full bg-surface-container-lowest border-b border-outline-variant text-primary font-data-md text-data-md px-3 py-2.5 outline-none tw-input placeholder:text-outline/40 tracking-widest text-[12px]";

  return (
    <>
    {GRID_STYLE}
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-primary-container grid-animated"
      style={{
        backgroundImage: "linear-gradient(rgba(30,41,59,0.22) 1px,transparent 1px),linear-gradient(90deg,rgba(30,41,59,0.22) 1px,transparent 1px)",
        backgroundSize: "32px 32px",
      }}>

      {/* Animated background particles */}
      <ParticleField count={24} />

      {/* Scanlines — two passes */}
      <div className="scanline" />
      <div className="scanline-2" />

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />

      {/* HUD top-left — hidden on mobile, visible md+ */}
      <div className="fixed top-0 left-0 p-3 sm:p-4 pointer-events-none z-20 font-data-md text-[9px] sm:text-[10px] text-outline/70 leading-relaxed tracking-widest hidden sm:block">
        <HudLine text="... TERMINAL_LINK: ACTIVE" delay={0.2} />
        <HudLine text="LAT: 12.9716° N | LON: 77.5946° E" delay={0.5} />
        <HudLine text="SECTOR: BENGALURU_METRO" delay={0.8} />
      </div>

      {/* HUD top-right — on mobile show only SYS_TIME, hide on very small */}
      <div className="fixed top-0 right-0 p-3 sm:p-4 pointer-events-none z-20 text-right font-data-md text-[9px] sm:text-[10px] text-outline/70 leading-relaxed tracking-widest">
        <div className="typewriter" style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}>
          SYS_TIME: <Clock />
        </div>
        <div className="hidden sm:block">
          <HudLine text="ENCRYPTION: AES-256-GCM" delay={0.6} />
          <HudLine text="STATUS: STANDBY" delay={0.9} />
        </div>
      </div>

      {/* Corner HUD brackets — full screen, hidden on mobile to reduce clutter */}
      {[
        "fixed top-14 sm:top-16 left-4 sm:left-8 border-t border-l",
        "fixed top-14 sm:top-16 right-4 sm:right-8 border-t border-r",
        "fixed bottom-4 sm:bottom-8 left-4 sm:left-8 border-b border-l",
        "fixed bottom-4 sm:bottom-8 right-4 sm:right-8 border-b border-r",
      ].map((cls, i) => (
        <div key={i} className={`${cls} w-6 h-6 sm:w-10 sm:h-10 border-outline/20 bracket-animated pointer-events-none z-10`}
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}

      {/* Login card — full width on mobile, capped on larger screens */}
      <div className={`relative z-10 w-full max-w-sm mx-3 sm:mx-4 ${mounted ? "card-mount" : "opacity-0"}`}>
        {/* Card corner brackets */}
        {[
          "absolute -top-3 -left-3 border-t-2 border-l-2 bracket-animated",
          "absolute -top-3 -right-3 border-t-2 border-r-2 bracket-animated",
          "absolute -bottom-3 -left-3 border-b-2 border-l-2 bracket-animated",
          "absolute -bottom-3 -right-3 border-b-2 border-r-2 bracket-animated",
        ].map((cls, i) => (
          <div key={i} className={`${cls} w-5 h-5 sm:w-6 sm:h-6 border-primary`}
            style={{ animationDelay: `${0.5 + i * 0.1}s` }} />
        ))}

        <div className={`bg-surface-container-low border border-outline-variant p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 ${shake ? "animate-shake" : ""}`}
          style={{ backdropFilter: "blur(2px)" }}>

          {/* Header */}
          <div className="text-center border-b border-outline-variant pb-4 sm:pb-5 space-y-1.5 sm:space-y-2">
            <div className="flex justify-center mb-2 sm:mb-3">
              <div className="relative">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <div className="absolute inset-0 rounded-full" style={{
                  background: "radial-gradient(circle, rgba(196,198,207,0.15) 0%, transparent 70%)",
                  animation: "live-pulse 2.5s ease-out infinite",
                }} />
              </div>
            </div>
            <h1 className="font-data-md text-primary tracking-[0.12em] sm:tracking-[0.15em] text-[12px] sm:text-[13px]">
              TRAFFIC WATCH | SYSTEM ACCESS
            </h1>
            <p className="font-label-caps text-[8px] sm:text-[9px] text-outline tracking-widest">
              SECURE OPERATIONAL TERMINAL — BENGALURU TRAFFIC POLICE
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block font-label-caps text-[9px] sm:text-[10px] text-outline tracking-widest mb-1 sm:mb-1.5">ACCESS CODE</label>
              <input className={inputBase} placeholder="OPERATOR_X_XXXX" value={username}
                onChange={e => setUsername(e.target.value)} disabled={isVerifying}
                autoFocus autoComplete="username" />
            </div>
            <div>
              <label className="block font-label-caps text-[9px] sm:text-[10px] text-outline tracking-widest mb-1 sm:mb-1.5">PASSWORD</label>
              <div className="relative">
                <input className={`${inputBase} pr-16`} type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} disabled={isVerifying}
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-label-caps text-[9px] text-outline/60 hover:text-outline tracking-widest transition-colors min-h-[44px] flex items-center">
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {isRegisterMode && (
              <>
                <div>
                  <label className="block font-label-caps text-[9px] sm:text-[10px] text-outline tracking-widest mb-1 sm:mb-1.5">CONFIRM CODE</label>
                  <input className={inputBase} type="password" placeholder="••••••••••••"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isVerifying} />
                </div>
                <div>
                  <label className="block font-label-caps text-[9px] sm:text-[10px] text-outline tracking-widest mb-1 sm:mb-1.5">CLEARANCE LEVEL</label>
                  <select className={`${inputBase} appearance-none`} value={role} onChange={e => setRole(e.target.value)} disabled={isVerifying}>
                    <option value="operator">OPERATOR</option>
                    <option value="supervisor">SUPERVISOR</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
              </>
            )}

            {errorMessage && (
              <div className="flex items-start gap-2 bg-error-container/20 border border-error/30 px-3 py-2.5 font-data-md text-[10px] sm:text-[11px] text-error tracking-widest animate-shake">
                <span className="material-symbols-outlined text-[14px] mt-px flex-shrink-0">warning</span>
                <span className="break-words">{errorMessage}</span>
              </div>
            )}

            {/* Submit — min-height 48px for tap target compliance */}
            <button type="submit" disabled={isVerifying}
              className="btn-scan w-full mt-1 bg-surface-container border border-outline-variant text-primary font-label-caps text-[10px] tracking-[0.22em] min-h-[48px] py-3 sm:py-4 hover:border-primary hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 touch-manipulation">
              <span className={`material-symbols-outlined text-[15px] ${isVerifying ? "animate-spin" : ""}`}>
                {isVerifying ? "refresh" : "arrow_forward"}
              </span>
              {isVerifying ? "AUTHENTICATING..." : isRegisterMode ? "REGISTER OPERATOR" : "VERIFY ACCESS"}
            </button>
          </form>

          {/* Mode toggle — larger tap target on mobile */}
          <button onClick={onAuthModeToggle}
            className="text-center font-label-caps text-[9px] text-outline/50 hover:text-outline/80 tracking-widest transition-colors underline underline-offset-2 decoration-outline/20 min-h-[44px] flex items-center justify-center touch-manipulation">
            {isRegisterMode
              ? "EXISTING OPERATOR? — LOGIN"
              : "REQUEST AUTHORIZED TERMINAL PROVISIONAL ACCESS"}
          </button>

          <p className="font-label-caps text-[7px] sm:text-[8px] text-outline/30 text-center tracking-widest leading-relaxed border-t border-outline-variant pt-3 sm:pt-4">
            UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED UNDER THE IT ACT OF INDIA. ALL ATTEMPTS ARE LOGGED AND TRACED BY UNIT-702 COMMAND.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}