# services/api-gateway/Dockerfile

# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install # MODIFIED: Removed --only=production

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Production image (though for dev, CMD will be overridden)
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy only necessary production files from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application (this will be overridden in dev by docker-compose)
CMD ["node", "dist/main.js"]