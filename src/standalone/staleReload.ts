/**
 * A tab left open across a deploy still asks for the files of the build it started with. Those are kept for a few
 * deploys, but if one is gone (or the network served an error page in its place), a lazy import fails and the
 * piece, the score or the piano would not open. Then the page reloads once, which brings the current build; a
 * second failure soon after is left to the app's own error handling (no reload loop).
 */
const KEY = "sv:staleReload";
const QUIET_MS = 60_000;

/** the messages browsers give when a module script or a lazily imported chunk could not be fetched */
const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|Loading chunk .* failed|module script.*MIME type/i;

export function isStaleChunkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  return CHUNK_ERROR.test(msg);
}

/** Reload once for a missing build file; true when a reload is on its way (the caller can then stay quiet). */
export function reloadForStaleBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < QUIET_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // without session storage there is no guard against a loop: do not reload
    return false;
  }
  window.location.reload();
  return true;
}

/** for catch handlers: reload when the error is a missing build file */
export function reloadIfStale(e: unknown): boolean {
  return isStaleChunkError(e) && reloadForStaleBuild();
}

let installed = false;
/** when the person last tapped or typed: a file fetched ahead in the background (a piece's data while a page is
 *  idle) that fails must not reload the page under them; what they asked for will fail too, and reload then */
let lastGesture = -Infinity;
const asked = () => performance.now() - lastGesture < 10_000;
export function installStaleReload() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const mark = () => (lastGesture = performance.now());
  window.addEventListener("pointerdown", mark, { capture: true, passive: true });
  window.addEventListener("keydown", mark, { capture: true, passive: true });
  // Vite's import helper reports a chunk it could not load; cancelling the event (only when reloading) keeps
  // the import from throwing into code that is about to be thrown away
  window.addEventListener("vite:preloadError", (ev) => {
    if (asked() && reloadForStaleBuild()) ev.preventDefault();
  });
  window.addEventListener("unhandledrejection", (ev) => {
    if (asked() && isStaleChunkError(ev.reason)) reloadForStaleBuild();
  });
}
