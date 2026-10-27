import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { match, navigate, usePath } from "./router";
import { LoginPage } from "./pages/LoginPage";
import { LibraryPage } from "./pages/LibraryPage";
import { PracticePage } from "./pages/PracticePage";
import { ProductionPage } from "./pages/ProductionPage";
import { InvitePage } from "./pages/InvitePage";

export interface Me {
  id: string;
  username: string;
  displayName: string;
}

const AuthCtx = createContext<{ me: Me | null; refresh: () => Promise<void>; logout: () => Promise<void> }>({
  me: null,
  refresh: async () => {},
  logout: async () => {},
});
export const useAuth = () => useContext(AuthCtx);

export function App() {
  const path = usePath();
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ user: Me }>("/api/auth/me");
      setMe(r.user);
    } catch {
      setMe(null);
    } finally {
      setChecked(true);
    }
  }, []);
  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST", body: {} });
    setMe(null);
    navigate("/login");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!checked) return <div className="boot">Counterpart</div>;

  let page: React.ReactNode;
  let m: Record<string, string> | null;
  if ((m = match("/invite/:token", path))) page = <InvitePage token={m.token} />;
  else if (!me) page = <LoginPage />;
  else if (match("/login", path)) {
    const next = new URLSearchParams(location.search).get("next");
    navigate(next && next.startsWith("/") ? next : "/", true);
    page = null;
  } else if ((m = match("/practice/:edition", path))) page = <PracticePage key={path} editionId={m.edition} />;
  else if ((m = match("/p/:pid/v/:v", path))) page = <PracticePage key={path} productionId={m.pid} version={m.v} />;
  else if ((m = match("/p/:pid/rehearsal/:sid", path))) page = <PracticePage key={path} productionId={m.pid} sessionId={m.sid} />;
  else if ((m = match("/p/:pid", path))) page = <ProductionPage key={path} productionId={m.pid} />;
  else page = <LibraryPage />;

  return <AuthCtx.Provider value={{ me, refresh, logout }}>{page}</AuthCtx.Provider>;
}
