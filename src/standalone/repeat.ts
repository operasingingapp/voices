/** A line that ends by singing the same words again ("mi vo' tosto vendicar" three times) is shown once, with "×3".
 * head = tokens before the repeats, len = tokens in one repeat, times = how many times it is sung. Null when nothing repeats. */
export interface Repeat {
  head: number;
  len: number;
  times: number;
}

const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{M}']/gu, "");

export function trailingRepeat(tokens: string[]): Repeat | null {
  const w = tokens.map(norm);
  const n = w.length;
  let best: Repeat | null = null;
  for (let len = 1; len <= n / 2; len++) {
    let times = 1;
    while ((times + 1) * len <= n) {
      const a = n - len;
      const b = n - (times + 1) * len;
      let same = true;
      for (let j = 0; j < len && same; j++) same = w[a + j] === w[b + j];
      if (!same) break;
      times++;
    }
    if (times >= 2 && (!best || times * len > best.times * best.len)) best = { head: n - times * len, len, times };
  }
  return best;
}

/** the IPA or translation cut to the head and one repeat; left whole when its repeats do not line up with the words' */
function fold(text: string, times: number, split: RegExp): string {
  const parts = text.split(split).filter((x) => x.trim());
  const r = trailingRepeat(parts);
  if (!r || r.times !== times) return text;
  const keep = parts.slice(0, r.head + r.len).join(" ");
  const end = text.trim().slice(-1);
  // the cut ends where a repeat ended mid-sentence ("at once,"): close it as the whole line closes
  return /[.!?…]$/.test(end) ? keep.replace(/[,;:]$/, "") + (/[.!?…]$/.test(keep) ? "" : end) : keep.replace(/[,;:]$/, "");
}

export const foldIpa = (ipa: string, times: number) => fold(ipa, times, / +/);
export const foldTranslation = (tr: string, times: number) => fold(tr, times, /(?<=[,;.!?…]) +/);
