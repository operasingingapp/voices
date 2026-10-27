import { useEffect, useState } from "react";
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
  type Ctx,
  type PiecePlace,
  type Place,
  type Profile,
  type RoleRef,
} from "./flow";
import { NUMBERS } from "./opera-extra";
import { Practice } from "./Practice";

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
    case "piece":
      return o.opera && o.character && typeof o.piece === "number" ? { screen: "piece", opera: o.opera, character: o.character, piece: o.piece } : null;
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
  const [place, setPlace] = useState<Place>(() => {
    if (!onboarded) return { screen: "onboarding", step: 1 };
    return migrate(read<unknown>(K.place, null)) ?? home();
  });

  useEffect(() => write(K.place, place), [place]);
  // however you arrive at an aria (a tap, or reopening the app on it), it becomes the one to continue
  useEffect(() => {
    if (place.screen !== "piece") return;
    if (!findCharacter(findOpera(place.opera), place.character).pieces[place.piece]?.editionId) return;
    const r = { opera: place.opera, character: place.character };
    setLast(place);
    write(K.last, place);
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
  const go = (p: Place) => setPlace(p);
  const ctx: Ctx = {
    place,
    go,
    home,
    roles,
    current,
    last,
    learned,
    toggleLearned: (r, key) => {
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

  if (place.screen === "onboarding") return <Onboarding ctx={ctx} step={place.step} role={place.role} by={place.by} opera={place.opera} />;

  if (place.screen === "piece") {
    const opera = findOpera(place.opera);
    const ch = findCharacter(opera, place.character);
    const piece = ch.pieces[place.piece];
    if (piece?.editionId === "puccini-o-mio-babbino-caro") {
      const r = { opera: opera.id, character: ch.id };
      const key = piece.id ?? piece.title;
      return (
        <Practice
          roleName={ch.name}
          onBack={() => go({ screen: "role", opera: opera.id, character: ch.id })}
          learned={(learned[roleKey(r)] ?? []).includes(key)}
          onToggleLearned={() => ctx.toggleLearned(r, key)}
          context={piece.context}
          inOpera={(() => {
            const list = NUMBERS[opera.id];
            const i = list?.findIndex((n) => n.piece?.character === ch.id && n.piece.index === place.piece) ?? -1;
            return list && i >= 0 ? { n: i + 1, total: list.length, before: list[i - 1]?.title, after: list[i + 1]?.title, opera: opera.title } : undefined;
          })()}
        />
      );
    }
    return (
      <Shell ctx={ctx}>
        <PiecePage ctx={ctx} opera={opera} ch={ch} index={place.piece} />
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
  return <Shell ctx={ctx}>{page}</Shell>;
}
