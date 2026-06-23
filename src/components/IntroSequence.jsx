import { useEffect, useRef, useState, useCallback } from "react";

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
const randomChar = () => PIXEL_CHARS[Math.floor(Math.random() * PIXEL_CHARS.length)];

// Draws a proper wireframe sphere with depth-based opacity so arcs on the
// far side fade out rather than cutting off sharply — gives real 3D feel.
function drawWireframeEarth(ctx, cx, cy, r, rotAngle) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const LAT_LINES = 12;
  const LON_LINES = 16;
  const SEGMENTS  = 80;

  // Draw back hemisphere arcs first (lower opacity), then front on top
  for (let pass = 0; pass < 2; pass++) {
    const isFront = pass === 1;

    // Latitude circles
    for (let i = 1; i < LAT_LINES; i++) {
      const lat  = (i / LAT_LINES) * Math.PI - Math.PI / 2;
      const latR = Math.cos(lat) * r;
      const latY = cy + Math.sin(lat) * r;

      ctx.beginPath();
      let penDown = false;
      for (let s = 0; s <= SEGMENTS; s++) {
        const lon     = (s / SEGMENTS) * 2 * Math.PI + rotAngle;
        const cosLon  = Math.cos(lon);
        const isFrontHemi = cosLon >= 0;
        if (isFrontHemi !== isFront) { penDown = false; continue; }

        // Depth-based opacity: brightest at centre (cosLon=1), dim at edge (cosLon=0)
        const depth = isFront ? cosLon : 1 - Math.abs(cosLon);
        const alpha = isFront
          ? 0.15 + depth * 0.55
          : 0.06 + depth * 0.1;

        ctx.strokeStyle = `rgba(196,198,207,${alpha.toFixed(2)})`;
        ctx.lineWidth   = isFront ? 0.8 : 0.4;

        const x = cx + cosLon * latR;
        if (!penDown) { ctx.moveTo(x, latY); penDown = true; }
        else ctx.lineTo(x, latY);
      }
      ctx.stroke();
    }

    // Longitude arcs
    for (let i = 0; i < LON_LINES; i++) {
      const lon    = (i / LON_LINES) * 2 * Math.PI + rotAngle;
      const cosLon = Math.cos(lon);
      const isFrontHemi = cosLon >= 0;
      if (isFrontHemi !== isFront) continue;

      ctx.beginPath();
      for (let s = 0; s <= SEGMENTS; s++) {
        const lat   = (s / SEGMENTS) * Math.PI - Math.PI / 2;
        const cosLat = Math.cos(lat);
        const x = cx + cosLon * cosLat * r;
        const y = cy + Math.sin(lat) * r;

        // Depth fade based on distance from equator and front/back
        const depth = isFront ? Math.abs(cosLon) : 0.15;
        const alpha = isFront
          ? 0.12 + depth * 0.5
          : 0.04 + depth * 0.08;

        ctx.strokeStyle = `rgba(196,198,207,${alpha.toFixed(2)})`;
        ctx.lineWidth   = isFront ? 0.8 : 0.3;

        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // Equator — slightly brighter accent line
  ctx.beginPath();
  ctx.strokeStyle = "rgba(196,198,207,0.35)";
  ctx.lineWidth = 0.9;
  for (let s = 0; s <= SEGMENTS; s++) {
    const lon = (s / SEGMENTS) * 2 * Math.PI + rotAngle;
    const cosLon = Math.cos(lon);
    if (cosLon < 0) continue;
    const x = cx + cosLon * r;
    const y = cy;
    if (s === 0 || Math.cos(((s-1)/SEGMENTS)*2*Math.PI + rotAngle) < 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Outer glow ring
  ctx.beginPath();
  ctx.strokeStyle = "rgba(196,198,207,0.12)";
  ctx.lineWidth = 1.5;
  ctx.arc(cx, cy, r + 1, 0, 2 * Math.PI);
  ctx.stroke();

  // Soft inner glow at centre of visible face
  const grd = ctx.createRadialGradient(cx - r * 0.25, cy, 0, cx, cy, r * 0.9);
  grd.addColorStop(0, "rgba(196,198,207,0.06)");
  grd.addColorStop(1, "rgba(196,198,207,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();
}

function PixelText({ text, startDelay = 0 }) {
  const [displayed, setDisplayed] = useState(
    Array.from(text).map(() => ({ char: randomChar(), resolved: false }))
  );
  const startRef = useRef(null);

  useEffect(() => {
    const DURATION = 1000;
    let raf;
    const run = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const allDone = elapsed >= DURATION + 300;
      setDisplayed(Array.from(text).map((c, i) => {
        const charDelay = (i / text.length) * DURATION;
        if (allDone || elapsed >= charDelay + 300) return { char: c, resolved: true };
        return { char: randomChar(), resolved: false };
      }));
      if (!allDone) raf = requestAnimationFrame(run);
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(run); }, startDelay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [text, startDelay]);

  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center" }}>
      {displayed.map((d, i) => (
        <span key={i} style={{
          color: d.resolved ? "#ffffff" : "rgba(196,198,207,0.35)",
          transition: d.resolved ? "color 0.12s" : "none",
          whiteSpace: "pre",
        }}>{d.char}</span>
      ))}
    </span>
  );
}

export default function IntroSequence({ onComplete }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [phase, setPhase]               = useState(1);
  const [bootLines, setBootLines]       = useState([]);
  const [opacity, setOpacity]           = useState(1);
  const [earthVisible, setEarthVisible] = useState(true);
  const [textVisible, setTextVisible]   = useState(false);
  const [subVisible, setSubVisible]     = useState(false);

  // Canvas size — use window dimensions to fill a big chunk of screen
  const CANVAS_SIZE = Math.min(
    typeof window !== "undefined" ? Math.floor(window.innerHeight * 0.52) : 340,
    480
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = CANVAS_SIZE / 2, cy = CANVAS_SIZE / 2;
    const r  = CANVAS_SIZE / 2 - 6;
    let angle = 0;
    const animate = () => {
      drawWireframeEarth(ctx, cx, cy, r, angle);
      angle += 0.004;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [CANVAS_SIZE]);

  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 200);
    const t2 = setTimeout(() => setSubVisible(true), 800);
    const t3 = setTimeout(() => { setPhase(2); setEarthVisible(false); }, 3600);

    BOOT_LINES.forEach(({ t, text }) => {
      setTimeout(() => setBootLines(p => [...p, text]), 3700 + t);
    });

    const totalBoot = 3700 + BOOT_LINES[BOOT_LINES.length - 1].t + 600;
    const t4 = setTimeout(() => setPhase(3), totalBoot);
    const t5 = setTimeout(() => setOpacity(0), totalBoot + 80);
    const t6 = setTimeout(() => onComplete?.(), totalBoot + 680);

    return () => [t1,t2,t3,t4,t5,t6].forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "#06080c",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity, transition: "opacity 0.6s ease",
      fontFamily: "'JetBrains Mono', monospace",
      overflow: "hidden",
    }}>
      {/* Moving grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        animation: "introGridDrift 16s linear infinite",
      }} />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)",
      }} />

      {/* Phase 1: Earth + text */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "28px",
        opacity: earthVisible ? 1 : 0,
        transition: "opacity 0.5s ease",
        position: "absolute",
      }}>
        {/* Text above globe */}
        <div style={{ textAlign: "center", minHeight: "52px" }}>
          {textVisible && (
            <div style={{ fontSize: "clamp(14px, 2vw, 24px)", fontWeight: 600, letterSpacing: "0.2em", color: "#fff", marginBottom: "10px" }}>
              <PixelText text="WELCOME TO TRAFFIC WATCH" startDelay={0} />
            </div>
          )}
          {subVisible && (
            <div style={{ fontSize: "clamp(8px, 1vw, 11px)", letterSpacing: "0.16em", color: "rgba(196,198,207,0.4)" }}>
              <PixelText text="BENGALURU METRO  ·  TRAFFIC INTELLIGENCE SYSTEM" startDelay={0} />
            </div>
          )}
        </div>

        {/* Globe */}
        <div style={{ position: "relative", width: CANVAS_SIZE, height: CANVAS_SIZE }}>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
            style={{ display: "block" }} />
          {/* Pulsing orbital rings */}
          {[{ inset: -10, delay: "0s", opacity: 0.18 }, { inset: -22, delay: "0.5s", opacity: 0.1 }, { inset: -38, delay: "1s", opacity: 0.06 }].map((ring, i) => (
            <div key={i} style={{
              position: "absolute",
              top: ring.inset, left: ring.inset, right: ring.inset, bottom: ring.inset,
              border: `1px solid rgba(196,198,207,${ring.opacity})`,
              borderRadius: "50%",
              animation: `introRingPulse 2.5s ease-in-out infinite ${ring.delay}`,
            }} />
          ))}
          {/* Coordinate label below globe */}
          <div style={{
            position: "absolute", bottom: -24, left: "50%",
            transform: "translateX(-50%)",
            fontSize: "9px", letterSpacing: "0.12em",
            color: "rgba(196,198,207,0.3)", whiteSpace: "nowrap",
          }}>
            LAT: 12.9716° N &nbsp;·&nbsp; LON: 77.5946° E
          </div>
        </div>
      </div>

      {/* Phase 2: Boot sequence */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transition: "opacity 0.45s ease",
        width: "100%", maxWidth: "580px", padding: "0 24px",
        position: "absolute",
      }}>
        <div style={{
          border: "1px solid rgba(196,198,207,0.1)",
          padding: "22px 26px",
          background: "rgba(196,198,207,0.018)",
        }}>
          <div style={{
            fontSize: "9px", letterSpacing: "0.14em",
            color: "rgba(196,198,207,0.35)", marginBottom: "16px",
            borderBottom: "1px solid rgba(196,198,207,0.07)", paddingBottom: "10px",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>TRAFFIC_WATCH · SYSTEM BOOT · v4.02</span>
            <span>BLR-01</span>
          </div>
          {bootLines.map((line, i) => {
            const isLast  = i === bootLines.length - 1;
            const isGood  = line.includes("NOMINAL");
            return (
              <div key={i} style={{
                fontSize: "11px", letterSpacing: "0.07em",
                color: isLast ? "#c4c6cf" : "rgba(196,198,207,0.5)",
                marginBottom: "7px",
                display: "flex", alignItems: "center", gap: "10px",
                animation: "introBootLineIn 0.2s ease forwards",
              }}>
                <span style={{ color: isGood ? "#4ade80" : "rgba(196,198,207,0.28)", fontSize: "9px", flexShrink: 0 }}>
                  {isGood ? "✓" : "›"}
                </span>
                {line}
                {isLast && phase < 3 && (
                  <span style={{ animation: "introCursorBlink 0.65s steps(2) infinite" }}>_</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes introGridDrift {
          0%   { background-position: 0px 0px; }
          100% { background-position: 32px 32px; }
        }
        @keyframes introRingPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.03); }
        }
        @keyframes introBootLineIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes introCursorBlink {
          0%, 100% { opacity: 0; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}