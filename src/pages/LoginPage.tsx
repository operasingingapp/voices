import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../App";
import { navigate } from "../router";

export function LoginPage() {
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/login", { body: { username, password } });
      await refresh();
      const next = new URLSearchParams(location.search).get("next");
      navigate(next && next.startsWith("/") ? next : "/", true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <div className="login-panel">
        <h1 className="wordmark">Sottovoce</h1>
        <p className="login-lede">Learn your part. Rehearse from the same bar.</p>
        <form onSubmit={submit} className="form">
          <label>
            Username
            <input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="fine">Accounts are provisioned by your production team or created from an invitation link.</p>
      </div>
    </main>
  );
}
