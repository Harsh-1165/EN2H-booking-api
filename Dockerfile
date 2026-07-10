# Build Stage
FROM node:22-slim AS builder
WORKDIR /usr/src/app

# Install build dependencies for native modules (sqlite3 & bcrypt)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM node:22-slim AS runner
WORKDIR /usr/src/app

# Install runtime dependencies for native modules if needed
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

# Create folder for SQLite data persistence
RUN mkdir -p /usr/src/app/data

# Declare volume for persistence
VOLUME /usr/src/app/data

ENV PORT=3000
ENV NODE_ENV=production
ENV DATABASE_TYPE=sqlite
ENV DATABASE_NAME=/usr/src/app/data/database.sqlite

EXPOSE 3000
CMD ["node", "dist/main"]
