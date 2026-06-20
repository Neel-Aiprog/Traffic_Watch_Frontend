import { useState, useCallback, useEffect } from "react";
import AccessGate from "./components/AccessGate";
import Dashboard from "./components/Dashboard";
import "./App.css";

export default function App() {
  const [sessionToken, setSessionToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Intro loader states
  const [isBooting, setIsBooting] = useState(true);
  const [bootLog, setBootLog] = useState([]);
  const [bootIndex, setBootIndex] = useState(0);

  const bootLines = [
    "INITIALIZING TRAFFIC_WATCH SECURE LINK...",
    "ESTABLISHING HANDSHAKE WITH PORT 8000...",
    "MOUNTING CRYPTO ENGINE: AES-256-GCM [OK]",
    "VERIFYING LOCAL SUBSYSTEM INTEGRITY...",
    "FETCHING SECTOR BENGALURU_METRO GEOMETRIC REGY...",
    "DECRYPTING CORE TELEMETRY PACKETS...",
    "SYSTEM STATUS: PROVISIONAL STANDBY READY.",
    "ACCESS GATEWAY ENGAGED."
  ];

  useEffect(() => {
    if (bootIndex < bootLines.length) {
      const timeout = setTimeout(() => {
        setBootLog((prev) => [...prev, bootLines[bootIndex]]);
        setBootIndex((prev) => prev + 1);
      }, 250 + Math.random() * 150);
      return () => clearTimeout(timeout);
    } else {
      const finalTimeout = setTimeout(() => {
        setIsBooting(false);
      }, 600);
      return () => clearTimeout(finalTimeout);
    }
  }, [bootIndex]);

  const handleAccessGranted = useCallback((token, userData) => {
    setSessionToken(token);
    setUserInfo(userData);
    setSessionExpiredMessage(null);
  }, []);

  const handleSessionExpired = useCallback(() => {
    setSessionToken(null);
    setUserInfo(null);
    setSessionExpiredMessage("SESSION EXPIRED. RE-ENTER ACCESS CREDENTIALS TO CONTINUE.");
  }, []);

  const handleAuthModeToggle = useCallback(() => {
    setIsRegisterMode(!isRegisterMode);
    setSessionExpiredMessage(null);
  }, [isRegisterMode]);

  return (
    <div className="min-h-screen text-on-surface font-mono relative overflow-hidden bg-[#06080c]">
      
      {/* BACKGROUND CRYPTIC INTERCEPT MATRIX */}
      <div className="absolute inset-0 z-0">
        {/* Dynamic Glowing Sci-Fi Vector Grid Layer */}
        <div className="tactical-hud-grid absolute inset-0 opacity-[0.12]" />
        
        {/* Continuous Scrolling Sub-Data Matrix Lines */}
        <div className="digital-matrix-stream absolute inset-0 opacity-[0.03]" />
      </div>

      <div className="scanline pointer-events-none" />

      {isBooting ? (
        /* 1. INITIAL SYSTEM DIAGNOSTIC BOOT TEXT */
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10 bg-[#06080c]/90">
          <div className="w-full max-w-lg border border-slate-800 bg-[#0b0e14] p-6 space-y-2 text-[11px] tracking-widest text-slate-400">
            <div className="border-b border-slate-900 pb-2 text-slate-500 flex justify-between">
              <span>SYSTEM BOOT LOADER V1.0.4</span>
              <span className="animate-pulse">● RUNNING</span>
            </div>
            <div className="space-y-1 pt-2 font-mono h-48 overflow-hidden flex flex-col justify-end">
              {bootLog.map((line, idx) => (
                <div key={idx} className={idx === bootLines.length - 1 ? "text-white font-bold" : ""}>
                  &gt; {line}
                </div>
              ))}
              {bootIndex < bootLines.length && (
                <div className="text-white">
                  &gt; ENGAGING SECURITY PROTOCOLS<span className="terminal-caret">_</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : !sessionToken ? (
        /* 2. SECURITY PRIVILEGE SELECTION SIGN IN FIELD */
        <div className="min-h-screen flex flex-col items-center justify-center p-6 crt-flicker relative z-10">
          {sessionExpiredMessage && (
            <div className="mb-4 font-data-md text-data-md text-error bg-error-container/20 border border-error/30 p-3 max-w-md w-full text-center">
              {sessionExpiredMessage}
            </div>
          )}
          <AccessGate
            onAccessGranted={handleAccessGranted}
            isRegisterMode={isRegisterMode}
            onAuthModeToggle={handleAuthModeToggle}
          />
        </div>
      ) : (
        /* 3. PRIMARY INTERACTIVE DASHBOARD SYSTEM CONTROLLER */
        <div className="relative z-10">
          <Dashboard
            sessionToken={sessionToken}
            userInfo={userInfo}
            onSessionExpired={handleSessionExpired}
          />
        </div>
      )}
    </div>
  );
}