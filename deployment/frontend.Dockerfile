FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies (allow lockfile updates)
RUN pnpm install --no-frozen-lockfile

# Copy source code (exclude node_modules via .dockerignore)
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
