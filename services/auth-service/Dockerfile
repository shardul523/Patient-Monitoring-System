# services/auth-service/Dockerfile

# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install # Install all dependencies, including dev

COPY . .
RUN npm run build

# Stage 2: Production image (or development if CMD is overridden)
FROM node:20-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

EXPOSE 3001 

# Port specified in .env for auth-service
# Default command (can be overridden in docker-compose.yml for dev)
CMD ["node", "dist/main.js"]