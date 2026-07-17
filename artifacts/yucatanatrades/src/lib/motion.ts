import { useReducedMotion, type Transition, type Variants } from "framer-motion";

const easeOut = [0.22, 1, 0.36, 1] as const;
const easeStandard = [0.2, 0.8, 0.2, 1] as const;
const easeInOut = [0.65, 0, 0.35, 1] as const;

export const motionTokens = {
  duration: {
    micro: 0.12,
    fast: 0.18,
    interface: 0.25,
    panel: 0.34,
    route: 0.32,
    entrance: 0.74,
  },
  delay: {
    topbar: 0.06,
    strip: 0.13,
    atmosphere: 0.18,
    hero: 0.2,
    briefing: 0.27,
    portfolio: 0.29,
    chart: 0.34,
    intelligenceRail: 0.36,
    portfolioLine: 0.4,
    gauge: 0.46,
    supporting: 0.48,
    routeSurface: 0.08,
  },
  ease: {
    out: easeOut,
    standard: easeStandard,
    inOut: easeInOut,
  },
  spring: {
    snappy: { type: "spring", stiffness: 430, damping: 36, mass: 0.7 } satisfies Transition,
    panel: { type: "spring", stiffness: 320, damping: 32, mass: 0.85 } satisfies Transition,
    route: { type: "spring", stiffness: 260, damping: 30, mass: 1 } satisfies Transition,
  },
  stagger: {
    compact: 0.045,
    dashboard: 0.055,
  },
} as const;

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: motionTokens.stagger.dashboard,
      delayChildren: motionTokens.delay.atmosphere,
    },
  },
};

export const panelReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.panel,
      ease: motionTokens.ease.out,
    },
  },
};

export const subtleRoute: Variants = {
  hidden: { opacity: 0, y: 9 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.route,
      ease: motionTokens.ease.out,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.ease.inOut,
    },
  },
};

export function useAppReducedMotion() {
  return Boolean(useReducedMotion());
}
