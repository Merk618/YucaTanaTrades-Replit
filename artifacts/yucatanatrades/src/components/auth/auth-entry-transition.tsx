import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/auth-provider";
import type { AuthRuntimeState } from "../../auth/auth-state";
import { BrandMark } from "../app-shell";
import "../../auth-entry-transition.css";

type AuthKind = AuthRuntimeState["kind"];

export function AuthEntryTransition() {
  const { state } = useAuth();
  const previousKind = useRef<AuthKind>(state.kind);
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const enteringAuthenticatedWorkspace =
      state.kind === "authenticated" &&
      (previousKind.current === "guest" || previousKind.current === "expired");

    previousKind.current = state.kind;
    if (enteringAuthenticatedWorkspace) {
      setVisible(true);
    } else if (state.kind !== "authenticated") {
      setVisible(false);
    }
  }, [state.kind]);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(
      () => setVisible(false),
      reduceMotion ? 140 : 520,
    );
    return () => window.clearTimeout(timeout);
  }, [reduceMotion, visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="yt-auth-entry-transition"
          aria-hidden="true"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.36,
              ease: [0.2, 0.78, 0.24, 1],
            }}
          >
            <BrandMark />
            <span>MERIDIAN OS</span>
            <strong>Opening your intelligence environment</strong>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
