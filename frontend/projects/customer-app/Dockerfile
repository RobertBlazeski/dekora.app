# Build context is the frontend/ workspace root (needs shared/, angular.json, etc.), so this
# is invoked as: docker build -f projects/customer-app/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG API_URL
ARG APP_DOMAIN
RUN sed -i "s|__API_URL__|${API_URL}|g" projects/customer-app/src/environments/environment.ts
# The SSR server's SSRF host guard defaults to ["localhost"] (see angular.json) — Caddy
# forwards the real Host header, so without this every production request gets rejected.
RUN sed -i "s|\"allowedHosts\": \[\"localhost\"\]|\"allowedHosts\": [\"localhost\", \"${APP_DOMAIN}\"]|" angular.json
RUN npx ng build customer-app --configuration production

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /workspace/dist/customer-app/browser ./browser
COPY --from=build /workspace/dist/customer-app/server ./server
ENV PORT=4000
EXPOSE 4000
CMD ["node", "server/server.mjs"]
