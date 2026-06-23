// IntroSequence — three-phase animated intro before the AccessGate.
//
// Phase 1 (0–3.5s): Wireframe rotating Earth + cryptic pixel text reveal
// Phase 2 (3.5–6.5s): Boot sequence lines scroll in
// Phase 3 (6.5s+): Fade out, parent unmounts this and mounts AccessGate
//
// All animation is canvas + CSS — zero external dependencies.

import { useEffect, useRef, useState } from "react";

const BOOT_LINES = [
  { t: 0,    text: "INITIALIZING TRAFFIC_WATCH v4.02..." },
  { t: 280,  text: "LOADING ENSEMBLE MODELS [LGB · XGB · CATBOOST]..." },
  { t: 560,  text: "CALIBRATING PROBABILITY THRESHOLDS..." },
  { t: 840,  text: "CONNECTING TO BENGALURU_METRO GRID..." },
  { t: 1120, text: "SPAWNING PREDICTION ENGINE..." },
  { t: 1400, text: "AUTHENTICATING OPERATOR TERMINAL..." },
  { t: 1680, text: "ALL SYSTEMS NOMINAL. STANDBY FOR ACCESS." },
];

const PIXEL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>?/\\|{}[]";

function randomChar() {
  return PIXEL_CHARS[Math.floor(Math.random() * PIXEL_CHARS.length)];
}

// Draws a wireframe sphere using latitude/longitude lines projected
// onto a 2D canvas with a simple rotation angle applied.
function drawWireframeEarth(ctx, cx, cy, r, rotAngle) {
  ctx.clearRect(cx - r - 4, cy - r - 4, r * 2 + 8, r * 2 + 8);
  ctx.strokeStyle = "rgba(196,198,207,0.45)";
  ctx.lineWidth = 0.7;

  const LAT_LINES  = 10;
  const LON_LINES  = 12;
  const SEGMENTS   = 60;

  // Latitude circles
  for (let i = 1; i < LAT_LINES; i++) {
    const lat = (i / LAT_LINES) * Math.PI - Math.PI / 2;
    const latR = Math.cos(lat) * r;
    const latY = cy + Math.sin(lat) * r;
    ctx.beginPath();
    for (let s = 0; s <= SEGMENTS; s++) {
      const lon = (s / SEGMENTS) * 2 * Math.PI + rotAngle;
      const x = cx + Math.cos(lon) * latR;
      // Simple visibility: only draw front hemisphere
      const visible = Math.cos(lon) >= -0.05;
      if (s === 0 || !visible) ctx.moveTo(x, latY);
      else ctx.lineTo(x, latY);
    }
    ctx.stroke();
  }

  // Longitude arcs
  for (let i = 0; i < LON_LINES; i++) {
    const lon = (i / LON_LINES) * Math.PI + rotAngle;
    const visible = Math.cos(lon) >= -0.05;
    if (!visible) continue;
    ctx.beginPath();
    for (let s = 0; s <= SEGMENTS; s++) {
      const lat = (s / SEGMENTS) * Math.PI - Math.PI / 2;
      const x = cx + Math.cos(lon) * Math.cos(lat) * r;
      const y = cy + Math.sin(lat) * r;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Outline circle
  ctx.strokeStyle = "rgba(196,198,207,0.25)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.stroke();
}

// Animated pixel text that scrambles before resolving to final chars.
function PixelText({ text, startDelay = 0, onDone }) {
  const [displayed, setDisplayed] = useState(
    Array.from(text).map(() => ({ char: randomChar(), resolved: false }))
  );
  const frameRef = useRef(0);
  const startRef = useRef(null);

  useEffect(() => {
    const SCRAMBLE_DURATION = 900; // ms per character resolution wave
    let raf;
    const run = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setDisplayed(Array.from(text).map((c, i) => {
        const charDelay = (i / text.length) * SCRAMBLE_DURATION;
        if (elapsed < charDelay) return { char: randomChar(), resolved: false };
        if (elapsed < charDelay + 280) return { char: randomChar(), resolved: false };
        return { char: c, resolved: true };
      }));
      if (elapsed < SCRAMBLE_DURATION + 300) {
        raf = requestAnimationFrame(run);
      } else {
        setDisplayed(Array.from(text).map(c => ({ char: c, resolved: true })));
        onDone?.();
      }
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(run); }, startDelay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [text, startDelay]);

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: "0.18em",
      display: "flex", flexWrap: "wrap", justifyContent: "center",
    }}>
      {displayed.map((d, i) => (
        <span key={i} style={{
          color: d.resolved ? "#ffffff" : "rgba(196,198,207,0.4)",
          transition: d.resolved ? "color 0.15s" : "none",
          fontSize: d.char === " " ? undefined : undefined,
          whiteSpace: "pre",
        }}>{d.char}</span>
      ))}
    </div>
  );
}

export default function IntroSequence({ onComplete }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [phase, setPhase]         = useState(1); // 1 = earth, 2 = boot, 3 = fadeout
  const [bootLines, setBootLines] = useState([]);
  const [opacity, setOpacity]     = useState(1);
  const [earthVisible, setEarthVisible] = useState(true);
  const [textVisible, setTextVisible]   = useState(false);
  const [subVisible, setSubVisible]     = useState(false);
  const mountTime = useRef(Date.now());

  // Wireframe Earth animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const SIZE = canvas.width;
    const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 8;
    let angle = 0;
    const animate = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      drawWireframeEarth(ctx, cx, cy, r, angle);
      angle += 0.006;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Phase transitions
  useEffect(() => {
    // Show pixel text shortly after mount
    const t1 = setTimeout(() => setTextVisible(true), 300);
    const t2 = setTimeout(() => setSubVisible(true), 900);

    // Transition to boot phase
    const t3 = setTimeout(() => {
      setPhase(2);
      setEarthVisible(false);
    }, 3400);

    // Boot lines stagger
    BOOT_LINES.forEach(({ t, text }) => {
      setTimeout(() => {
        setBootLines(prev => [...prev, text]);
      }, 3500 + t);
    });

    // Fade out and call onComplete
    const totalBoot = 3500 + BOOT_LINES[BOOT_LINES.length - 1].t + 700;
    const t4 = setTimeout(() => setPhase(3), totalBoot);
    const t5 = setTimeout(() => setOpacity(0), totalBoot + 100);
    const t6 = setTimeout(() => onComplete?.(), totalBoot + 700);

    return () => [t1,t2,t3,t4,t5,t6].forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "#06080c", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity, transition: "opacity 0.6s ease",
      fontFamily: "'JetBrains Mono', monospace",
      overflow: "hidden",
    }}>
      {/* Subtle grid background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        animation: "gridDrift 18s linear infinite",
      }} />

      {/* Phase 1: Earth + pixel text */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "32px", opacity: earthVisible ? 1 : 0,
        transition: "opacity 0.5s ease",
        position: "absolute",
      }}>
        {/* Wireframe Earth canvas */}
        <div style={{ position: "relative" }}>
          <canvas ref={canvasRef} width={180} height={180}
            style={{ display: "block", filter: "drop-shadow(0 0 12px rgba(196,198,207,0.15))" }} />
          {/* Pulsing ring around earth */}
          <div style={{
            position: "absolute", inset: -8,
            border: "1px solid rgba(196,198,207,0.12)",
            borderRadius: "50%",
            animation: "ringPulse 2s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", inset: -18,
            border: "1px solid rgba(196,198,207,0.06)",
            borderRadius: "50%",
            animation: "ringPulse 2s ease-in-out infinite 0.4s",
          }} />
        </div>

        {/* Pixel-scramble text */}
        <div style={{ textAlign: "center", lineHeight: 1.5 }}>
          {textVisible && (
            <div style={{ fontSize: "22px", fontWeight: 600, letterSpacing: "0.2em", color: "#fff", marginBottom: "10px" }}>
              <PixelText text="WELCOME TO TRAFFIC WATCH" startDelay={0} />
            </div>
          )}
          {subVisible && (
            <div style={{ fontSize: "10px", letterSpacing: "0.18em", color: "rgba(196,198,207,0.45)", marginTop: "6px" }}>
              <PixelText text="BENGALURU METRO · TRAFFIC INTELLIGENCE SYSTEM" startDelay={0} />
            </div>
          )}
        </div>
      </div>

      {/* Phase 2: Boot sequence */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.4s ease",
        width: "100%", maxWidth: "540px", padding: "0 24px",
        position: "absolute",
      }}>
        <div style={{
          border: "1px solid rgba(196,198,207,0.12)",
          padding: "20px 24px",
          background: "rgba(196,198,207,0.02)",
        }}>
          <div style={{
            fontSize: "9px", letterSpacing: "0.12em",
            color: "rgba(196,198,207,0.4)", marginBottom: "14px",
            borderBottom: "1px solid rgba(196,198,207,0.08)", paddingBottom: "10px",
          }}>
            TRAFFIC_WATCH · SYSTEM BOOT · v4.02
          </div>
          {bootLines.map((line, i) => (
            <div key={i} style={{
              fontSize: "11px", letterSpacing: "0.08em",
              color: i === bootLines.length - 1 ? "#c4c6cf" : "rgba(196,198,207,0.55)",
              marginBottom: "6px",
              animation: "bootLineIn 0.25s ease forwards",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{
                color: i === bootLines.length - 1 && line.includes("NOMINAL")
                  ? "#4ade80" : "rgba(196,198,207,0.3)",
                fontSize: "8px",
              }}>
                {line.includes("NOMINAL") ? "✓" : "›"}
              </span>
              {line}
              {i === bootLines.length - 1 && phase < 3 && (
                <span style={{ animation: "cursorBlink 0.7s steps(2) infinite", marginLeft: "2px" }}>_</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 28px 28px; }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.04); }
        }
        @keyframes bootLineIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 0; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}