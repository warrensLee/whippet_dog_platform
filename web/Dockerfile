FROM node:24-alpine@sha256:a1db41e58b58674705e9c5f886ab62fd906562087ee797632d3a30ed87219c4c AS build
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci 
COPY . .
RUN npm run build

FROM nginx:1.29@sha256:1881968aff6f7cdcc4b888c00a11f4ce241ad7ec957e0cb4a9e19e93a3ff87ea
RUN mkdir /app 
WORKDIR /app
COPY --from=0 /app/out .
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost/health || exit 1
COPY nginx/production.conf /etc/nginx/nginx.conf

