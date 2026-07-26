import * as React from "react";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion";
import { workspaceRouteForLocation } from "@/navigation/workspace-navigation";

type LayerPosition = readonly [x: number, y: number, scale: number];

type AtmosphereProfile = {
  key: string;
  teal: LayerPosition;
  mineral: LayerPosition;
  gold: LayerPosition;
};

const signalMotes = [
  { x: "12%", y: "22%", delay: "-3s", depth: "0.72" },
  { x: "27%", y: "66%", delay: "-11s", depth: "0.48" },
  { x: "42%", y: "31%", delay: "-17s", depth: "0.88" },
  { x: "56%", y: "78%", delay: "-7s", depth: "0.56" },
  { x: "68%", y: "18%", delay: "-21s", depth: "0.8" },
  { x: "76%", y: "57%", delay: "-14s", depth: "0.46" },
  { x: "87%", y: "35%", delay: "-25s", depth: "0.66" },
  { x: "93%", y: "74%", delay: "-9s", depth: "0.42" },
] as const;

const profiles: Record<string, AtmosphereProfile> = {
  overview: {
    key: "overview",
    teal: [-8, -2, 1],
    mineral: [5, 0, 1.02],
    gold: [0, 0, 1],
  },
  markets: {
    key: "markets",
    teal: [-15, -8, 1.06],
    mineral: [12, 3, 1.04],
    gold: [9, -5, 0.94],
  },
  charts: {
    key: "charts",
    teal: [-3, 8, 0.95],
    mineral: [10, -7, 1.08],
    gold: [-12, 4, 0.92],
  },
  portfolio: {
    key: "portfolio",
    teal: [-12, 6, 1.02],
    mineral: [7, -4, 0.98],
    gold: [5, 5, 1.04],
  },
  research: {
    key: "research",
    teal: [-4, -8, 0.97],
    mineral: [11, 5, 1.05],
    gold: [-8, 8, 0.96],
  },
  news: {
    key: "news",
    teal: [-16, 2, 1.04],
    mineral: [13, -5, 1.03],
    gold: [8, 0, 0.95],
  },
  "ai-hub": {
    key: "ai-hub",
    teal: [-5, 3, 1.05],
    mineral: [8, -9, 1.08],
    gold: [-4, 7, 1.02],
  },
  settings: {
    key: "settings",
    teal: [-4, 0, 0.94],
    mineral: [6, 3, 0.93],
    gold: [0, 5, 0.88],
  },
  utility: {
    key: "utility",
    teal: [-7, 0, 0.98],
    mineral: [7, 0, 1],
    gold: [0, 2, 0.91],
  },
};

function profileForRoute(location: string): AtmosphereProfile {
  if (location === "/") return profiles.overview;
  const workspaceRoute = workspaceRouteForLocation(location);
  if (workspaceRoute) return profiles[workspaceRoute.id];
  if (location.startsWith("/settings")) return profiles.settings;
  return profiles.utility;
}

function useAtmosphericParallax(
  ref: React.RefObject<HTMLDivElement | null>,
  reducedMotion: boolean,
) {
  React.useEffect(() => {
    if (reducedMotion || typeof window === "undefined") return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const root = ref.current;
    if (!root || !finePointer.matches) return;

    let frame = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const render = () => {
      frame = 0;
      if (document.hidden) return;
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      root.style.setProperty("--yt-meridian-pointer-x", `${currentX.toFixed(2)}px`);
      root.style.setProperty("--yt-meridian-pointer-y", `${currentY.toFixed(2)}px`);

      if (Math.abs(targetX - currentX) > 0.08 || Math.abs(targetY - currentY) > 0.08) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = ((event.clientX / Math.max(window.innerWidth, 1)) - 0.5) * 10;
      targetY = ((event.clientY / Math.max(window.innerHeight, 1)) - 0.5) * 8;
      schedule();
    };

    const reset = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) return;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      currentX = 0;
      currentY = 0;
      targetX = 0;
      targetY = 0;
      root.style.setProperty("--yt-meridian-pointer-x", "0px");
      root.style.setProperty("--yt-meridian-pointer-y", "0px");
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", reset, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reducedMotion, ref]);
}

function AuroraLayer({
  className,
  position,
  reducedMotion,
}: {
  className: string;
  position: LayerPosition;
  reducedMotion: boolean;
}) {
  const [x, y, scale] = position;

  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ x, y, scale }}
      transition={reducedMotion
        ? { duration: 0.06 }
        : { duration: motionTokens.duration.atmosphereRoute, ease: motionTokens.ease.atmosphere }}
    >
      <div className="yt-meridian-atmosphere__aurora-drift" />
    </motion.div>
  );
}

export function MeridianAtmosphere({
  location,
  reducedMotion,
}: {
  location: string;
  reducedMotion: boolean;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const profile = profileForRoute(location);
  useAtmosphericParallax(rootRef, reducedMotion);

  return (
    <div
      ref={rootRef}
      className="yt-meridian-atmosphere"
      data-route={profile.key}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-hidden="true"
    >
      <div className="yt-meridian-atmosphere__base" />
      <div className="yt-meridian-atmosphere__workspace-light" />
      <div className="yt-meridian-atmosphere__field yt-meridian-atmosphere__field--grid" />
      <div className="yt-meridian-atmosphere__field yt-meridian-atmosphere__field--contours">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
          <path d="M-90 566C178 430 330 670 582 528s356-214 555-84 293 106 436-4" />
          <path d="M-78 635c265-128 404 82 649-75s346-262 582-107 301 89 436-21" />
          <path d="M92 215c203 86 325-2 495 75s312 17 448-86 269-132 512-15" />
        </svg>
      </div>
      <div className="yt-meridian-atmosphere__field yt-meridian-atmosphere__field--topology">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
          <path className="yt-meridian-topology__path yt-meridian-topology__path--primary" d="M-24 390C168 314 288 350 420 302s256-136 426-71 303 42 618-88" />
          <path className="yt-meridian-topology__path yt-meridian-topology__path--secondary" d="M-30 724c188-163 362-59 521-149s297-243 489-133 288 133 500-14" />
          <path className="yt-meridian-topology__path yt-meridian-topology__path--link" d="M256 840c72-231 167-307 339-384s271-66 389-224 231-174 502-136" />
          <g className="yt-meridian-topology__nodes">
            <circle cx="421" cy="302" r="2" />
            <circle cx="846" cy="231" r="2" />
            <circle cx="980" cy="442" r="2" />
            <circle cx="595" cy="456" r="2" />
          </g>
        </svg>
      </div>
      <div className="yt-meridian-atmosphere__parallax">
        <AuroraLayer
          className="yt-meridian-atmosphere__aurora yt-meridian-atmosphere__aurora--teal"
          position={profile.teal}
          reducedMotion={reducedMotion}
        />
        <AuroraLayer
          className="yt-meridian-atmosphere__aurora yt-meridian-atmosphere__aurora--mineral"
          position={profile.mineral}
          reducedMotion={reducedMotion}
        />
        <AuroraLayer
          className="yt-meridian-atmosphere__aurora yt-meridian-atmosphere__aurora--gold"
          position={profile.gold}
          reducedMotion={reducedMotion}
        />
        <div className="yt-meridian-atmosphere__signal-lane"><span /></div>
        <div className="yt-meridian-atmosphere__motes">
          {signalMotes.map((mote, index) => (
            <span
              key={`${mote.x}-${mote.y}`}
              className="yt-meridian-atmosphere__mote"
              style={{
                "--yt-mote-x": mote.x,
                "--yt-mote-y": mote.y,
                "--yt-mote-delay": mote.delay,
                "--yt-mote-depth": mote.depth,
              } as React.CSSProperties}
              data-mote={index + 1}
            />
          ))}
        </div>
      </div>
      <div className="yt-meridian-atmosphere__vignette" />
    </div>
  );
}
