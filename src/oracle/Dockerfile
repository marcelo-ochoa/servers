FROM node:slim AS builder

COPY src/oracle /app
COPY tsconfig.json /tsconfig.json

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm npm install

RUN npm run build

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev

FROM node:slim AS release

# Use BuildKit's automatic platform detection
ARG TARGETARCH

# Install Oracle Instant Client for thick mode support
# This is required for databases using Advanced Networking Option (ANO) encryption
# Using version 19.23 - stable and well-tested (version 23.x has issues with ORA-24960)
# Using full 'basic' package instead of 'basiclite' as it includes encryption libraries
# Supports both ARM64 and x86_64 architectures
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y libaio1 libnsl2 curl unzip && \
    rm -rf /var/lib/apt/lists/* && \
    cd /tmp && \
    # Detect architecture and set appropriate download URL
    if [ "$TARGETARCH" = "arm64" ]; then \
    ARCH_SUFFIX="arm64"; \
    echo "Detected ARM64 architecture"; \
    else \
    ARCH_SUFFIX="x64"; \
    echo "Detected x86_64 architecture"; \
    fi && \
    IC_URL="https://download.oracle.com/otn_software/linux/instantclient/1928000/instantclient-basic-linux.$ARCH_SUFFIX-19.28.0.0.0dbru.zip" && \
    echo "Downloading Oracle Instant Client from: $IC_URL" && \
    curl -o instantclient.zip "$IC_URL" && \
    unzip instantclient.zip && \
    mv instantclient_19_28 /usr/lib/instantclient && \
    rm instantclient.zip && \
    echo "Oracle Instant Client installed successfully for ${ARCH_SUFFIX}"

ENV LD_LIBRARY_PATH=/usr/lib/instantclient

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

WORKDIR /app

RUN npm ci --ignore-scripts --omit-dev

ENTRYPOINT ["node", "dist/index.js"]
