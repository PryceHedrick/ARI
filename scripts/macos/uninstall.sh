#!/usr/bin/env bash
set -euo pipefail

# ARI Gateway - macOS LaunchAgent Uninstallation
# Stops and removes the ARI Gateway service

PLIST_NAME="com.ari.gateway"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$LAUNCH_AGENTS_DIR/$PLIST_NAME.plist"

echo "Uninstalling ARI Gateway..."
echo ""

# Step 1: Unload the service
echo "1. Stopping service..."
if launchctl list | grep -q "$PLIST_NAME"; then
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    echo "   ✓ Service stopped"
else
    echo "   Service not running"
fi
echo ""

# Step 2: Remove the plist file
echo "2. Removing LaunchAgent..."
if [ -f "$PLIST_PATH" ]; then
    rm "$PLIST_PATH"
    echo "   ✓ Plist removed: $PLIST_PATH"
else
    echo "   Plist not found (already removed)"
fi
echo ""

echo "Uninstallation complete!"
echo ""
echo "Note: Logs and data remain at:"
echo "  ~/.ari/logs/"
echo "  ~/.ari/"
echo ""
echo "To remove all ARI data, run:"
echo "  rm -rf ~/.ari"
