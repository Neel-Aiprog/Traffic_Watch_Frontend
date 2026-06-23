import { useState, useCallback } from "react";
import AccessGate from "./components/AccessGate";
import Dashboard from "./components/Dashboard";
import IntroSequence from "./components/IntroSequence";
import "./App.css";

export default function App() {
  const [showIntro, setShowIntro]         = useState(true);
  const [sessionToken, setSessionToken]   = useState(null);
  const [userInfo, setUserInfo]           = useState(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

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
    setIsRegisterMode(prev => !prev);
    setSessionExpiredMessage(null);
  }, []);

  // Intro plays once, then unmounts permanently
  if (showIntro) {
    return <IntroSequence onComplete={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen text-on-surface font-body-md selection:bg-primary selection:text-on-primary">
      <div className="scanline pointer-events-none" />

      {!sessionToken ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 crt-flicker">
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
        <Dashboard
          sessionToken={sessionToken}
          userInfo={userInfo}
          onSessionExpired={handleSessionExpired}
        />
      )}
    </div>
  );
}