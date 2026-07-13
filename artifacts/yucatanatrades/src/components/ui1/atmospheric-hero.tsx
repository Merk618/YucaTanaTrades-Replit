import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Globe2, Sparkles, SunMedium } from "lucide-react";
import type { MarketBriefing } from "@/contracts/dashboard";
import { motionTokens } from "@/lib/motion";
import { TruthBadge } from "@/components/ui1/truth-badge";

function AtmosphereArtwork({ reducedMotion }: { reducedMotion: boolean }) {
  const layerTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 1.1, ease: motionTokens.ease.out, delay: motionTokens.delay.atmosphere };

  return (
    <motion.div
      className="yt-hero-visual"
      aria-hidden="true"
      initial={reducedMotion ? false : { opacity: 0, scale: 1.015 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={layerTransition}
    >
      <div className="yt-hero-aurora" />
      <svg className="yt-hero-art" viewBox="0 0 1040 258" preserveAspectRatio="none">
        <defs>
          <linearGradient id="yt-mountain-back" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#42616a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0a2430" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="yt-mountain-front" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1b3b47" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#071c27" />
          </linearGradient>
          <linearGradient id="yt-ribbon" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#8eb9bd" stopOpacity="0" />
            <stop offset="28%" stopColor="#d8ddd2" stopOpacity="0.54" />
            <stop offset="55%" stopColor="#f3d89f" stopOpacity="0.96" />
            <stop offset="82%" stopColor="#d8ddd2" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#8eb9bd" stopOpacity="0" />
          </linearGradient>
          <filter id="yt-ribbon-glow" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="yt-horizon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f6ddb0" stopOpacity="0.78" />
            <stop offset="40%" stopColor="#6fa0a6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0b2935" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="710" cy="213" rx="300" ry="66" fill="url(#yt-horizon)" />
        <path
          d="M260 210L330 168L382 188L442 151L495 190L548 160L614 192L675 153L735 184L803 138L858 177L927 146L1040 187V258H260Z"
          fill="url(#yt-mountain-back)"
        />
        <path
          d="M220 231L312 190L366 210L414 181L475 222L534 190L592 219L651 183L704 214L762 176L823 211L891 172L951 208L1040 180V258H220Z"
          fill="url(#yt-mountain-front)"
        />
        <path
          className="yt-hero-ribbon is-back"
          d="M265 157C350 211 410 103 482 145C555 188 610 130 666 76C716 27 747 34 781 103C816 174 879 135 922 93C963 53 1001 63 1048 89"
          fill="none"
          stroke="url(#yt-ribbon)"
          strokeWidth="17"
          strokeLinecap="round"
          filter="url(#yt-ribbon-glow)"
        />
        <path
          className="yt-hero-ribbon is-main"
          d="M248 173C342 224 401 127 474 159C553 194 599 165 654 100C712 32 748 31 783 108C818 185 872 156 922 111C970 68 1008 71 1048 98"
          fill="none"
          stroke="url(#yt-ribbon)"
          strokeWidth="5.2"
          strokeLinecap="round"
          filter="url(#yt-ribbon-glow)"
        />
        <path
          className="yt-hero-ribbon is-fine"
          d="M268 188C359 216 412 147 477 174C552 205 619 171 678 113C728 64 764 78 799 126C838 180 889 168 934 128C978 90 1011 94 1042 111"
          fill="none"
          stroke="#f3d89f"
          strokeOpacity="0.52"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        {[...Array(18)].map((_, index) => (
          <circle
            key={index}
            cx={430 + ((index * 47) % 570)}
            cy={38 + ((index * 31) % 148)}
            r={index % 5 === 0 ? 1.45 : 0.72}
            fill={index % 3 === 0 ? "#f4ce82" : "#b9d0ce"}
            opacity={0.28 + (index % 4) * 0.12}
          />
        ))}
        <path d="M180 244C390 226 565 239 752 221C874 210 959 215 1040 203" fill="none" stroke="#e3c184" strokeOpacity="0.35" strokeWidth="1.1" />
        <path d="M214 249C402 230 578 252 764 228C873 214 961 228 1040 216" fill="none" stroke="#83aeb3" strokeOpacity="0.25" strokeWidth="0.8" />
      </svg>
      <div className="yt-hero-horizon" />
    </motion.div>
  );
}

export function AtmosphericHero({ data }: { data: MarketBriefing }) {
  const [expanded, setExpanded] = React.useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.8 });
  const springY = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.8 });
  const artworkX = useTransform(springX, [-1, 1], [-8, 8]);
  const artworkY = useTransform(springY, [-1, 1], [-4, 5]);

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
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
      className="yt-atmospheric-hero"
      aria-labelledby="yt-briefing-title"
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: motionTokens.delay.hero }}
    >
      <motion.div
        className="yt-hero-stage"
        style={reducedMotion ? undefined : { x: artworkX, y: artworkY }}
      >
        <AtmosphereArtwork reducedMotion={reducedMotion} />
      </motion.div>

      <div className="yt-hero-stage-label">
        <Globe2 aria-hidden="true" />
        <span>Meridian atmosphere</span>
        <TruthBadge state="demo" label="Demo stage" compact />
      </div>

      <motion.div
        className="yt-hero-briefing"
        initial={reducedMotion ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.44, ease: motionTokens.ease.out, delay: motionTokens.delay.briefing }}
      >
        <div className="yt-hero-heading">
          <div>
            <span>{data.greeting}</span>
            <SunMedium aria-hidden="true" />
          </div>
          <TruthBadge state={data.dataState} label="Demo briefing" compact />
        </div>
        <h1 id="yt-briefing-title">{data.title}</h1>
        <p>{data.summary}</p>
        {expanded && (
          <motion.p
            className="yt-hero-detail"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            This briefing is deterministic, contains no live prices, and is not investment advice.
          </motion.p>
        )}
        <button
          type="button"
          className="yt-hero-action"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          {expanded ? "Close market brief" : data.actionLabel}
          <ArrowRight aria-hidden="true" />
        </button>
        <dl className="yt-hero-metrics">
          {data.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd className={metric.tone === "positive" ? "is-positive" : metric.tone === "caution" ? "is-caution" : ""}>
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </motion.div>

      <div className="yt-hero-deferred-note">
        <Sparkles aria-hidden="true" />
        <span>Final Meridian Eclipse globe deferred</span>
      </div>
    </motion.section>
  );
}
