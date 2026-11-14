// /a/<key>: the app's audio (R2 bucket sottovoce-audio, binding AUDIO) through the site itself, so the grand
// piano's chunks come from the same origin as the page: cached at the edge (caches.default) and in the browser for
// a year (every chunk's address names its encoding: piano/v2/...), byte ranges supported. The password middleware
// runs first, so only a signed-in visitor reaches the bucket or the edge cache.
const LONG = "public, max-age=31536000, immutable";
const SHORT = "public, max-age=300"; // manifests and other JSON may be rewritten

function rangeOf(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header || "");
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start, end;
  if (m[1] === "") {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(size - 1, Number(m[2]));
  }
  return start <= end && start < size ? { start, end } : "unsatisfiable";
}

async function respond(full, request) {
  // full: a 200 response with the whole body; answer a Range request from it
  const r = rangeOf(request.headers.get("Range"), Number(full.headers.get("Content-Length")) || 0);
  const etag = full.headers.get("ETag");
  if (!r && etag && request.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers: full.headers });
  const head = request.method === "HEAD";
  if (!r) return head ? new Response(null, { headers: full.headers }) : full;
  const size = Number(full.headers.get("Content-Length"));
  if (r === "unsatisfiable") return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  const headers = new Headers(full.headers);
  headers.set("Content-Range", `bytes ${r.start}-${r.end}/${size}`);
  headers.set("Content-Length", String(r.end - r.start + 1));
  if (head) return new Response(null, { status: 206, headers });
  const body = (await full.arrayBuffer()).slice(r.start, r.end + 1);
  return new Response(body, { status: 206, headers });
}

export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  const key = (Array.isArray(params.path) ? params.path : [params.path]).filter(Boolean).join("/");
  if (!key || key.split("/").some((p) => p === ".." || p === ".")) return new Response("Not found", { status: 404 });
  if (!env.AUDIO) return new Response("The audio bucket is not bound (AUDIO)", { status: 500 });

  // the edge cache holds whole objects, keyed by address alone (no Range, no credentials)
  const url = new URL(request.url);
  const cacheKey = new Request(url.origin + url.pathname, { method: "GET" });
  const cache = caches.default;
  let full = await cache.match(cacheKey);
  if (!full) {
    const obj = await env.AUDIO.get(key);
    if (!obj) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    if (!headers.get("Content-Type")) headers.set("Content-Type", key.endsWith(".m4a") ? "audio/mp4" : "application/octet-stream");
    headers.set("ETag", obj.httpEtag);
    headers.set("Content-Length", String(obj.size));
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", key.endsWith(".json") ? SHORT : LONG);
    const body = await obj.arrayBuffer();
    full = new Response(body, { headers });
    ctx.waitUntil(cache.put(cacheKey, full.clone()));
  }
  return respond(full, request);
}
