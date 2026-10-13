# ------------------------------------------------------------------
#  Private Hospital CMS — single container (website + API + admin panel)
#  Build:  docker build -t hospital-cms .
#  Run:    docker run -d -p 4000:4000 -v hospital-data:/app/server/data \
#            -e SESSION_SECRET="$(openssl rand -base64 48)" hospital-cms
# ------------------------------------------------------------------

# ---------- build the front-end ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# better-sqlite3 needs a compiler only if no prebuilt binary matches
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
RUN apt-get purge -y python3 make g++ && apt-get autoremove -y

COPY --from=build /app/dist ./dist
COPY server ./server
COPY scripts ./scripts

# Patient data and uploads live here — mount a volume in production.
VOLUME ["/app/server/data"]
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Seed on first boot, then serve. The seed is idempotent: existing content is kept.
CMD ["sh", "-c", "node server/seed.js && node server/index.js"]
