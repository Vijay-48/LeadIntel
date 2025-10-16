#!/bin/bash

# Production startup script for LeadIntel Backend

# Default port if not set
export PORT=${PORT:-10000}

echo "Starting LeadIntel Backend on port $PORT..."
echo "MongoDB URL: ${MONGO_URL:0:30}..."  # Show first 30 chars only for security
echo "Database: $DB_NAME"
echo "CORS Origins: $CORS_ORIGINS"

# Start the server
exec uvicorn server:app --host 0.0.0.0 --port $PORT
