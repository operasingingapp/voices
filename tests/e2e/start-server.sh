#!/bin/bash
# Starts a fresh, seeded Counterpart instance for the browser tests (port 3100).
set -e
cd "$(dirname "$0")/../.."
export CP_DB=data/e2e.db CP_CONTENT=data/content CP_HEARTBEAT_MS=2000 CP_CLAIM_GRACE_MS=1000
rm -f data/e2e.db data/e2e.db-wal data/e2e.db-shm
node --disable-warning=ExperimentalWarning --import tsx server/seed.ts > /dev/null
npx vite build > /dev/null
NODE_ENV=production PORT=3100 exec node --disable-warning=ExperimentalWarning --import tsx server/index.ts
