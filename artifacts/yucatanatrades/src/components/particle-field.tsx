/**
 * Tab-specific particle engine.
 *
 * Each route has its own particle theme with finance-themed text labels
 * (ticker symbols, AI glyphs) and colored dot particles with connection lines.
 *
 * ── How to adjust intensity ──────────────────────────────────────────────────
 * - Reduce particle count: lower `dotCount` / `labelCount` in PARTICLE_THEMES
 * - Lower opacity: change `rand(0.08, 0.22)` in spawnDot / `rand(0.06, 0.16)` in spawnLabel
 * - Disable particles: set env check at top of useEffect
 * - Adjust speed: change `speed` in each theme entry
 *
 * ── How to add a new tab theme ───────────────────────────────────────────────
 * Add a new entry to PARTICLE_THEMES keyed by the wouter route path.
 *
 * ── How to disable particles ─────────────────────────────────────────────────
 * Set PARTICLES_DISABLED = true below.
 *
 * ── Reduced motion ───────────────────────────────────────────────────────────
 * If prefers-reduced-motion is set, no canvas is rendered.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Set to true to globally disable particles (for debugging or low-end devices)
const PARTICLES_DISABLED = false;

// ─── Per-tab theme definitions ────────────────────────────────────────────────
type ParticleTheme = {
  dotColors: string[];      // "r,g,b" strings for dot particles
  labelColors: string[];    // "r,g,b" strings for text label particles
  labels: string[];         // pool of text labels to draw
  dotCount: number;
  labelCount: number;
  speed: number;            // velocity multiplier (lower = slower)
};

// Each key is a wouter route path.
// To add a new tab: add an entry with the route as key.
const PARTICLE_THEMES: Record<string, ParticleTheme> = {
  "/": { // Command Center — gold/champagne AI hub
    dotColors:   ["212,175,55", "247,231,180", "34,197,94", "255,255,255"],
    labelColors: ["212,175,55", "247,231,180", "34,197,94"],
    labels:      ["AI", "SPY", "QQQ", "BTC", "ETH", "NVDA", "MSFT"],
    dotCount:    36, labelCount: 14, speed: 0.22,
  },
  "/markets": { // Markets — emerald/red live market flow
    dotColors:   ["34,197,94", "239,68,68", "212,175,55", "255,255,255"],
    labelColors: ["34,197,94", "239,68,68", "212,175,55"],
    labels:      ["SPY", "QQQ", "DIA", "IWM", "▲", "▼", "BTC", "ETH"],
    dotCount:    30, labelCount: 18, speed: 0.30,
  },
  "/scanners": { // Scanners — amber/gold signal detection
    dotColors:   ["212,175,55", "251,191,36", "34,197,94", "249,115,22"],
    labelColors: ["212,175,55", "251,191,36", "249,115,22"],
    labels:      ["MOM", "BO", "RS", "SIG", "SCAN", "◉"],
    dotCount:    28, labelCount: 16, speed: 0.25,
  },
  "/research": { // Research — champagne/blue-gray intelligence nodes
    dotColors:   ["247,231,180", "148,163,184", "212,175,55", "255,255,255"],
    labelColors: ["212,175,55", "247,231,180", "148,163,184"],
    labels:      ["SEC", "NEWS", "AI", "DATA", "ALPHA", "◆"],
    dotCount:    24, labelCount: 12, speed: 0.18,
  },
  "/portfolio": { // Portfolio — gold/emerald wealth engine
    dotColors:   ["212,175,55", "34,197,94", "247,231,180", "255,255,255"],
    labelColors: ["212,175,55", "34,197,94"],
    labels:      ["P&L", "NAV", "ROTH", "IRA", "◆", "●"],
    dotCount:    26, labelCount: 12, speed: 0.20,
  },
  "/bots": { // Bots — teal/emerald automation circuit
    dotColors:   ["34,197,94", "212,175,55", "20,184,166", "255,255,255"],
    labelColors: ["34,197,94", "20,184,166", "212,175,55"],
    labels:      ["RUN", "SCAN", "READ", "BOT", "ALGO", "◉"],
    dotCount:    28, labelCount: 14, speed: 0.26,
  },
  "/journal": { // Journal — champagne/gold memory drift
    dotColors:   ["247,231,180", "212,175,55", "255,255,255"],
    labelColors: ["247,231,180", "212,175,55"],
    labels:      ["ENTRY", "EXIT", "WIN", "P&L", "◆"],
    dotCount:    22, labelCount: 10, speed: 0.16,
  },
  "/watchlist": { // Watchlist — gold/emerald orbit
    dotColors:   ["212,175,55", "34,197,94", "247,231,180", "255,255,255"],
    labelColors: ["212,175,55", "34,197,94"],
    labels:      ["★", "WATCH", "ALERT", "BUY", "●"],
    dotCount:    22, labelCount: 10, speed: 0.18,
  },
  "/risk": { // Risk — gold/amber/red defensive pulse
    dotColors:   ["212,175,55", "239,68,68", "251,191,36", "249,115,22"],
    labelColors: ["212,175,55", "239,68,68", "251,191,36"],
    labels:      ["VAR", "DD", "STOP", "RISK", "▲"],
    dotCount:    24, labelCount: 12, speed: 0.18,
  },
  "/settings": { // Settings — muted gray/gold control
    dotColors:   ["148,163,184", "212,175,55", "247,231,180"],
    labelColors: ["148,163,184", "212,175,55"],
    labels:      ["API", "SET", "CFG", "◆"],
    dotCount:    16, labelCount: 8, speed: 0.14,
  },
};

// ─── Particle type ────────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  maxOpacity: number;
  color: string;         // "r,g,b" format
  type: "dot" | "label";
  label?: string;
  fontSize?: number;
  phase: number;
  phaseSpeed: number;
}

function getTheme(route: string): ParticleTheme {
  if (PARTICLE_THEMES[route]) return PARTICLE_THEMES[route]!;
  for (const key of Object.keys(PARTICLE_THEMES)) {
    if (key !== "/" && route.startsWith(key)) return PARTICLE_THEMES[key]!;
  }
  return PARTICLE_THEMES["/"]!;
}

function r(min: number, max: number) { return Math.random() * (max - min) + min; }

function spawnDot(w: number, h: number, theme: ParticleTheme, fadingIn: boolean): Particle {
  const color = theme.dotColors[Math.floor(Math.random() * theme.dotColors.length)]!;
  const maxOp = r(0.08, 0.22);
  return {
    x: Math.random() * w, y: Math.random() * h,
    vx: r(-0.35, 0.35) * theme.speed, vy: r(-0.35, 0.35) * theme.speed,
    radius: r(0.6, 2.0),
    opacity: fadingIn ? 0 : maxOp,
    maxOpacity: maxOp, color, type: "dot",
    phase: Math.random() * Math.PI * 2, phaseSpeed: r(0.008, 0.022),
  };
}

function spawnLabel(w: number, h: number, theme: ParticleTheme, fadingIn: boolean): Particle {
  const color = theme.labelColors[Math.floor(Math.random() * theme.labelColors.length)]!;
  const label = theme.labels[Math.floor(Math.random() * theme.labels.length)]!;
  const maxOp = r(0.06, 0.16);
  return {
    x: Math.random() * w, y: Math.random() * h,
    vx: r(-0.2, 0.2) * theme.speed, vy: r(-0.15, 0.15) * theme.speed,
    radius: 0,
    opacity: fadingIn ? 0 : maxOp,
    maxOpacity: maxOp, color, type: "label",
    label, fontSize: Math.random() > 0.4 ? 9 : 11,
    phase: Math.random() * Math.PI * 2, phaseSpeed: r(0.005, 0.015),
  };
}

function spawnAll(w: number, h: number, theme: ParticleTheme, fadingIn: boolean): Particle[] {
  return [
    ...Array.from({ length: theme.dotCount },   () => spawnDot(w, h, theme, fadingIn)),
    ...Array.from({ length: theme.labelCount }, () => spawnLabel(w, h, theme, fadingIn)),
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ParticleField() {
  const [location] = useLocation();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    particles:  [] as Particle[],
    route:      location,
    fadingOut:  false,
    rafId:      0,
    lastTime:   0,
  });

  // ── Main canvas setup (runs once on mount) ──────────────────────────────────
  useEffect(() => {
    if (PARTICLES_DISABLED) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.innerWidth < 768) return;          // disable on mobile

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // Spawn initial particles
    const s = stateRef.current;
    const theme = getTheme(location);
    s.particles = spawnAll(canvas.width, canvas.height, theme, false);

    const CONNECTION_DIST = 100;
    const FADE_IN_RATE    = 0.003;
    const FADE_OUT_RATE   = 0.004;

    // ── Render loop ──────────────────────────────────────────────────────────
    const draw = (time: number) => {
      const dt = Math.min((time - s.lastTime) / 16, 3);
      s.lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textBaseline = "middle";
      ctx.textAlign    = "left";

      const ps   = s.particles;
      const dots = ps.filter((p) => p.type === "dot");

      // Connection lines between nearby dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx   = dots[i]!.x - dots[j]!.x;
          const dy   = dots[i]!.y - dots[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const t     = 1 - dist / CONNECTION_DIST;
            const alpha = t * t * 0.06 * Math.min(dots[i]!.opacity, dots[j]!.opacity) / 0.15;
            if (alpha > 0.005) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(196,164,74,${Math.min(0.08, alpha)})`;
              ctx.lineWidth   = 0.4;
              ctx.moveTo(dots[i]!.x, dots[i]!.y);
              ctx.lineTo(dots[j]!.x, dots[j]!.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw and update each particle
      for (const p of ps) {
        p.phase += p.phaseSpeed;
        const breathTarget = p.maxOpacity * (0.55 + 0.45 * Math.sin(p.phase));

        if (s.fadingOut) {
          p.opacity = Math.max(0, p.opacity - FADE_OUT_RATE);
        } else {
          p.opacity = Math.min(breathTarget, p.opacity + FADE_IN_RATE);
        }

        if (p.opacity < 0.005) continue;

        ctx.globalAlpha = p.opacity;

        if (p.type === "label" && p.label) {
          ctx.font      = `600 ${p.fontSize ?? 9}px "JetBrains Mono", monospace`;
          ctx.fillStyle = `rgb(${p.color})`;
          ctx.fillText(p.label, p.x, p.y);
        } else {
          ctx.fillStyle = `rgb(${p.color})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          if (p.radius > 1.2) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color},0.06)`;
            ctx.fill();
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -24) p.x = canvas.width  + 24;
        if (p.x > canvas.width  + 24) p.x = -24;
        if (p.y < -16) p.y = canvas.height + 16;
        if (p.y > canvas.height + 16) p.y = -16;
      }

      ctx.globalAlpha = 1;
      s.rafId = requestAnimationFrame(draw);
    };

    s.rafId = requestAnimationFrame(draw);

    const handleResize = () => {
      resize();
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(s.rafId);
      } else {
        s.lastTime = 0;
        s.rafId    = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(s.rafId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Route change → fade out then spawn new theme ──────────────────────────
  useEffect(() => {
    const s = stateRef.current;
    if (s.route === location) return;
    s.route = location;

    const canvas = canvasRef.current;
    if (!canvas) return;

    s.fadingOut = true;

    // After fade-out (~700ms at FADE_OUT_RATE 0.004 * 60fps ≈ 42 frames ≈ 700ms),
    // spawn new theme particles that fade in
    const timer = setTimeout(() => {
      const theme = getTheme(location);
      s.particles = spawnAll(canvas.width, canvas.height, theme, true);
      s.fadingOut  = false;
    }, 700);

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 hidden md:block"
      aria-hidden="true"
    />
  );
}
