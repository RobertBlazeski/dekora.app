# Build context is the frontend/ workspace root — invoked as:
# docker build -f projects/admin-app/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG API_URL
RUN sed -i "s|__API_URL__|${API_URL}|g" projects/admin-app/src/environments/environment.ts
RUN npx ng build admin-app --configuration production

FROM nginx:alpine AS runtime
COPY --from=build /workspace/dist/admin-app/browser /usr/share/nginx/html
COPY projects/admin-app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
