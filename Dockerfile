FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run server:build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# better-sqlite3 ships prebuilt binaries for linux/x64 (and arm64), so no
# build tools are needed on slim. If targeting an exotic arch, add:
#   RUN apt-get update && apt-get install -y python3 make g++
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/drizzle ./drizzle
VOLUME /data
ENV SQLITE_PATH=/data/sqlite.db PORT=8788
EXPOSE 8788
CMD ["node", "dist-server/index.node.js"]
