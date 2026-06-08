import * as React from "react";

// Floating ticker symbols — adjust opacity in float-symbol keyframe (index.css)
// to change how visible these are (currently 2–3.2% opacity)
const FLOAT_SYMBOLS = [
  { label: "NVDA",   x: "8%",   y: "12%", size: 14, dur: "28s", delay: "0s"    },
  { label: "MSFT",   x: "22%",  y: "72%", size: 12, dur: "34s", delay: "5s"    },
  { label: "BTC",    x: "78%",  y: "18%", size: 16, dur: "31s", delay: "2s"    },
  { label: "ETH",    x: "88%",  y: "65%", size: 13, dur: "26s", delay: "8s"    },
  { label: "SPY",    x: "45%",  y: "8%",  size: 14, dur: "38s", delay: "12s"   },
  { label: "QQQ",    x: "62%",  y: "82%", size: 12, dur: "29s", delay: "4s"    },
  { label: "SUI",    x: "15%",  y: "45%", size: 11, dur: "42s", delay: "18s"   },
  { label: "AI",     x: "55%",  y: "55%", size: 18, dur: "36s", delay: "7s"    },
  { label: "ALPHA",  x: "33%",  y: "28%", size: 11, dur: "44s", delay: "15s"   },
  { label: "SIGNAL", x: "72%",  y: "40%", size: 11, dur: "32s", delay: "22s"   },
  { label: "RISK",   x: "5%",   y: "80%", size: 12, dur: "48s", delay: "10s"   },
  { label: "FLOW",   x: "91%",  y: "30%", size: 11, dur: "40s", delay: "3s"    },
];

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">

      {/* Layer 0: Deep gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 10%, hsl(43 50% 12% / 0.06) 0%, transparent 60%), " +
            "radial-gradient(ellipse 100% 100% at 80% 90%, hsl(220 80% 20% / 0.05) 0%, transparent 60%)",
        }}
      />

      {/* Layer 1: Primary gold orb — top left */}
      <div
        className="absolute top-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, hsl(43 63% 52% / 0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "orb-drift 18s ease-in-out infinite alternate",
        }}
      />

      {/* Layer 1: Deep blue orb — bottom right */}
      <div
        className="absolute bottom-[-15%] right-[-8%] w-[50%] h-[50%] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, hsl(220 80% 55% / 0.08) 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "orb-drift 22s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* Layer 1: Emerald accent — mid right */}
      <div
        className="absolute top-[35%] right-[-5%] w-[30%] h-[30%] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, hsl(160 100% 39% / 0.10) 0%, transparent 70%)",
          filter: "blur(90px)",
          animation: "orb-drift 26s ease-in-out infinite alternate",
          animationDelay: "4s",
        }}
      />

      {/* Layer 1: Secondary gold — center */}
      <div
        className="absolute top-[55%] left-[30%] w-[35%] h-[25%] rounded-full opacity-[0.15]"
        style={{
          background: "radial-gradient(ellipse, hsl(43 63% 52% / 0.07) 0%, transparent 70%)",
          filter: "blur(120px)",
          animation: "orb-drift 30s ease-in-out infinite alternate-reverse",
          animationDelay: "8s",
        }}
      />

      {/* Layer 2: Subtle market grid */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: [
            "linear-gradient(hsl(43 63% 52% / 0.5) 1px, transparent 1px)",
            "linear-gradient(90deg, hsl(43 63% 52% / 0.5) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "48px 48px",
        }}
      />

      {/* Layer 2: Floating ticker symbols — 2–3% opacity, very slow drift */}
      {FLOAT_SYMBOLS.map((s) => (
        <div
          key={s.label}
          className="absolute font-mono font-bold select-none"
          style={{
            left: s.x,
            top: s.y,
            fontSize: s.size,
            color: "#D4AF37",
            opacity: 0.025,
            letterSpacing: "0.08em",
            animation: `float-symbol ${s.dur} ease-in-out infinite alternate`,
            animationDelay: s.delay,
          }}
        >
          {s.label}
        </div>
      ))}

      {/* Layer 3: Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.018] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
