# Stufe 1: App bauen
FROM docker.io/library/node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG BASE_PATH=/
RUN npm run build

# Stufe 2: nur der Build und static-web-server – kein Node, kein Quellcode
FROM docker.io/joseluisq/static-web-server:2
COPY static-web-server.toml /etc/static-web-server.toml
COPY --from=build /app/dist /public
ENV SERVER_CONFIG_FILE=/etc/static-web-server.toml
# Ohne root (nobody); Port 8080 braucht keine Sonderrechte
USER 65534:65534
EXPOSE 8080
