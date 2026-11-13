// Private site: the password set in the Pages project (variable SITE_PASSWORD). Without it nobody gets in.
// The browser asks once (Basic auth); a successful login also sets a secure cookie for 30 days, because some
// requests (Safari's audio, for one) do not carry the Basic credentials but do carry cookies.
const COOKIE = "sv_auth";
async function token(pw) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("sottovoce:" + pw));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function onRequest(ctx) {
  const pw = ctx.env.SITE_PASSWORD;
  if (pw) {
    const want = await token(pw);
    const cookie = ctx.request.headers.get("Cookie") || "";
    if (cookie.split(/;\s*/).includes(`${COOKIE}=${want}`)) return ctx.next();
    const h = ctx.request.headers.get("Authorization") || "";
    if (h.startsWith("Basic ")) {
      let p = null;
      try { p = atob(h.slice(6)).split(/:(.*)/s)[1]; } catch {}
      if (p === pw) {
        const res = await ctx.next();
        const out = new Response(res.body, res);
        out.headers.append("Set-Cookie", `${COOKIE}=${want}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
        return out;
      }
    }
  }
  return new Response("Sottovoce is private for now.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Sottovoce", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}
