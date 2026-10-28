import { useEffect, useRef } from "react";

/**
 * Back closes what is open. A panel, sheet, card or menu that opens over a screen takes a step in the browser's
 * history, so the phone's back gesture (or the browser's Back) closes it instead of leaving the screen. Closing
 * it any other way (its close button, a tap outside, Escape) takes that step back out again.
 *
 * The step keeps the screen's place (`cp`), so the app's own history handling sees no change of screen. A move to
 * another screen while it is open replaces the step (App's `go`), so the history holds no stale steps.
 */
let seq = 0;
export function useBackToClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const id = ++seq;
    let popped = false;
    try {
      history.pushState({ ...(history.state ?? {}), overlay: id }, "");
    } catch {
      return;
    }
    const onPop = () => {
      // back from this step: it is gone, close what it opened
      if ((history.state as { overlay?: number } | null)?.overlay !== id) {
        popped = true;
        closeRef.current();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // closed by its own button, tap or key: take the step back out (unless the app has moved on)
      if (!popped && (history.state as { overlay?: number } | null)?.overlay === id) {
        try {
          history.back();
        } catch {
          /* ignore */
        }
      }
    };
  }, [open]);
}
