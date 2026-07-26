import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  KeyRound,
  LoaderCircle,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react";
import type { ReviewAccessInput } from "../../auth/auth-contract";
import { safeAuthErrorMessage } from "../../auth/auth-error-copy";
import {
  REVIEW_ACCESS_CODE_LENGTH,
  emptyReviewAccessCells,
  insertReviewAccessDigits,
  normalizeReviewAccessCode,
  reviewAccessBackspaceTarget,
  type ReviewAccessCells,
} from "../../auth/review-access-code";
import { getAuthErrorCode } from "../../auth/auth-client";
import { motionTokens, useAppReducedMotion } from "../../lib/motion";

interface ReviewAccessEntryProps {
  enabled: boolean;
  onSubmit: (input: ReviewAccessInput) => Promise<void>;
}

interface ReviewAccessCodeFormProps {
  onSubmit: (input: ReviewAccessInput) => Promise<void>;
  onCancel: () => void;
}

export function ReviewAccessEntry({
  enabled,
  onSubmit,
}: ReviewAccessEntryProps) {
  const [open, setOpen] = React.useState(false);
  const reducedMotion = useAppReducedMotion();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  if (!enabled) return null;

  return (
    <div className="yt-review-access-entry">
      <div className="yt-review-access-divider" aria-hidden="true">
        <span>Development review</span>
      </div>
      <button
        ref={triggerRef}
        type="button"
        className="yt-review-access-trigger"
        aria-expanded={open}
        aria-controls="yt-review-access-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="yt-review-access-trigger-icon"><ScanLine aria-hidden="true" /></span>
        <span>
          <strong>Owner Review Access</strong>
          <small>Local development only</small>
        </span>
        <ArrowRight aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id="yt-review-access-panel"
            className="yt-review-access-panel"
            initial={reducedMotion ? false : { opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
            transition={reducedMotion ? { duration: 0 } : {
              duration: motionTokens.duration.panel,
              ease: motionTokens.ease.out,
            }}
          >
            <ReviewAccessCodeForm
              onSubmit={onSubmit}
              onCancel={close}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function ReviewAccessCodeForm({
  onSubmit,
  onCancel,
}: ReviewAccessCodeFormProps) {
  const [cells, setCells] = React.useState<ReviewAccessCells>(() => emptyReviewAccessCells());
  const [phase, setPhase] = React.useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [failureKind, setFailureKind] = React.useState<"invalid" | "rate-limited" | null>(null);
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const complete = cells.every(Boolean);
  const pending = phase === "submitting";
  const messageId = "review-access-message";

  const focusCell = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const applyValue = (index: number, value: string) => {
    const digits = normalizeReviewAccessCode(value);
    if (!digits) {
      setCells((current) => {
        const next = [...current] as ReviewAccessCells;
        next[index] = "";
        return next;
      });
      setError(null);
      setFailureKind(null);
      return;
    }

    const startIndex = digits.length === REVIEW_ACCESS_CODE_LENGTH ? 0 : index;
    const nextFocusIndex = Math.min(
      REVIEW_ACCESS_CODE_LENGTH - 1,
      startIndex + digits.length,
    );
    setCells((current) => insertReviewAccessDigits(current, startIndex, digits).cells);
    window.requestAnimationFrame(() => focusCell(nextFocusIndex));
    setError(null);
    setFailureKind(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!complete || pending) {
      setError("Enter the complete six-digit review code.");
      setFailureKind("invalid");
      return;
    }

    const code = cells.join("");
    setCells(emptyReviewAccessCells());
    setError(null);
    setFailureKind(null);
    setPhase("submitting");

    try {
      await onSubmit({ code });
      setPhase("success");
    } catch (submitError) {
      setError(safeAuthErrorMessage(submitError, "review-access"));
      setFailureKind(
        getAuthErrorCode(submitError) === "rate_limited" ? "rate-limited" : "invalid",
      );
      setPhase("idle");
      window.requestAnimationFrame(() => focusCell(0));
    }
  };

  return (
    <section
      className="yt-review-access-surface"
      data-phase={phase}
      data-failure={failureKind ?? undefined}
      aria-labelledby="review-access-heading"
      aria-busy={pending}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) onCancel();
      }}
    >
      <div className="yt-review-access-heading">
        <span className="yt-review-access-key"><KeyRound aria-hidden="true" /></span>
        <span>
          <small>Development-only session</small>
          <strong id="review-access-heading">Enter review code</strong>
        </span>
        <button
          type="button"
          className="yt-review-access-close"
          aria-label="Close Owner Review Access"
          disabled={pending}
          onClick={onCancel}
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <p className="yt-review-access-copy">
        Use the six-digit code supplied for this local visual review.
      </p>

      <form className="yt-review-access-form" onSubmit={(event) => void submit(event)} noValidate>
        <fieldset disabled={pending}>
          <legend className="sr-only">Six-digit Owner Review Access code</legend>
          <div
            className="yt-review-access-cells"
            role="group"
            aria-label="Owner Review Access code"
            aria-describedby={messageId}
          >
            {cells.map((digit, index) => (
              <input
                key={index}
                ref={(node) => { inputRefs.current[index] = node; }}
                className="yt-review-access-cell"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                autoCapitalize="off"
                spellCheck={false}
                maxLength={REVIEW_ACCESS_CODE_LENGTH}
                value={digit}
                aria-label={`Review access code digit ${index + 1} of ${REVIEW_ACCESS_CODE_LENGTH}`}
                aria-invalid={Boolean(error)}
                aria-errormessage={error ? messageId : undefined}
                autoFocus={index === 0}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => applyValue(index, event.currentTarget.value)}
                onPaste={(event) => {
                  const digits = normalizeReviewAccessCode(event.clipboardData.getData("text"));
                  if (!digits) return;
                  event.preventDefault();
                  applyValue(index, digits);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace") {
                    const target = reviewAccessBackspaceTarget(cells, index);
                    if (target !== index || cells[index]) {
                      event.preventDefault();
                      setCells((current) => {
                        const next = [...current] as ReviewAccessCells;
                        next[target] = "";
                        return next;
                      });
                      setError(null);
                      setFailureKind(null);
                      focusCell(target);
                    }
                  } else if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    focusCell(Math.max(0, index - 1));
                  } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    focusCell(Math.min(REVIEW_ACCESS_CODE_LENGTH - 1, index + 1));
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    focusCell(0);
                  } else if (event.key === "End") {
                    event.preventDefault();
                    focusCell(REVIEW_ACCESS_CODE_LENGTH - 1);
                  }
                }}
              />
            ))}
          </div>
        </fieldset>

        <div
          id={messageId}
          className={`yt-review-access-message${error ? " is-error" : phase === "success" ? " is-success" : ""}`}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          {error ?? (phase === "success"
            ? "Review session accepted. Opening Meridian OS…"
            : "No account, provider, or portfolio state is created.")}
        </div>

        <button
          className="yt-review-access-submit"
          type="submit"
          disabled={!complete || pending || phase === "success"}
        >
          {pending ? <LoaderCircle className="yt-review-access-spinner" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
          <span>{pending ? "Checking access…" : phase === "success" ? "Opening Meridian OS…" : "Enter review session"}</span>
        </button>

        <ul className="yt-review-access-boundaries" aria-label="Review session boundaries">
          <li>Short-lived</li>
          <li>No persistence</li>
          <li>Local only</li>
        </ul>
      </form>
    </section>
  );
}
