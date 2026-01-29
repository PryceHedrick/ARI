#!/bin/bash
# ARI Health Check Script
# Run this to verify ARI is operational

set -e

ARI_HOST="${ARI_HOST:-127.0.0.1}"
ARI_PORT="${ARI_PORT:-3141}"
ARI_URL="http://${ARI_HOST}:${ARI_PORT}"

echo "╔═══════════════════════════════════════╗"
echo "║         ARI HEALTH CHECK              ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check gateway
echo -n "Gateway........... "
if curl -s "${ARI_URL}/health" > /dev/null 2>&1; then
  echo "✓ ONLINE"
  GATEWAY_UP=true
else
  echo "✗ OFFLINE"
  GATEWAY_UP=false
fi

# Check daemon
echo -n "Daemon............ "
if launchctl list | grep -q "com.ari.daemon" 2>/dev/null; then
  echo "✓ RUNNING"
else
  echo "○ NOT INSTALLED"
fi

# Check audit chain
echo -n "Audit Chain....... "
if [ -f ~/.ari/audit.json ]; then
  ENTRIES=$(wc -l < ~/.ari/audit.json | tr -d ' ')
  echo "✓ ${ENTRIES} entries"
else
  echo "○ NOT INITIALIZED"
fi

# Check config
echo -n "Config............ "
if [ -f ~/.ari/config.json ]; then
  echo "✓ LOADED"
else
  echo "○ NOT FOUND"
fi

# If gateway is up, get detailed status
if [ "$GATEWAY_UP" = true ]; then
  echo ""
  echo "─── Gateway Status ───"
  curl -s "${ARI_URL}/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4
  echo ""
  echo "─── System Status ───"
  curl -s "${ARI_URL}/status" 2>/dev/null | head -20
fi

echo ""
echo "Check complete: $(date)"
