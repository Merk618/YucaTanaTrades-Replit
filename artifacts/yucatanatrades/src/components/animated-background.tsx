import * as React from "react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
      {/* Primary gold orb — top left */}
      <div
        className="absolute top-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, hsl(43 63% 52% / 0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "orb-drift 18s ease-in-out infinite alternate",
        }}
      />
      {/* Deep blue orb — bottom right */}
      <div
        className="absolute bottom-[-15%] right-[-8%] w-[50%] h-[50%] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, hsl(220 80% 55% / 0.08) 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "orb-drift 22s ease-in-out infinite alternate-reverse",
        }}
      />
      {/* Emerald accent — mid right */}
      <div
        className="absolute top-[35%] right-[-5%] w-[30%] h-[30%] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, hsl(160 100% 39% / 0.10) 0%, transparent 70%)",
          filter: "blur(90px)",
          animation: "orb-drift 26s ease-in-out infinite alternate",
          animationDelay: "4s",
        }}
      />
      {/* Secondary gold — center */}
      <div
        className="absolute top-[55%] left-[30%] w-[35%] h-[25%] rounded-full opacity-15"
        style={{
          background: "radial-gradient(ellipse, hsl(43 63% 52% / 0.07) 0%, transparent 70%)",
          filter: "blur(120px)",
          animation: "orb-drift 30s ease-in-out infinite alternate-reverse",
          animationDelay: "8s",
        }}
      />

      {/* Subtle candlestick grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(43 63% 52% / 0.4) 1px, transparent 1px),
            linear-gradient(90deg, hsl(43 63% 52% / 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.018] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes orb-drift {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(3%, 5%) scale(1.04); }
          66%  { transform: translate(-2%, 3%) scale(0.97); }
          100% { transform: translate(4%, -4%) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="orb-drift"] { animation: none !important; }
        }
      `}} />
    </div>
  );
}
