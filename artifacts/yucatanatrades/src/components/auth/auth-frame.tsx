import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { KeyRound, LockKeyhole, ServerCog } from "lucide-react";
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

  return (
    <main className="yt-auth-root">
      <div className="yt-auth-grid" aria-hidden="true" />
      <div className="yt-auth-aurora" aria-hidden="true" />

      <header className="yt-auth-header">
        <Link href="/sign-in" className="yt-auth-brand" aria-label="YucaTanaTrades secure access">
          <BrandMark />
          <span>YUCATANATRADES</span>
        </Link>
        <span className="yt-auth-header-status"><LockKeyhole aria-hidden="true" /> Secure access</span>
      </header>

      <section className="yt-auth-layout">
        <motion.aside
          className="yt-auth-identity"
          initial={reducedMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reducedMotion ? { duration: 0 } : motionTokens.spring.panel}
        >
          <span className="yt-auth-kicker">MERIDIAN OS</span>
          <h1>Protected market intelligence, with server-held session state.</h1>
          <p>
            YucaTanaTrades is the public brand. Meridian OS is the authenticated
            operating environment behind a server-derived session.
          </p>
          <div className="yt-auth-trust-list" aria-label="Session safeguards">
            <span><ServerCog aria-hidden="true" /> Opaque server-side session</span>
            <span><KeyRound aria-hidden="true" /> In-memory CSRF synchronization</span>
            <span><LockKeyhole aria-hidden="true" /> HttpOnly cookie boundary</span>
          </div>
        </motion.aside>

        <motion.section
          className="yt-auth-panel"
          initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reducedMotion ? { duration: 0 } : { ...motionTokens.spring.panel, delay: 0.06 }}
        >
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
        <span>Meridian OS · server session foundation</span>
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
