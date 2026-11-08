FROM node:24-bookworm-slim AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY src ./src
COPY proxy ./proxy
COPY scripts/build-proxy.mjs ./scripts/build-proxy.mjs
RUN node scripts/build-proxy.mjs
FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8080 PROXY_HOST=0.0.0.0 PROXY_DATABASE=/data/proxy-usage.db PROXY_CLIENTS_FILE=/run/secrets/bottomline-clients.json
WORKDIR /service
COPY --from=build /build/.proxy-build/server.cjs ./server.cjs
USER node
EXPOSE 8080
CMD ["node", "server.cjs"]
