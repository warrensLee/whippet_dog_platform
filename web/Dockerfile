FROM node:20-alpine AS build

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build .next/standalone ./
COPY --from=build .next/static ./.next/static
COPY --from=build public ./public
ENV NODE_ENV=production
CMD ["node", "server.js"]
