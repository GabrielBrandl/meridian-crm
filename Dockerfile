FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--experimental-sqlite DATABASE_PATH=/tmp/meridian-build.db
RUN mkdir -p /tmp && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3010 NODE_OPTIONS=--experimental-sqlite
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/src/lib ./src/lib
COPY --from=build /app/n8n ./n8n
VOLUME ["/app/data"]
EXPOSE 3010
CMD ["node", "server.js"]
