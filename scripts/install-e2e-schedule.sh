#!/bin/bash
# ARI E2E Daily Schedule Installer
# Installs launchd configuration for automated daily E2E tests at 9 AM

set -e

# Configuration
PLIST_NAME="com.ari.e2e.plist"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_TEMPLATE="$SCRIPT_DIR/macos/$PLIST_NAME"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME"

# Derive paths
ARI_PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ARI_DATA_DIR="$HOME/.ari"
HOME_DIR="$HOME"

echo "=================================================="
echo "  ARI E2E Daily Schedule Installer"
echo "=================================================="
echo ""
echo "Configuration:"
echo "  Project: $ARI_PROJECT_DIR"
echo "  Data:    $ARI_DATA_DIR"
echo "  Schedule: Daily at 9:00 AM"
echo ""

# Create necessary directories
mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$ARI_DATA_DIR/logs"
mkdir -p "$ARI_DATA_DIR/e2e"

# Check if template exists
if [ ! -f "$PLIST_TEMPLATE" ]; then
    echo "Error: Template not found at $PLIST_TEMPLATE"
    exit 1
fi

# Unload existing job if present
if launchctl list | grep -q "com.ari.e2e"; then
    echo "Unloading existing schedule..."
    launchctl unload "$PLIST_DST" 2>/dev/null || true
fi

# Process template with path substitutions
echo "Creating configuration..."
sed -e "s|__ARI_PROJECT_DIR__|$ARI_PROJECT_DIR|g" \
    -e "s|__ARI_DATA_DIR__|$ARI_DATA_DIR|g" \
    -e "s|__HOME_DIR__|$HOME_DIR|g" \
    "$PLIST_TEMPLATE" > "$PLIST_DST"

# Validate plist
if ! plutil -lint "$PLIST_DST" > /dev/null 2>&1; then
    echo "Error: Generated plist is invalid"
    rm -f "$PLIST_DST"
    exit 1
fi

# Load the schedule
echo "Loading schedule..."
launchctl load "$PLIST_DST"

# Verify
if launchctl list | grep -q "com.ari.e2e"; then
    echo ""
    echo "=================================================="
    echo "  Installation successful!"
    echo "=================================================="
    echo ""
    echo "E2E tests will run daily at 9:00 AM"
    echo ""
    echo "Commands:"
    echo "  View status:  launchctl list | grep ari.e2e"
    echo "  View logs:    tail -f $ARI_DATA_DIR/logs/e2e-stdout.log"
    echo "  Run now:      launchctl start com.ari.e2e"
    echo "  Uninstall:    launchctl unload $PLIST_DST && rm $PLIST_DST"
    echo ""
else
    echo "Error: Failed to load schedule"
    exit 1
fi
