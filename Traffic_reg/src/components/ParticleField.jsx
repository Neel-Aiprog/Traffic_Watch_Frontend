import { useMemo } from "react";

// Generates N floating particle divs with randomized positions, sizes,
// and animation durations so the background looks organic rather than
// mechanical. Kept as a separate component so it renders once and
// doesn't re-compute on every parent state change.
export default function ParticleField({ count = 28 }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() > 0.7 ? "2px" : "1px",
    duration: `${14 + Math.random() * 18}s`,
    delay: `${Math.random() * 12}s`,
    opacity: 0.15 + Math.random() * 0.35,
  })), [count]);

  const dataStreams = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    id: i,
    top: `${15 + i * 20}%`,
    duration: `${8 + i * 3}s`,
    delay: `${i * 2.5}s`,
  })), []);

  return (
    <div className="particle-field">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left,
          bottom: "-4px",
          width: p.size,
          height: p.size,
          opacity: p.opacity,
          animationDuration: p.duration,
          animationDelay: p.delay,
        }} />
      ))}
      {dataStreams.map(s => (
        <div key={s.id} className="data-stream-line" style={{
          top: s.top,
          animationDuration: s.duration,
          animationDelay: s.delay,
        }} />
      ))}
    </div>
  );
}