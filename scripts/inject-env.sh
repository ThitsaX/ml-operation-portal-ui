#!/bin/sh

echo "Starting environment variable injection..."

# Replace environment variables in built files
echo "Injecting VITE_API_URL: ${VITE_API_URL}"

# Find and replace in all JS files
find /app/dist -name "*.js" -type f -exec sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" {} \;

# Find and replace in HTML files (in case env vars are embedded there)
find /app/dist -name "*.html" -type f -exec sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" {} \;

echo "Environment variables injected successfully!"
echo "VITE_API_URL set to: ${VITE_API_URL}"

# Start the server
echo "Starting application server..."
exec "$@"