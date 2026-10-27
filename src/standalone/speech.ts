/**
 * Spoken pronunciation. First choice: the app's own recordings of a native Italian voice (made with
 * ElevenLabs, scripts/voices.ts). Where a recording is missing, the device's own Italian voice (Web Speech
 * API), and last the offline placeholder recordings bundled with the app.
 */

export interface SpeakSource {
  text: string;
  normalUrl?: string;
  slowUrl?: string;
  /** recordings of the real voice: always preferred */
  recorded?: { normal?: string; slow?: string };
}

export type VoiceInfo = { kind: "device"; name: string } | { kind: "recording" } | { kind: "none" };

const PREFERRED = ["alice", "federica", "paola", "elsa", "luca", "google italiano", "cosimo", "isabella"];

let current: HTMLAudioElement | null = null;

function italianVoice(): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    const it = voices.filter((v) => v.lang?.toLowerCase().startsWith("it"));
    if (!it.length) return null;
    for (const p of PREFERRED) {
      const v = it.find((x) => x.name.toLowerCase().includes(p));
      if (v) return v;
    }
    return it.find((v) => v.localService) ?? it[0];
  } catch {
    return null;
  }
}

export function voiceInfo(hasRecordings: boolean): VoiceInfo {
  const v = italianVoice();
  if (v) return { kind: "device", name: v.name };
  return hasRecordings ? { kind: "recording" } : { kind: "none" };
}

/** Re-check voices when the browser finishes loading them (they arrive asynchronously). */
export function onVoicesChanged(fn: () => void): () => void {
  const synth = (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
  if (!synth) return () => {};
  synth.addEventListener?.("voiceschanged", fn);
  return () => synth.removeEventListener?.("voiceschanged", fn);
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* not available */
  }
  current?.pause();
  current = null;
}

/** Speak a phrase; resolves when it ends. onTime: the playback position (s) while a recording plays. */
export function speak(src: SpeakSource, slow: boolean, onTime?: (sec: number) => void): Promise<void> {
  stopSpeaking();
  const rec = slow ? src.recorded?.slow : src.recorded?.normal;
  if (rec) {
    return new Promise((resolve) => {
      const a = new Audio(rec);
      // single words have one recording: the tortoise plays it slower, keeping the pitch
      if (slow && src.recorded?.slow === src.recorded?.normal) {
        a.preservesPitch = true;
        a.playbackRate = 0.75;
      }
      let raf = 0;
      const done = () => {
        cancelAnimationFrame(raf);
        onTime?.(-1);
        resolve();
      };
      const tick = () => {
        onTime?.(a.currentTime);
        raf = requestAnimationFrame(tick);
      };
      a.onplaying = () => onTime && (raf = requestAnimationFrame(tick));
      a.onended = done;
      a.onerror = done;
      a.onpause = () => a.ended || done();
      current = a;
      a.play().catch(done);
    });
  }
  const v = italianVoice();
  if (v && window.speechSynthesis) {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(src.text);
      u.voice = v;
      u.lang = v.lang || "it-IT";
      u.rate = slow ? 0.62 : 0.92;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }
  const url = slow ? src.slowUrl ?? src.normalUrl : src.normalUrl;
  if (!url) return Promise.resolve();
  return new Promise((resolve) => {
    const a = new Audio(url);
    a.preservesPitch = true;
    if (slow && !src.slowUrl) a.playbackRate = 0.7;
    a.onended = () => resolve();
    a.onerror = () => resolve();
    current = a;
    a.play().catch(() => resolve());
  });
}
