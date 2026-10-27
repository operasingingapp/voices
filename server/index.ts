import { createCounterpartServer } from "./app";

const port = Number(process.env.PORT ?? (process.env.NODE_ENV === "production" ? 3000 : 3001));
const srv = createCounterpartServer({
  dbFile: process.env.CP_DB ?? "data/counterpart.db",
  contentDir: process.env.CP_CONTENT ?? "data/content",
  staticDir: process.env.NODE_ENV === "production" ? "dist" : undefined,
  secureCookies: process.env.CP_SECURE_COOKIES === "1",
});

srv.server.listen(port, () => {
  console.log(`Counterpart ${process.env.NODE_ENV === "production" ? "app" : "API"} listening on http://localhost:${port}`);
});

for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => srv.close().then(() => process.exit(0)));
