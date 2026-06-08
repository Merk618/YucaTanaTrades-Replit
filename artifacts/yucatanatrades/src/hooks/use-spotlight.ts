import { useCallback, useEffect, useRef } from "react";

/**
 * Mouse-spotlight hook.
 *
 * Tracks the cursor inside an element and writes its position to the
 * `--mx` / `--my` CSS variables (throttled to one update per animation frame).
 * Pair with the `.spotlight` utility class in index.css, which renders a soft
 * radial glow at those coordinates.
 *
 * - Throttled via requestAnimationFrame (one update per frame max)
 * - Disabled on touch / coarse pointers and for prefers-reduced-motion
 *   (the CSS handles the reduced-motion + the handler bails on coarse pointers)
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const frame = useRef<number>(0);

  const onMouseMove = useCallback((e: { clientX: number; clientY: number }) => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) return; // already scheduled this frame

    // Skip on coarse pointers (touch) — no hover spotlight on mobile
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    });
  }, []);

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
  }, []);

  return { ref, onMouseMove };
}
