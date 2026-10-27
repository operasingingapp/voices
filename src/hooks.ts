import { useEffect, useRef, useState } from "react";

/** Re-render at a modest rate with a value read from somewhere that changes continuously (e.g. the audio clock). */
export function useTicker<T>(read: () => T, ms = 100, equal: (a: T, b: T) => boolean = Object.is): T {
  const readRef = useRef(read);
  readRef.current = read;
  const [v, setV] = useState<T>(() => read());
  useEffect(() => {
    const id = setInterval(() => {
      const nv = readRef.current();
      setV((old) => (equal(old, nv) ? old : nv));
    }, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);
  return v;
}

/** Per-viewer convenience setting kept in localStorage (falls back to memory). */
export function useLocalSetting<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`cp:${key}`);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  const set = (nv: T) => {
    setV(nv);
    try {
      localStorage.setItem(`cp:${key}`, JSON.stringify(nv));
    } catch {
      /* storage unavailable */
    }
  };
  return [v, set];
}
