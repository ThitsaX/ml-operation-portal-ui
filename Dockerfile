# ---------- 1. Build Stage ----------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install OS deps for node-gyp etc. (needed for some npm packages)
RUN apk add --no-cache python3 make g++

# Install Yarn 3.x globally
RUN corepack enable && corepack prepare yarn@3.3.1 --activate

# Copy only package files first (better layer caching)
COPY package.json yarn.lock .yarnrc.yml ./
# include Yarn 3 cache & plugins
COPY .yarn ./.yarn

# Copy the rest of the project files
COPY . .

# Install all deps (including dev, for build)
RUN yarn install --immutable

# Set placeholder environment variables for build
ENV VITE_API_URL=__VITE_API_URL__

# Build the React app with placeholders
RUN yarn build


# ---------- 2. Production Stage ----------
FROM nginx:alpine AS runner

# Copy built React files to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the environment injection script
COPY scripts/inject-env.sh /docker-entrypoint.d/10-inject-env.sh

# Make the script executable
RUN chmod +x /docker-entrypoint.d/10-inject-env.sh

EXPOSE 3000

# nginx will automatically run scripts in /docker-entrypoint.d/ before starting
