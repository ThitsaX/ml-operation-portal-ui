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
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built React files
COPY --from=builder /app/dist ./dist

# Copy the environment injection script
COPY scripts/inject-env.sh /app/inject-env.sh

# Make the script executable
RUN chmod +x /app/inject-env.sh

# Install a lightweight static file server
RUN yarn global add serve

EXPOSE 3000

# Use the injection script as entrypoint, then start the server
ENTRYPOINT ["/app/inject-env.sh"]
CMD ["serve", "dist", "-l", "3000"]
