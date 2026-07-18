import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, KeyRound, LockKeyhole, ServerCog, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { BrandMark } from "@/components/app-shell";
import { motionTokens } from "@/lib/motion";
import "@/auth.css";

export function AuthFrame({
  eyebrow,
  title,
  description,
  notice,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const rootRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const updateVisibility = () => {
      rootRef.current?.classList.toggle("yt-auth-motion-paused", document.hidden);
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) {
      root?.style.removeProperty("--yt-auth-parallax-x");
      root?.style.removeProperty("--yt-auth-parallax-y");
      return;
    }

    let frame: number | null = null;
    const apply = (x: number, y: number) => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        root.style.setProperty("--yt-auth-parallax-x", `${x.toFixed(2)}px`);
        root.style.setProperty("--yt-auth-parallax-y", `${y.toFixed(2)}px`);
        frame = null;
      });
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * -7;
      const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * -5;
      apply(x, y);
    };
    const reset = () => apply(0, 0);
    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", reset);
    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", reset);
      if (frame !== null) window.cancelAnimationFrame(frame);
      root.style.removeProperty("--yt-auth-parallax-x");
      root.style.removeProperty("--yt-auth-parallax-y");
    };
  }, [reducedMotion]);

  return (
    <main ref={rootRef} className="yt-auth-root">
      <div className="yt-auth-grid" aria-hidden="true" />
      <div className="yt-auth-aurora" aria-hidden="true" />

      <header className="yt-auth-header">
        <Link href="/" className="yt-auth-brand" aria-label="YucaTanaTrades public site">
          <BrandMark />
          <span className="yt-auth-wordmark">YUCATANATRADES</span>
        </Link>
        <div className="yt-auth-header-actions">
          <Link href="/" className="yt-auth-public-link"><ArrowLeft aria-hidden="true" /> Public site</Link>
          <span className="yt-auth-header-status"><span aria-hidden="true" /> Secure access</span>
        </div>
      </header>

      <section className="yt-auth-layout">
        <motion.aside
          className="yt-auth-identity"
          initial={reducedMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reducedMotion ? { duration: 0 } : motionTokens.spring.panel}
        >
          <div className="yt-auth-kicker-row">
            <span className="yt-auth-kicker">MERIDIAN OS</span>
            <span className="yt-auth-kicker-rule" aria-hidden="true" />
            <span className="yt-auth-kicker-detail">Private intelligence workspace</span>
          </div>
          <h1>See the market.<br /><em>Keep your edge.</em></h1>
          <p>
            The public YucaTanaTrades experience becomes Meridian OS after authentication—
            a focused environment for research, risk context, and source-aware decisions.
          </p>

          <motion.div
            className="yt-auth-orbit-stage"
            aria-hidden="true"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reducedMotion ? { duration: 0 } : {
              duration: motionTokens.duration.entrance,
              delay: motionTokens.delay.routeSurface,
              ease: motionTokens.ease.out,
            }}
          >
            <span className="yt-auth-orbit is-outer" />
            <span className="yt-auth-orbit is-middle" />
            <span className="yt-auth-orbit is-inner" />
            <span className="yt-auth-orbit-axis is-horizontal" />
            <span className="yt-auth-orbit-axis is-vertical" />
            <span className="yt-auth-orbit-node is-one" />
            <span className="yt-auth-orbit-node is-two" />
            <span className="yt-auth-orbit-node is-three" />
            <span className="yt-auth-orbit-core"><BrandMark /></span>
            <span className="yt-auth-orbit-label is-north">SIGNAL</span>
            <span className="yt-auth-orbit-label is-east">CONTEXT</span>
            <span className="yt-auth-orbit-label is-south">CLARITY</span>
          </motion.div>

          <div className="yt-auth-trust-list" aria-label="Session safeguards">
            <span><ServerCog aria-hidden="true" /><small>Session</small><strong>Held server-side</strong></span>
            <span><KeyRound aria-hidden="true" /><small>Browser</small><strong>Protected boundary</strong></span>
            <span><ShieldCheck aria-hidden="true" /><small>Identity</small><strong>Server resolved</strong></span>
          </div>
        </motion.aside>

        <motion.section
          className="yt-auth-panel"
          initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reducedMotion ? { duration: 0 } : {
            ...motionTokens.spring.panel,
            delay: motionTokens.delay.routeSurface,
          }}
        >
          <div className="yt-auth-panel-cap" aria-hidden="true">
            <span />
          </div>
          <div className="yt-auth-panel-context">
            <span><LockKeyhole aria-hidden="true" /> Protected workspace</span>
            <span>MERIDIAN / 01</span>
          </div>
          <div className="yt-auth-panel-heading">
            <span>{eyebrow}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {notice}
          {children}
        </motion.section>
      </section>

      <footer className="yt-auth-footer">
        <span>YucaTanaTrades</span>
        <span>Meridian OS · private by design</span>
      </footer>
    </main>
  );
}

export function AuthNotice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warning" | "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div className={`yt-auth-notice is-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function AuthActions({ children }: { children: React.ReactNode }) {
  return <div className="yt-auth-actions">{children}</div>;
}
