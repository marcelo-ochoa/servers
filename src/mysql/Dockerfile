FROM node:24-alpine AS builder

# Update and upgrade to fix OS-level vulnerabilities
RUN apk update && apk upgrade --no-cache

COPY src/mysql /app
COPY tsconfig.json /tsconfig.json

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm npm install

RUN npm run build

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev

FROM node:24-alpine AS release

# Update and upgrade to fix OS-level vulnerabilities
RUN apk update && apk upgrade --no-cache

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

WORKDIR /app

RUN npm ci --ignore-scripts --omit-dev

ENTRYPOINT ["node", "dist/index.js"]
