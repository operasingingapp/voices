import { useCallback, useEffect, useState } from "react";
import {
  ExploreOperas,
  ExploreVoices,
  findCharacter,
  findOpera,
  PiecePage,
  Onboarding,
  OperaPage,
  ProfilePage,
  RolePage,
  roleKey,
  same,
  Shell,
  SideDrawer,
  Bravo,
  type Ctx,
  type PiecePlace,
  type Place,
  type Profile,
  type RoleRef,
} from "./flow";
import { FIRST_PASS_KEYS, OPERAS, RUNNING, V2_KEYS } from "./operas";
import { Practice } from "./Practice";
import { hasPiece } from "./pieces";

const K = {
  place: "cp:place",
  last: "cp:lastPiece",
  roles: "cp:myRoles",
  current: "cp:current",
  learned: "cp:learned",
  profile: "cp:profile",
  onboarded: "cp:onboarded",
};
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Each role's list of music now holds every number the character sings, so a piece saved by its position
 * in the old, shorter list is found again by its progress key. Runs once.
 */
(function renumberSavedPieces() {
  try {
    const version = localStorage.getItem("cp:pieceList");
    if (version === "3") return;
    const before = version === "2" ? V2_KEYS : FIRST_PASS_KEYS;
    for (const key of [K.place, K.last]) {
      const v = read<{ screen?: string; opera?: string; character?: string; piece?: number; key?: string } | null>(key, null);
      if (v?.screen !== "piece" || typeof v.piece !== "number" || !v.opera || !v.character || v.key) continue;
      const oldKey = before[`${v.opera}:${v.character}`]?.[v.piece];
      const ch = OPERAS.find((o) => o.id === v.opera)?.chars.find((c) => c.id === v.character);
      const i = oldKey && ch ? ch.pieces.findIndex((p) => p.id === oldKey) : -1;
      if (i >= 0) write(key, { ...v, piece: i });
      else localStorage.removeItem(key);
    }
    localStorage.setItem("cp:pieceList", "3");
  } catch {
    /* storage unavailable */
  }
})();

/** A piece is saved with its progress key too, so it can be found again if the list changes. */
function withKey(p: Place): Place & { key?: string } {
  if (p.screen !== "piece") return p;
  const key = OPERAS.find((o) => o.id === p.opera)?.chars.find((c) => c.id === p.character)?.pieces[p.piece]?.id;
  return key ? { ...p, key } : p;
}

/** Screens saved by earlier versions of the app, mapped to today's. */
function migrate(p: unknown): Place | null {
  const o = p as { screen?: string; opera?: string; character?: string; piece?: number } | null;
  if (!o?.screen) return null;
  switch (o.screen) {
    case "operas":
      return { screen: "explore", by: "opera" };
    case "characters":
      return o.opera ? { screen: "opera", opera: o.opera } : null;
    case "pieces":
      return o.opera && o.character ? { screen: "role", opera: o.opera, character: o.character } : null;
    case "piece": {
      if (!o.opera || !o.character || typeof o.piece !== "number") return null;
      // a piece saved with its key is found by the key, wherever the list has moved it
      const key = (o as { key?: string }).key;
      const ch = OPERAS.find((x) => x.id === o.opera)?.chars.find((c) => c.id === o.character);
      const i = key && ch ? ch.pieces.findIndex((p) => p.id === key) : -1;
      return { screen: "piece", opera: o.opera, character: o.character, piece: i >= 0 ? i : o.piece };
    }
    case "about":
      // a piece's own info page is gone: its scene now opens inside the role's list
      return o.opera && o.character ? { screen: "role", opera: o.opera, character: o.character } : null;
    case "role":
    case "opera":
    case "explore":
    case "profile":
    case "onboarding":
      return o as Place;
    default:
      return null;
  }
}

/**
 * Counterpart. The sidebar always shows the role you are learning (and how far you are), then the two ways
 * into everything else: by opera and by voice. A first visit starts with three short onboarding steps.
 * Everything is remembered in this browser on this device.
 */
function titleOf(place: Place): string {
  const tail = " · Counterpart";
  const o = "opera" in place && place.opera ? OPERAS.find((x) => x.id === place.opera) : undefined;
  const c = o && "character" in place ? o.chars.find((x) => x.id === place.character) : undefined;
  switch (place.screen) {
    case "piece":
      return `${c?.pieces[place.piece]?.title ?? "Practice"}${tail}`;
    case "role":
      return `${c?.name ?? "Role"}${tail}`;
    case "opera":
      return `${o?.title ?? "Opera"}${tail}`;
    case "explore":
      return `${place.by === "voice" ? "By voice" : "Operas"}${tail}`;
    case "profile":
      return `Settings${tail}`;
    default:
      return "Counterpart";
  }
}

export function App() {
  const [last, setLast] = useState<PiecePlace | null>(() => {
    const l = migrate(read<unknown>(K.last, null));
    return l && l.screen === "piece" ? l : null;
  });
  const [roles, setRoles] = useState<RoleRef[]>(() => {
    const saved = read<RoleRef[] | null>(K.roles, null);
    if (saved) return saved;
    return last ? [{ opera: last.opera, character: last.character }] : [];
  });
  const [current, setCurrent] = useState<RoleRef | null>(() => read<RoleRef | null>(K.current, null) ?? (last ? { opera: last.opera, character: last.character } : roles[0] ?? null));
  const [learned, setLearned] = useState<Record<string, string[]>>(() => read(K.learned, {}));
  const [profile, setProfile] = useState<Profile>(() => read<Profile>(K.profile, { voices: [], notSinger: false }));
  const [onboarded, setOnboarded] = useState<boolean>(() => read<boolean | null>(K.onboarded, null) ?? roles.length > 0);
  const home = (): Place => (current ? { screen: "role", ...current } : { screen: "explore", by: "opera" });
  // a role just learned in full: the celebration shows over whatever screen you are on
  const [bravo, setBravo] = useState<RoleRef | null>(null);
  // the side panel over the practice screen
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const [place, setPlace] = useState<Place>(() => {
    if (!onboarded) return { screen: "onboarding", step: 1 };
    return migrate(read<unknown>(K.place, null)) ?? home();
  });

  useEffect(() => write(K.place, withKey(place)), [place]);
  // however you arrive at an aria (a tap, or reopening the app on it), it becomes the one to continue
  useEffect(() => {
    if (place.screen !== "piece") return;
    if (!findCharacter(findOpera(place.opera), place.character).pieces[place.piece]?.editionId) return;
    const r = { opera: place.opera, character: place.character };
    setLast(place);
    write(K.last, withKey(place));
    setRoles((rs) => (rs.some((x) => same(x, r)) ? rs : [...rs, r]));
    setCurrent(r);
  }, [place]);
  useEffect(() => write(K.roles, roles), [roles]);
  useEffect(() => write(K.current, current), [current]);
  useEffect(() => write(K.learned, learned), [learned]);
  useEffect(() => write(K.profile, profile), [profile]);
  useEffect(() => write(K.onboarded, onboarded), [onboarded]);

  const addRole = (r: RoleRef) => setRoles((rs) => (rs.some((x) => same(x, r)) ? rs : [...rs, r]));
  const removeRole = (r: RoleRef) => {
    const rest = roles.filter((x) => !same(x, r));
    setRoles(rest);
    if (same(current, r)) setCurrent(rest[0] ?? null);
  };
  // every move is a step in the browser's history, so Back (the button, or a swipe on iPad) retraces it
  const go = (p: Place) => {
    if (JSON.stringify(p) === JSON.stringify(place)) return;
    try {
      history.pushState({ cp: p }, "");
    } catch {
      /* history unavailable: moving still works */
    }
    setPlace(p);
  };
  useEffect(() => {
    try {
      history.replaceState({ ...(history.state ?? {}), cp: place }, "");
    } catch {
      /* ignore */
    }
    const back = (e: PopStateEvent) => {
      const p = (e.state as { cp?: Place } | null)?.cp;
      if (p) setPlace(p);
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // the tab names the page you are on
  useEffect(() => {
    document.title = titleOf(place);
  }, [place]);
  const ctx: Ctx = {
    place,
    go,
    home,
    roles,
    current,
    last,
    learned,
    toggleLearned: (r, key) => {
      // the last piece of a role ticked: the whole role is learned, which is worth a moment
      const ch = findCharacter(findOpera(r.opera), r.character);
      const keys = ch.pieces.map((p) => p.id ?? p.title);
      const had = new Set(learned[roleKey(r)] ?? []);
      if (!had.has(key) && keys.length > 0 && keys.every((k) => k === key || had.has(k))) setBravo(r);
      setLearned((all) => {
        const k = roleKey(r);
        const set = new Set(all[k] ?? []);
        if (set.has(key)) set.delete(key);
        else set.add(key);
        return { ...all, [k]: [...set] };
      });
      // ticking off a piece means you are working on this role
      if (!roles.some((x) => same(x, r))) {
        addRole(r);
        if (!current) setCurrent(r);
      }
    },
    toggleRole: (r) => {
      if (roles.some((x) => same(x, r))) removeRole(r);
      else {
        addRole(r);
        if (!current) setCurrent(r);
      }
    },
    chooseRole: (r) => {
      addRole(r);
      setCurrent(r);
    },
    removeRole,
    profile,
    setProfile,
    finishOnboarding: (to) => {
      setOnboarded(true);
      go(to);
    },
    startOver: () => {
      try {
        for (const k of Object.keys(localStorage)) if (k.startsWith("cp:")) localStorage.removeItem(k);
      } catch {
        /* storage unavailable */
      }
      setLast(null);
      setRoles([]);
      setCurrent(null);
      setLearned({});
      setProfile({ voices: [], notSinger: false });
      setOnboarded(false);
      setPlace({ screen: "onboarding", step: 1 });
    },
  };

  const bravoEl = bravo ? <Bravo ctx={ctx} r={bravo} onClose={() => setBravo(null)} /> : null;

  if (place.screen === "onboarding") return <Onboarding ctx={ctx} step={place.step} role={place.role} by={place.by} opera={place.opera} />;

  if (place.screen === "piece") {
    const opera = findOpera(place.opera);
    const ch = findCharacter(opera, place.character);
    const piece = ch.pieces[place.piece];
    if (hasPiece(piece?.editionId)) {
      const r = { opera: opera.id, character: ch.id };
      const key = piece.id ?? piece.title;
      return (
        <>
          <SideDrawer ctx={ctx} open={drawerOpen} onClose={closeDrawer} />
          {bravoEl}
          <Practice
          onMenu={() => setDrawerOpen(true)}
          onOpera={() => go({ screen: "opera", opera: opera.id })}
          editionId={piece.editionId}
          character={ch.id}
          roleName={ch.name}
          onBack={() => go({ screen: "role", opera: opera.id, character: ch.id })}
          learned={(learned[roleKey(r)] ?? []).includes(key)}
          onToggleLearned={() => ctx.toggleLearned(r, key)}
          context={piece.context}
          inOpera={(() => {
            const list = RUNNING[opera.id];
            const i = list?.findIndex((n) => n.piece?.character === ch.id && n.piece.index === place.piece) ?? -1;
            return list && i >= 0 ? { n: i + 1, total: list.length, before: list[i - 1]?.title, after: list[i + 1]?.title, opera: opera.title } : undefined;
          })()}
          />
        </>
      );
    }
    return (
      <Shell ctx={ctx}>
        <PiecePage ctx={ctx} opera={opera} ch={ch} index={place.piece} />
        {bravoEl}
      </Shell>
    );
  }

  let page;
  if (place.screen === "role") {
    const opera = findOpera(place.opera);
    page = <RolePage ctx={ctx} opera={opera} ch={findCharacter(opera, place.character)} />;
  } else if (place.screen === "opera") page = <OperaPage ctx={ctx} opera={findOpera(place.opera)} />;
  else if (place.screen === "explore") page = place.by === "voice" ? <ExploreVoices ctx={ctx} voice={place.voice} /> : <ExploreOperas ctx={ctx} />;
  else page = <ProfilePage ctx={ctx} />;
  return (
    <Shell ctx={ctx}>
      {page}
      {bravoEl}
    </Shell>
  );
}
