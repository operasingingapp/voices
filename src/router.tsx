import { useEffect, useState } from "react";

export function navigate(to: string, replace = false) {
  if (replace) history.replaceState(null, "", to);
  else history.pushState(null, "", to);
  window.dispatchEvent(new Event("cp:navigate"));
  window.scrollTo(0, 0);
}

export function usePath(): string {
  const [path, setPath] = useState(location.pathname + location.search);
  useEffect(() => {
    const on = () => setPath(location.pathname + location.search);
    window.addEventListener("popstate", on);
    window.addEventListener("cp:navigate", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("cp:navigate", on);
    };
  }, []);
  return path;
}

export function match(pattern: string, path: string): Record<string, string> | null {
  const [p] = path.split("?");
  const a = pattern.split("/").filter(Boolean);
  const b = p.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const out: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) out[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return out;
}

export function Link(props: { to: string; className?: string; children: React.ReactNode; title?: string }) {
  return (
    <a
      href={props.to}
      className={props.className}
      title={props.title}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(props.to);
      }}
    >
      {props.children}
    </a>
  );
}
