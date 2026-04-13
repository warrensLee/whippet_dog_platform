FROM node:20-alpine AS build
RUN mkdir /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci 
COPY . .
RUN npm run build

FROM nginx:1.29
RUN mkdir /app 
WORKDIR /app
COPY --from=0 /app/out .
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost/health || exit 1
COPY nginx/production.conf /etc/nginx/nginx.conf

