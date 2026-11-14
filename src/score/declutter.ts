/**
 * Words and tempo marks never sit on top of anything else. The engraver places a "sotto voce" or an "a tempo" by its
 * staff without looking at the bar numbers, the lyrics or the other words and dynamics around it, so they can collide.
 * Each such mark is placed as an engraver would nudge it by hand:
 *   1. away from its staff (up when it stands above it, down when below), step by step, until it is clear;
 *   2. if that would put it on notes or into a staff, beside what it ran into instead ("f a tempo" on one line);
 *   3. failing that, on the other side of what it ran into;
 *   4. failing everything, where the engraver put it.
 * Notes, rests, beams, accidentals, articulations and the staves themselves are never landed on; bar numbers, lyrics,
 * dynamics and the other marks are only stepped around. The text is moved itself (its x and y), so the parts' own
 * shifts still apply. Kept free of imports: the score checker runs the same function on its own engraving.
 */
export function declutterMarks(host: ParentNode): number {
  type Box = { x: number; y: number; w: number; h: number };
  const boxOf = (el: Element): Box | null => {
    try {
      const b = (el as SVGGraphicsElement).getBBox();
      return b.width > 0 && b.height > 0 ? { x: b.x, y: b.y, w: b.width, h: b.height } : null;
    } catch {
      return null;
    }
  };
  const hit = (a: Box, b: Box, pad: number) =>
    a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
  let moved = 0;
  for (const sys of host.querySelectorAll<SVGGElement>("g.system")) {
    const marks = [...sys.querySelectorAll<SVGGElement>("g.dir, g.tempo")];
    if (!marks.length) continue;
    // what a mark steps around, and what it must never land on
    const soft: { el: Element; box: Box }[] = [];
    for (const el of sys.querySelectorAll("g.mNum, g.verse, g.dynam, g.dir, g.tempo, g.hairpin")) {
      const box = boxOf(el);
      if (box) soft.push({ el, box });
    }
    const hard: Box[] = [];
    for (const el of sys.querySelectorAll("g.notehead, g.rest, g.mRest, g.beam > polygon, g.accid, g.artic, g.stem, g.flag")) {
      const box = boxOf(el);
      if (box) hard.push(box);
    }
    for (const st of sys.querySelectorAll("g.staff")) {
      const lines = [...st.querySelectorAll(":scope > path")].map(boxOf).filter((b): b is Box => !!b);
      if (!lines.length) continue;
      const y0 = Math.min(...lines.map((l) => l.y));
      const y1 = Math.max(...lines.map((l) => l.y + l.h));
      const x0 = Math.min(...lines.map((l) => l.x));
      const x1 = Math.max(...lines.map((l) => l.x + l.w));
      hard.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
    const boxes = new Map(soft.map((o) => [o.el, o.box]));
    for (const m of marks) {
      const bb0 = boxes.get(m);
      if (!bb0) continue;
      const pad = bb0.h * 0.15;
      const others = (b: Box) => soft.find((x) => x.el !== m && !m.contains(x.el) && !x.el.contains(m) && hit(b, x.box, pad));
      const onHard = (b: Box) => hard.some((h) => hit(b, h, pad * 0.5));
      const clear = (b: Box) => !others(b) && !onHard(b);
      const first = others(bb0);
      if (!first) continue;
      // which side of its staff it stands on: the staff's top line
      const staff = m.closest("g.measure")?.querySelector(`g.staff[data-n="${m.getAttribute("data-staff") ?? "1"}"]`);
      const line = staff?.querySelector(":scope > path");
      const lb = line ? boxOf(line) : null;
      const above = !lb || bb0.y + bb0.h / 2 < lb.y + (lb.h || 0) / 2;
      const tries: (() => Box | null)[] = [
        // 1. away from the staff, around whatever it meets
        () => {
          const b = { ...bb0 };
          for (let k = 0; k < 8; k++) {
            const o = others(b);
            if (!o) return onHard(b) ? null : b;
            b.y = above ? o.box.y - pad - b.h : o.box.y + o.box.h + pad;
          }
          return null;
        },
        // 2. beside what it ran into, on the same line
        () => {
          const b = { ...bb0, x: first.box.x + first.box.w + pad * 2 };
          return clear(b) ? b : null;
        },
        // 3. on the other side of it, towards the staff (only where nothing is drawn there)
        () => {
          const b = { ...bb0, y: above ? first.box.y + first.box.h + pad : first.box.y - pad - bb0.h };
          return clear(b) ? b : null;
        },
      ];
      let to: Box | null = null;
      for (const t of tries) if ((to = t())) break;
      if (!to) continue;
      const dx = to.x - bb0.x;
      const dy = to.y - bb0.y;
      if (!dx && !dy) continue;
      for (const t of m.querySelectorAll("text, tspan[y], tspan[x]")) {
        const y = parseFloat(t.getAttribute("y") ?? "");
        if (dy && !Number.isNaN(y)) t.setAttribute("y", String(y + dy));
        const x = parseFloat(t.getAttribute("x") ?? "");
        if (dx && !Number.isNaN(x)) t.setAttribute("x", String(x + dx));
      }
      Object.assign(bb0, to);
      moved++;
    }
  }
  return moved;
}
