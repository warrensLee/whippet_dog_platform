FROM node:24-alpine@sha256:a1db41e58b58674705e9c5f886ab62fd906562087ee797632d3a30ed87219c4c AS build
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci 
COPY . .
RUN npm run build

FROM nginx:1.30.7
RUN mkdir /app 
WORKDIR /app
COPY --from=0 /app/out .
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost/health || exit 1
COPY nginx/production.conf /etc/nginx/nginx.conf

