import * as React from "react";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] mix-blend-screen opacity-50 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] mix-blend-screen opacity-50 animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px] mix-blend-screen opacity-30 animate-pulse" style={{ animationDelay: "4s" }} />
      
      {/* Noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
