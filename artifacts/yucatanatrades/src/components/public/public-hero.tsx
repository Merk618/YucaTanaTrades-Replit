import { ArrowDownRight, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { BrandMark } from "../app-shell";
import { PublicTruthBadge } from "./public-primitives";

function SignalMapScene() {
  const reduceMotion = useReducedMotion();
  const pathTransition = (delay: number) => ({
    duration: reduceMotion ? 0 : 1.5,
    delay: reduceMotion ? 0 : delay,
    ease: [0.2, 0.78, 0.24, 1] as const,
  });

  return (
    <div
      className="yt24-signal-scene"
      role="img"
      aria-label="A conceptual Meridian OS decision map linking market context, risk, evidence, and action."
    >
      <div className="yt24-scene-meta">
        <span>MERIDIAN / DECISION MAP</span>
        <span>PROVENANCE ATTACHED</span>
      </div>

      <svg className="yt24-signal-svg" viewBox="0 0 720 520" aria-hidden="true">
        <defs>
          <linearGradient id="yt24-path-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(224,190,111,0)" />
            <stop offset="45%" stopColor="rgba(224,190,111,.78)" />
            <stop offset="100%" stopColor="rgba(224,190,111,0)" />
          </linearGradient>
          <linearGradient id="yt24-path-cyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(100,191,198,0)" />
            <stop offset="50%" stopColor="rgba(100,191,198,.54)" />
            <stop offset="100%" stopColor="rgba(100,191,198,0)" />
          </linearGradient>
          <radialGradient id="yt24-core-glow">
            <stop offset="0%" stopColor="rgba(231,202,137,.27)" />
            <stop offset="100%" stopColor="rgba(231,202,137,0)" />
          </radialGradient>
        </defs>

        <circle cx="360" cy="264" r="186" fill="none" stroke="rgba(142,177,181,.09)" />
        <circle cx="360" cy="264" r="132" fill="none" stroke="rgba(218,185,113,.12)" />
        <circle cx="360" cy="264" r="78" fill="url(#yt24-core-glow)" />

        <motion.path
          d="M 54 335 C 144 309 193 196 291 228 C 367 253 386 331 457 298 C 525 267 554 168 667 191"
          fill="none"
          stroke="url(#yt24-path-gold)"
          strokeWidth="2"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={pathTransition(0.45)}
        />
        <motion.path
          d="M 70 210 C 173 267 225 304 309 274 C 386 246 423 160 506 197 C 565 223 592 319 664 301"
          fill="none"
          stroke="url(#yt24-path-cyan)"
          strokeWidth="1.5"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={pathTransition(0.62)}
        />
        <motion.path
          d="M 119 402 C 229 357 255 356 358 377 C 453 396 513 367 610 342"
          fill="none"
          stroke="rgba(144,179,181,.22)"
          strokeWidth="1"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={pathTransition(0.78)}
        />

        {[
          [126, 300],
          [218, 232],
          [300, 274],
          [456, 298],
          [552, 190],
          [610, 342],
        ].map(([cx, cy], index) => (
          <motion.g
            key={`${cx}-${cy}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.45,
              delay: reduceMotion ? 0 : 0.85 + index * 0.09,
            }}
          >
            <circle cx={cx} cy={cy} r="8" fill="rgba(5,24,31,.92)" stroke="rgba(227,195,121,.55)" />
            <circle cx={cx} cy={cy} r="2.5" fill="#efd28d" />
          </motion.g>
        ))}
      </svg>

      <div className="yt24-scene-core">
        <BrandMark />
        <span>Decision context</span>
      </div>

      <div className="yt24-scene-card yt24-scene-card-market">
        <span>Market context</span>
        <strong>Structured</strong>
        <em>Historical</em>
      </div>
      <div className="yt24-scene-card yt24-scene-card-risk">
        <span>Risk posture</span>
        <strong>Visible</strong>
        <em>Estimated</em>
      </div>
      <div className="yt24-scene-card yt24-scene-card-evidence">
        <span>Evidence trail</span>
        <strong>Attached</strong>
        <em>Demo</em>
      </div>

      <div className="yt24-scene-footer">
        <span><i /> Signal</span>
        <span><i /> Context</span>
        <span><i /> Decision</span>
      </div>
    </div>
  );
}

export function PublicHero() {
  const reduceMotion = useReducedMotion();
  const reveal = (delay: number, y = 18) => ({
    initial: reduceMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0 : 0.7,
      delay: reduceMotion ? 0 : delay,
      ease: [0.2, 0.78, 0.24, 1] as const,
    },
  });

  return (
    <section
      className="yt24-hero"
      aria-labelledby="yt-public-hero-title"
      data-recording="hero"
    >
      <div className="yt24-hero-atmosphere" aria-hidden="true">
        <span className="yt24-hero-wash" />
        <span className="yt24-hero-arc yt24-hero-arc-one" />
        <span className="yt24-hero-arc yt24-hero-arc-two" />
        <span className="yt24-hero-grain" />
      </div>

      <div className="yt24-shell yt24-hero-grid">
        <div className="yt24-hero-copy">
          <motion.div className="yt24-hero-eyebrow" {...reveal(0.08, 10)}>
            <span />
            YUCATANATRADES · MERIDIAN OS
          </motion.div>

          <h1 id="yt-public-hero-title" className="yt24-hero-title">
            <span className="yt24-title-mask">
              <motion.span {...reveal(0.18, 36)}>Market intelligence,</motion.span>
            </span>
            <span className="yt24-title-mask">
              <motion.span {...reveal(0.28, 36)}>
                organized around
              </motion.span>
            </span>
            <span className="yt24-title-mask">
              <motion.em {...reveal(0.38, 36)}>the next decision.</motion.em>
            </span>
          </h1>

          <motion.p className="yt24-hero-lede" {...reveal(0.5)}>
            Meridian OS brings market structure, technical context, research,
            portfolio risk, and source provenance into one calm operating
            environment—so the evidence is clear before the action is considered.
          </motion.p>

          <motion.div className="yt24-hero-actions" {...reveal(0.6)}>
            <Link className="yt24-button yt24-button-primary" href="/sign-in">
              Enter Meridian OS
              <ArrowRight aria-hidden="true" />
            </Link>
            <a className="yt24-button yt24-button-secondary" href="#platform">
              Explore the platform
              <ArrowDownRight aria-hidden="true" />
            </a>
          </motion.div>

          <motion.div className="yt24-hero-trust" {...reveal(0.7, 10)}>
            <ShieldCheck aria-hidden="true" />
            <span>Provider-neutral foundation</span>
            <PublicTruthBadge label="Demo" />
            <PublicTruthBadge label="Historical" />
          </motion.div>
        </div>

        <motion.div
          className="yt24-hero-visual"
          initial={reduceMotion ? false : { opacity: 0, x: 34, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 1,
            delay: reduceMotion ? 0 : 0.34,
            ease: [0.2, 0.78, 0.24, 1],
          }}
        >
          <SignalMapScene />
        </motion.div>
      </div>

      <div className="yt24-shell yt24-hero-rail" aria-label="Meridian OS focus areas">
        {[
          ["01", "Market context", "Structure before noise"],
          ["02", "Risk posture", "Exposure made legible"],
          ["03", "Research evidence", "Provenance kept attached"],
          ["04", "Decision support", "Boundaries shown plainly"],
        ].map(([index, label, value]) => (
          <div key={label}>
            <span>{index}</span>
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
