#!/usr/bin/env bash
set -euo pipefail

# ARI Gateway - Service Restart
# Stops and starts the ARI Gateway service

PLIST_NAME="com.ari.gateway"
HEALTH_URL="http://127.0.0.1:3141/health"

echo "Restarting ARI Gateway..."
echo ""

# Step 1: Stop the service
echo "1. Stopping service..."
if launchctl list | grep -q "$PLIST_NAME"; then
    launchctl stop "$PLIST_NAME"
    echo "   ✓ Service stopped"
else
    echo "   Service not running"
fi
echo ""

# Step 2: Start the service
echo "2. Starting service..."
launchctl start "$PLIST_NAME"
echo "   ✓ Service start initiated"
echo ""

# Step 3: Wait briefly and check health
echo "3. Checking health..."
sleep 3

if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    echo "   ✓ Service is healthy"
    echo ""
    echo "Restart complete!"
else
    echo "   ✗ Health check failed"
    echo ""
    echo "The service may still be starting up."
    echo "Run './status.sh' to check current status."
    echo "Run './logs.sh' to view recent logs."
    exit 1
fi
