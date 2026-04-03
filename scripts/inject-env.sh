#!/bin/sh

echo "Starting environment variable injection..."

# Replace environment variables in built files
echo "Injecting VITE_API_URL: ${VITE_API_URL}"
echo "Injecting VITE_JOB_TTL_MIN: ${VITE_JOB_TTL_MIN}"
echo "Injecting VITE_READY_TTL_HOURS: ${VITE_READY_TTL_HOURS}"
echo "Injecting VITE_POLL_INTERVAL_SEC: ${VITE_POLL_INTERVAL_SEC}"

# Find and replace in all JS files
find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" {} \;
find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|__VITE_JOB_TTL_MIN__|${VITE_JOB_TTL_MIN}|g" {} \;
find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|__VITE_READY_TTL_HOURS__|${VITE_READY_TTL_HOURS}|g" {} \;
find /usr/share/nginx/html -name "*.js" -type f -exec sed -i "s|__VITE_POLL_INTERVAL_SEC__|${VITE_POLL_INTERVAL_SEC}|g" {} \;

# Find and replace in HTML files (in case env vars are embedded there)
find /usr/share/nginx/html -name "*.html" -type f -exec sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" {} \;
find /usr/share/nginx/html -name "*.html" -type f -exec sed -i "s|__VITE_JOB_TTL_MIN__|${VITE_JOB_TTL_MIN}|g" {} \;
find /usr/share/nginx/html -name "*.html" -type f -exec sed -i "s|__VITE_READY_TTL_HOURS__|${VITE_READY_TTL_HOURS}|g" {} \;
find /usr/share/nginx/html -name "*.html" -type f -exec sed -i "s|__VITE_POLL_INTERVAL_SEC__|${VITE_POLL_INTERVAL_SEC}|g" {} \;

echo "Environment variables injected successfully!"
echo "VITE_API_URL set to: ${VITE_API_URL}"
echo "VITE_JOB_TTL_MIN set to: ${VITE_JOB_TTL_MIN}"
echo "VITE_READY_TTL_HOURS set to: ${VITE_READY_TTL_HOURS}"
echo "VITE_POLL_INTERVAL_SEC set to: ${VITE_POLL_INTERVAL_SEC}"

# Continue with nginx startup (this script runs before nginx starts)
echo "Environment injection complete. Nginx will start next..."