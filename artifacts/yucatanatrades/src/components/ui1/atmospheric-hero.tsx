import * as React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Globe2, SunMedium } from "lucide-react";
import type { MarketBriefing } from "@/contracts/dashboard";
import { motionTokens } from "@/lib/motion";
import { TruthBadge } from "@/components/ui1/truth-badge";
import "@/meridian-eclipse-hero.css";

const primaryWave = {
  rest: "M342 207 C415 181 462 256 535 215 C606 175 636 77 711 111 C795 149 821 229 899 183 C966 144 1015 124 1085 158",
  rise: "M342 211 C417 171 467 246 538 208 C608 170 640 63 714 103 C793 146 829 219 901 176 C967 137 1018 133 1085 151",
  settle: "M342 204 C414 188 459 263 532 219 C602 178 631 85 708 116 C794 151 817 235 896 188 C965 147 1012 119 1085 161",
} as const;

const secondaryWaves = [
  {
    className: "is-jade",
    rest: "M326 235 C397 211 449 268 513 238 C581 206 619 150 684 165 C755 182 805 234 871 215 C947 193 1012 171 1091 185",
    drift: "M326 232 C400 204 450 262 516 233 C584 203 620 143 686 160 C758 179 806 228 873 209 C949 187 1014 168 1091 181",
  },
  {
    className: "is-mineral",
    rest: "M354 154 C426 133 472 184 536 168 C604 150 648 105 708 126 C776 150 826 185 891 158 C961 130 1018 108 1088 129",
    drift: "M354 158 C426 126 474 177 538 163 C608 147 649 99 710 121 C778 146 827 179 892 153 C963 124 1020 113 1088 133",
  },
  {
    className: "is-context",
    rest: "M330 268 C406 249 470 276 540 260 C616 243 662 209 728 221 C805 236 853 260 918 241 C984 222 1034 210 1090 217",
    drift: "M330 265 C409 245 472 273 542 256 C618 239 664 204 730 217 C807 232 854 256 920 237 C986 218 1035 206 1090 214",
  },
] as const;

const depthParticles = [
  { x: 384, y: 82, r: 1.1, delay: -2.4, duration: 15, tone: "gold" },
  { x: 446, y: 116, r: 0.8, delay: -8.1, duration: 18, tone: "ice" },
  { x: 512, y: 66, r: 1.35, delay: -4.8, duration: 21, tone: "gold" },
  { x: 578, y: 134, r: 0.72, delay: -11.2, duration: 17, tone: "teal" },
  { x: 641, y: 78, r: 0.92, delay: -6.6, duration: 20, tone: "ice" },
  { x: 702, y: 50, r: 1.2, delay: -14.3, duration: 23, tone: "gold" },
  { x: 754, y: 142, r: 0.78, delay: -9.7, duration: 16, tone: "teal" },
  { x: 813, y: 88, r: 1, delay: -1.9, duration: 19, tone: "ice" },
  { x: 872, y: 126, r: 0.68, delay: -12.8, duration: 22, tone: "gold" },
  { x: 924, y: 64, r: 1.18, delay: -5.1, duration: 18, tone: "teal" },
  { x: 972, y: 105, r: 0.76, delay: -16.4, duration: 24, tone: "ice" },
  { x: 1031, y: 75, r: 0.92, delay: -7.3, duration: 20, tone: "gold" },
] as const;

const signalTracks = [
  {
    className: "is-primary",
    x: [342, 411, 478, 548, 618, 683, 748, 814, 881, 949, 1019, 1085],
    y: [207, 190, 237, 207, 154, 104, 128, 198, 195, 153, 135, 158],
    duration: 10.8,
    delay: 2.8,
  },
  {
    className: "is-secondary",
    x: [326, 397, 466, 536, 606, 676, 746, 816, 886, 956, 1026, 1091],
    y: [235, 218, 260, 228, 194, 163, 180, 225, 211, 190, 174, 185],
    duration: 15.4,
    delay: 6.2,
  },
] as const;

const intelligenceNodes = [
  { name: "Momentum", x: 535, y: 215, className: "is-momentum" },
  { name: "Volatility", x: 711, y: 111, className: "is-volatility" },
  { name: "Concentration", x: 818, y: 205, className: "is-concentration" },
  { name: "Breadth", x: 899, y: 183, className: "is-breadth" },
  { name: "Risk", x: 1015, y: 137, className: "is-risk" },
] as const;

const briefingContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.31,
    },
  },
};

const briefingItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: motionTokens.ease.out },
  },
};

function usePageVisibility() {
  const [pageVisible, setPageVisible] = React.useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );

  React.useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return pageVisible;
}

type AtmosphereArtworkProps = {
  reducedMotion: boolean;
  ambientActive: boolean;
  waveX: ReturnType<typeof useTransform>;
  waveY: ReturnType<typeof useTransform>;
  depthX: ReturnType<typeof useTransform>;
  depthY: ReturnType<typeof useTransform>;
};

const AtmosphereArtwork = React.memo(function AtmosphereArtwork({
  reducedMotion,
  ambientActive,
  waveX,
  waveY,
  depthX,
  depthY,
}: AtmosphereArtworkProps) {
  const canAnimate = ambientActive && !reducedMotion;
  const revealTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.9, ease: motionTokens.ease.out, delay: 0.45 };

  return (
    <motion.div
      className="yt-hero-visual yt-eclipse-visual"
      aria-hidden="true"
      initial={reducedMotion ? false : { opacity: 0, scale: 1.012 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={revealTransition}
    >
      <div className="yt-eclipse-aurora" />
      <div className="yt-eclipse-scan" />
      <svg className="yt-hero-art yt-eclipse-art" viewBox="0 0 1080 340" preserveAspectRatio="none">
        <defs>
          <linearGradient id="yt-eclipse-primary" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#9ec0bd" stopOpacity="0" />
            <stop offset="16%" stopColor="#b8cbc2" stopOpacity="0.32" />
            <stop offset="46%" stopColor="#f0d49b" stopOpacity="0.96" />
            <stop offset="72%" stopColor="#ffe6ad" stopOpacity="0.86" />
            <stop offset="100%" stopColor="#a5c3bd" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="yt-eclipse-jade" x1="0" x2="1">
            <stop offset="0%" stopColor="#69a894" stopOpacity="0" />
            <stop offset="48%" stopColor="#82c0a2" stopOpacity="0.66" />
            <stop offset="100%" stopColor="#579780" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="yt-eclipse-mineral" x1="0" x2="1">
            <stop offset="0%" stopColor="#71a3ae" stopOpacity="0" />
            <stop offset="50%" stopColor="#7db7c1" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#5f8f9c" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="yt-eclipse-terrain-back" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#355564" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#091c27" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="yt-eclipse-terrain-mid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#294b55" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#061a24" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="yt-eclipse-terrain-front" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#183a45" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#04151e" stopOpacity="0.98" />
          </linearGradient>
          <radialGradient id="yt-eclipse-horizon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f2d59d" stopOpacity="0.55" />
            <stop offset="36%" stopColor="#6d9eaa" stopOpacity="0.17" />
            <stop offset="100%" stopColor="#071a25" stopOpacity="0" />
          </radialGradient>
          <filter id="yt-eclipse-path-bloom" x="-15%" y="-80%" width="130%" height="260%">
            <feGaussianBlur stdDeviation="3.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="yt-eclipse-node-bloom" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.8" />
          </filter>
          <pattern id="yt-eclipse-grid" width="58" height="42" patternUnits="userSpaceOnUse">
            <path d="M58 0H0V42" fill="none" stroke="#85a8ad" strokeOpacity="0.075" strokeWidth="0.65" />
          </pattern>
        </defs>

        <rect x="320" y="0" width="760" height="340" fill="url(#yt-eclipse-grid)" className="yt-eclipse-grid" />
        <ellipse cx="760" cy="274" rx="350" ry="82" fill="url(#yt-eclipse-horizon)" className="yt-eclipse-horizon-glow" />

        <motion.g className="yt-eclipse-terrain" style={reducedMotion ? undefined : { x: depthX, y: depthY }}>
          <motion.path
            d="M292 282 C378 260 434 270 510 239 C586 209 646 237 718 205 C789 174 856 205 921 178 C984 151 1030 167 1080 147 V340 H292 Z"
            fill="url(#yt-eclipse-terrain-back)"
            initial={reducedMotion ? false : { opacity: 0, y: 9 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.92, delay: 0.56, ease: motionTokens.ease.out }}
          />
          <motion.path
            d="M276 304 C358 279 424 292 495 260 C567 227 627 267 700 230 C774 193 837 239 902 211 C972 181 1028 207 1080 180 V340 H276 Z"
            fill="url(#yt-eclipse-terrain-mid)"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 1, delay: 0.63, ease: motionTokens.ease.out }}
          />
          <motion.path
            d="M250 329 C346 301 408 319 479 290 C553 260 612 301 682 270 C752 239 819 286 889 252 C959 218 1023 247 1080 219 V340 H250 Z"
            fill="url(#yt-eclipse-terrain-front)"
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 1.05, delay: 0.7, ease: motionTokens.ease.out }}
          />
          <path d="M276 304 C358 279 424 292 495 260 C567 227 627 267 700 230 C774 193 837 239 902 211 C972 181 1028 207 1080 180" className="yt-eclipse-terrain-edge is-mid" />
          <path d="M250 329 C346 301 408 319 479 290 C553 260 612 301 682 270 C752 239 819 286 889 252 C959 218 1023 247 1080 219" className="yt-eclipse-terrain-edge is-front" />
        </motion.g>

        <motion.g className="yt-eclipse-wave-field" style={reducedMotion ? undefined : { x: waveX, y: waveY }}>
          {secondaryWaves.map((wave, index) => (
            <motion.path
              key={wave.className}
              className={`yt-eclipse-wave yt-eclipse-wave--secondary ${wave.className}`}
              d={wave.rest}
              fill="none"
              initial={reducedMotion ? false : { opacity: 0, pathLength: 0 }}
              animate={canAnimate
                ? { opacity: 1, pathLength: 1, d: [wave.rest, wave.drift, wave.rest] }
                : { opacity: 1, pathLength: 1, d: wave.rest }}
              transition={canAnimate
                ? {
                    opacity: { duration: 0.38, delay: 0.78 + index * 0.08 },
                    pathLength: { duration: 1.2, delay: 0.78 + index * 0.08, ease: motionTokens.ease.out },
                    d: { duration: 18 + index * 3, delay: 2.1, ease: motionTokens.ease.inOut, repeat: Infinity },
                  }
                : { duration: 0 }}
            />
          ))}

          <motion.path
            id="yt-eclipse-primary-path"
            className="yt-eclipse-wave yt-eclipse-wave--primary-bloom"
            d={primaryWave.rest}
            fill="none"
            initial={reducedMotion ? false : { opacity: 0, pathLength: 0 }}
            animate={canAnimate
              ? { opacity: 0.46, pathLength: 1, d: [primaryWave.rest, primaryWave.rise, primaryWave.settle, primaryWave.rest] }
              : { opacity: 0.46, pathLength: 1, d: primaryWave.rest }}
            transition={canAnimate
              ? {
                  opacity: { duration: 0.4, delay: 1.02 },
                  pathLength: { duration: 1.65, delay: 1.02, ease: motionTokens.ease.out },
                  d: { duration: 22, delay: 2.8, ease: motionTokens.ease.inOut, repeat: Infinity },
                }
              : { duration: 0 }}
          />
          <motion.path
            className="yt-eclipse-wave yt-eclipse-wave--primary"
            d={primaryWave.rest}
            fill="none"
            initial={reducedMotion ? false : { opacity: 0, pathLength: 0 }}
            animate={canAnimate
              ? { opacity: 1, pathLength: 1, d: [primaryWave.rest, primaryWave.rise, primaryWave.settle, primaryWave.rest] }
              : { opacity: 1, pathLength: 1, d: primaryWave.rest }}
            transition={canAnimate
              ? {
                  opacity: { duration: 0.4, delay: 1.06 },
                  pathLength: { duration: 1.65, delay: 1.06, ease: motionTokens.ease.out },
                  d: { duration: 22, delay: 2.8, ease: motionTokens.ease.inOut, repeat: Infinity },
                }
              : { duration: 0 }}
          />
          <motion.path
            className="yt-eclipse-wave yt-eclipse-wave--travel"
            d={primaryWave.rest}
            fill="none"
            initial={reducedMotion ? false : { opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 1.7, delay: 1.12, ease: motionTokens.ease.out }}
          />

          {signalTracks.map((track) => (
            <motion.g
              key={track.className}
              className={`yt-eclipse-signal ${track.className}`}
              initial={false}
              animate={canAnimate
                ? { x: [...track.x], y: [...track.y], opacity: [0, 0.95, 0.95, 0] }
                : { x: track.x[0], y: track.y[0], opacity: 0 }}
              transition={canAnimate
                ? {
                    x: { duration: track.duration, delay: track.delay, ease: "linear", repeat: Infinity, repeatDelay: 2.4 },
                    y: { duration: track.duration, delay: track.delay, ease: "linear", repeat: Infinity, repeatDelay: 2.4 },
                    opacity: { duration: track.duration, delay: track.delay, times: [0, 0.08, 0.9, 1], repeat: Infinity, repeatDelay: 2.4 },
                  }
                : { duration: 0 }}
            >
              <circle className="yt-eclipse-signal__halo" r={track.className === "is-primary" ? 8 : 5.5} />
              <circle className="yt-eclipse-signal__core" r={track.className === "is-primary" ? 2.3 : 1.6} />
            </motion.g>
          ))}

          <g className="yt-eclipse-nodes">
            {intelligenceNodes.map((node) => (
              <g key={node.name} className={`yt-eclipse-node ${node.className}`} transform={`translate(${node.x} ${node.y})`}>
                <circle className="yt-eclipse-node__bloom" r="10" />
                <circle className="yt-eclipse-node__ring" r="5.2" />
                <circle className="yt-eclipse-node__core" r="1.7" />
                <g className="yt-eclipse-node__annotation">
                  <rect x="-4" y="-30" width={node.name.length * 5.5 + 14} height="18" rx="5" />
                  <text x="3" y="-18">{node.name}</text>
                </g>
              </g>
            ))}
          </g>
        </motion.g>

        <motion.g className="yt-eclipse-depth-particles" style={reducedMotion ? undefined : { x: depthX, y: depthY }}>
          {depthParticles.map((particle, index) => (
            <circle
              key={`${particle.x}-${particle.y}`}
              className={`yt-eclipse-mote is-${particle.tone}${index > 7 ? " is-mobile-hidden" : ""}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.r}
              style={{
                "--yt-mote-delay": `${particle.delay}s`,
                "--yt-mote-duration": `${particle.duration}s`,
              } as React.CSSProperties}
            />
          ))}
        </motion.g>
      </svg>
      <div className="yt-hero-horizon yt-eclipse-horizon" />
    </motion.div>
  );
});

export function AtmosphericHero({ data }: { data: MarketBriefing }) {
  const [expanded, setExpanded] = React.useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  const pageVisible = usePageVisibility();
  const finePointer = React.useRef(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const waveSpringX = useSpring(pointerX, { stiffness: 82, damping: 24, mass: 0.85 });
  const waveSpringY = useSpring(pointerY, { stiffness: 82, damping: 24, mass: 0.85 });
  const depthSpringX = useSpring(pointerX, { stiffness: 46, damping: 22, mass: 1.1 });
  const depthSpringY = useSpring(pointerY, { stiffness: 46, damping: 22, mass: 1.1 });
  const waveX = useTransform(waveSpringX, [-1, 1], [-5, 5]);
  const waveY = useTransform(waveSpringY, [-1, 1], [-2.5, 3]);
  const depthX = useTransform(depthSpringX, [-1, 1], [-8, 8]);
  const depthY = useTransform(depthSpringY, [-1, 1], [-3, 4]);

  React.useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updatePointerMode = () => {
      finePointer.current = query.matches;
      if (!query.matches) {
        pointerX.set(0);
        pointerY.set(0);
      }
    };

    updatePointerMode();
    query.addEventListener("change", updatePointerMode);
    return () => query.removeEventListener("change", updatePointerMode);
  }, [pointerX, pointerY]);

  React.useEffect(() => {
    if (!pageVisible || reducedMotion) {
      pointerX.set(0);
      pointerY.set(0);
    }
  }, [pageVisible, pointerX, pointerY, reducedMotion]);

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || !pageVisible || !finePointer.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.section
      className="yt-atmospheric-hero yt-meridian-eclipse-hero"
      aria-labelledby="yt-briefing-title"
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
      initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.997 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.hero }}
    >
      <div className="yt-hero-stage">
        <AtmosphereArtwork
          reducedMotion={reducedMotion}
          ambientActive={pageVisible}
          waveX={waveX}
          waveY={waveY}
          depthX={depthX}
          depthY={depthY}
        />
      </div>

      <motion.div
        className="yt-hero-stage-label"
        initial={reducedMotion ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 1.32, ease: motionTokens.ease.out }}
      >
        <Globe2 aria-hidden="true" />
        <span>Meridian atmosphere</span>
        <TruthBadge state="demo" label="Demo stage" compact />
      </motion.div>

      <motion.div
        className="yt-hero-briefing"
        variants={briefingContainer}
        initial={reducedMotion ? false : "hidden"}
        animate="visible"
      >
        <motion.div className="yt-hero-heading" variants={briefingItem}>
          <div>
            <span>{data.greeting}</span>
            <SunMedium aria-hidden="true" />
          </div>
          <TruthBadge state={data.dataState} label="Demo briefing" compact />
        </motion.div>
        <motion.h1 id="yt-briefing-title" variants={briefingItem}>{data.title}</motion.h1>
        <motion.p variants={briefingItem}>{data.summary}</motion.p>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.p
              className="yt-hero-detail"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: 3 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: 2 }}
              transition={{ duration: reducedMotion ? 0.08 : 0.24, ease: motionTokens.ease.out }}
            >
              This briefing is deterministic, contains no live prices, and is not investment advice.
            </motion.p>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          className="yt-hero-action"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          variants={briefingItem}
          whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        >
          {expanded ? "Close market brief" : data.actionLabel}
          <ArrowRight aria-hidden="true" />
        </motion.button>
        <motion.dl className="yt-hero-metrics" variants={briefingItem}>
          {data.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd className={metric.tone === "positive" ? "is-positive" : metric.tone === "caution" ? "is-caution" : ""}>
                {metric.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </motion.section>
  );
}
