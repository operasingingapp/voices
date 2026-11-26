/**
 * "My pieces": the arias, songs and instrumental numbers a singer has added with the + button in any list, shown on
 * Home. Kept in this browser like the rest of the app's state. An id names the piece, not its place in a list:
 *   aria:<opera>:<character>:<piece key>   song:<song id>   listen:<opera>:<edition id>
 */
import { useEffect, useState } from "react";

const KEY = "cp:mine";
const EVT = "cp:mine";

export interface MineItem {
  id: string;
  /** when it was added (ms) */
  at: number;
}

export const ariaId = (opera: string, character: string, pieceKey: string) =>
  `aria:${opera}:${character}:${pieceKey}`;
export const songId = (song: string) => `song:${song}`;
export const listenId = (opera: string, edition: string) => `listen:${opera}:${edition}`;

export function readMine(): MineItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.id === "string") : [];
  } catch {
    return [];
  }
}

function write(list: MineItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: the change lasts until the page reloads */
  }
  mem = list;
  window.dispatchEvent(new Event(EVT));
}

let mem: MineItem[] | null = null;
const current = () => (mem ??= readMine());

export function isMine(id: string) {
  return current().some((x) => x.id === id);
}

export function toggleMine(id: string) {
  const list = current();
  write(list.some((x) => x.id === id) ? list.filter((x) => x.id !== id) : [{ id, at: Date.now() }, ...list]);
}

/** fill the list once, for someone who practised before My pieces existed (does nothing once the list was ever saved) */
export function seedMine(list: MineItem[]) {
  try {
    if (localStorage.getItem(KEY) !== null) return;
  } catch {
    return;
  }
  write(list);
}

/** the list, kept up to date in every component that shows it */
export function useMine(): MineItem[] {
  const [list, set] = useState(current);
  useEffect(() => {
    const on = () => set([...current()]);
    window.addEventListener(EVT, on);
    // another tab
    const st = (e: StorageEvent) => {
      if (e.key === KEY) {
        mem = readMine();
        on();
      }
    };
    window.addEventListener("storage", st);
    return () => {
      window.removeEventListener(EVT, on);
      window.removeEventListener("storage", st);
    };
  }, []);
  return list;
}
