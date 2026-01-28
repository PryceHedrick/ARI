#!/usr/bin/env bash
set -euo pipefail

# ARI Gateway - Service Status
# Checks if the ARI Gateway is installed, running, and healthy

PLIST_NAME="com.ari.gateway"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$LAUNCH_AGENTS_DIR/$PLIST_NAME.plist"
LOG_DIR="$HOME/.ari/logs"
HEALTH_URL="http://127.0.0.1:3141/health"

echo "ARI Gateway Status"
echo "=================="
echo ""

# Check if plist is installed
if [ -f "$PLIST_PATH" ]; then
    echo "Installed: Yes"
else
    echo "Installed: No"
    echo ""
    echo "Run './install.sh' to install the service."
    exit 0
fi

# Check if service is loaded
if launchctl list | grep -q "$PLIST_NAME"; then
    echo "Loaded:    Yes"

    # Get PID
    PID=$(launchctl list | grep "$PLIST_NAME" | awk '{print $1}')
    if [ "$PID" != "-" ]; then
        echo "PID:       $PID"
    else
        echo "PID:       Not running"
    fi
else
    echo "Loaded:    No"
    echo ""
    echo "Service is installed but not loaded."
    echo "Run 'launchctl load $PLIST_PATH' to load it."
    exit 0
fi

echo ""

# Check health endpoint
echo "Health Check:"
if HEALTH_RESPONSE=$(curl -sf "$HEALTH_URL" 2>&1); then
    echo "  Status:  Healthy"
    echo "  URL:     $HEALTH_URL"
    if command -v jq >/dev/null 2>&1; then
        echo "  Response: $(echo "$HEALTH_RESPONSE" | jq -c .)"
    fi
else
    echo "  Status:  Unhealthy"
    echo "  URL:     $HEALTH_URL"
    echo "  Error:   Service not responding"
fi

echo ""

# Show recent log entries
echo "Recent Logs:"
echo "------------"
if [ -f "$LOG_DIR/gateway-stderr.log" ]; then
    echo "Latest errors (last 5 lines):"
    tail -n 5 "$LOG_DIR/gateway-stderr.log" 2>/dev/null | sed 's/^/  /' || echo "  (no errors)"
else
    echo "  No error log found"
fi

echo ""

if [ -f "$LOG_DIR/gateway-stdout.log" ]; then
    echo "Latest output (last 5 lines):"
    tail -n 5 "$LOG_DIR/gateway-stdout.log" 2>/dev/null | sed 's/^/  /' || echo "  (no output)"
else
    echo "  No output log found"
fi

echo ""
echo "Log files:"
echo "  $LOG_DIR/gateway-stdout.log"
echo "  $LOG_DIR/gateway-stderr.log"
