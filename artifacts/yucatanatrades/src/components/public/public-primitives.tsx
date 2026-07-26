import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type PublicTruthLabel =
  | "Demo"
  | "Historical"
  | "Estimated"
  | "AI-generated Demo"
  | "Provider unavailable";

type PublicRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function PublicReveal({
  children,
  className,
  delay = 0,
}: PublicRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{
        duration: reduceMotion ? 0 : 0.72,
        delay: reduceMotion ? 0 : delay,
        ease: [0.2, 0.78, 0.24, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function PublicTruthBadge({ label }: { label: PublicTruthLabel }) {
  const tone =
    label === "Provider unavailable"
      ? "unavailable"
      : label === "AI-generated Demo"
        ? "ai"
        : label.toLowerCase();

  return (
    <span className="yt24-truth-badge" data-tone={tone}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

type PublicSectionIntroProps = {
  eyebrow: string;
  title: ReactNode;
  body: string;
  align?: "start" | "center";
  index?: string;
};

export function PublicSectionIntro({
  eyebrow,
  title,
  body,
  align = "start",
  index,
}: PublicSectionIntroProps) {
  return (
    <div className="yt24-section-intro" data-align={align}>
      <div className="yt24-kicker-row">
        {index ? <span className="yt24-section-index">{index}</span> : null}
        <span className="yt24-kicker">{eyebrow}</span>
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

export function PublicStateDot({
  tone = "gold",
}: {
  tone?: "gold" | "green" | "blue" | "red" | "muted";
}) {
  return <span className="yt24-state-dot" data-tone={tone} aria-hidden="true" />;
}
