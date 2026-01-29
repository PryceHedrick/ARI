#!/bin/bash
# ARI Autonomous Agent Setup
#
# This script configures ARI for autonomous operation with:
# - Pushover two-way notifications
# - Claude API integration
# - 24/7 monitoring
#
# Prerequisites:
# - Pushover account with User Key and API Token
# - Anthropic API key for Claude
#
# Security:
# - All credentials stored with 600 permissions
# - Credentials never logged or transmitted in notifications

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARI_ROOT="$(dirname "$SCRIPT_DIR")"
ARI_DIR="${HOME}/.ari"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║           ARI AUTONOMOUS AGENT SETUP                             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Create .ari directory with secure permissions
mkdir -p "$ARI_DIR"
chmod 700 "$ARI_DIR"

# Check for existing Pushover config
if [ -f "$ARI_DIR/pushover.conf" ]; then
  echo "✓ Pushover credentials found"
  source "$ARI_DIR/pushover.conf"
else
  echo "Pushover credentials not found."
  echo ""
  read -p "Enter Pushover User Key: " PUSHOVER_USER
  read -p "Enter Pushover API Token: " PUSHOVER_TOKEN

  cat > "$ARI_DIR/pushover.conf" << EOF
PUSHOVER_USER="$PUSHOVER_USER"
PUSHOVER_TOKEN="$PUSHOVER_TOKEN"
EOF
  chmod 600 "$ARI_DIR/pushover.conf"
  echo "✓ Pushover credentials saved"
fi

# Check for Claude API key
echo ""
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "✓ Claude API key found in environment"
  CLAUDE_KEY="$ANTHROPIC_API_KEY"
else
  read -p "Enter Anthropic API Key (or press Enter to skip): " CLAUDE_KEY
fi

# Create autonomous config
echo ""
echo "Creating autonomous agent configuration..."

cat > "$ARI_DIR/autonomous.json" << EOF
{
  "enabled": true,
  "pollIntervalMs": 5000,
  "maxConcurrentTasks": 1,
  "pushover": {
    "enabled": true,
    "userKey": "$PUSHOVER_USER",
    "apiToken": "$PUSHOVER_TOKEN"
  },
  "claude": {
    "apiKey": "${CLAUDE_KEY:-}",
    "model": "claude-sonnet-4-20250514",
    "maxTokens": 4096
  },
  "security": {
    "requireConfirmation": true,
    "allowedCommands": [],
    "blockedPatterns": ["rm -rf", "sudo", "password", "secret"]
  }
}
EOF
chmod 600 "$ARI_DIR/autonomous.json"
echo "✓ Autonomous config created"

# Create initial state
cat > "$ARI_DIR/agent-state.json" << EOF
{
  "running": false,
  "startedAt": null,
  "tasksProcessed": 0,
  "lastActivity": null,
  "errors": 0
}
EOF
chmod 600 "$ARI_DIR/agent-state.json"

# Create queue directory
mkdir -p "$ARI_DIR/queue"
echo "[]" > "$ARI_DIR/queue/tasks.json"
chmod 600 "$ARI_DIR/queue/tasks.json"

# Setup monitoring cron job
echo ""
echo "Setting up monitoring cron job..."
CRON_CMD="*/5 * * * * $ARI_ROOT/scripts/ari-monitor.sh >> $ARI_DIR/monitor.log 2>&1"

# Check if already installed
if crontab -l 2>/dev/null | grep -q "ari-monitor.sh"; then
  echo "✓ Monitor cron job already installed"
else
  (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
  echo "✓ Monitor cron job installed (runs every 5 minutes)"
fi

# Test Pushover
echo ""
echo "Testing Pushover notification..."
if [ -n "$PUSHOVER_USER" ] && [ -n "$PUSHOVER_TOKEN" ]; then
  RESPONSE=$(curl -s \
    --form-string "token=$PUSHOVER_TOKEN" \
    --form-string "user=$PUSHOVER_USER" \
    --form-string "message=ARI autonomous agent configured successfully" \
    --form-string "title=ARI: Setup Complete" \
    https://api.pushover.net/1/messages.json)

  if echo "$RESPONSE" | grep -q '"status":1'; then
    echo "✓ Test notification sent"
  else
    echo "⚠ Notification may have failed"
  fi
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                     SETUP COMPLETE                               ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║                                                                  ║"
echo "║  Autonomous agent is configured!                                 ║"
echo "║                                                                  ║"
echo "║  To start:                                                       ║"
echo "║    npx ari daemon install    (installs as service)               ║"
echo "║    npx ari gateway start     (starts gateway)                    ║"
echo "║                                                                  ║"
echo "║  To test:                                                        ║"
echo "║    npx ari autonomous test   (tests connections)                 ║"
echo "║    npx ari autonomous send \"Hello\"                               ║"
echo "║                                                                  ║"
echo "║  You will receive:                                               ║"
echo "║    - Notifications when ARI goes online/offline                  ║"
echo "║    - Alerts for security issues                                  ║"
echo "║    - Task completion reports                                     ║"
echo "║                                                                  ║"
if [ -z "$CLAUDE_KEY" ]; then
echo "║  ⚠  Claude API not configured - add key for full autonomy        ║"
echo "║     npx ari autonomous setup --claude-key YOUR_KEY               ║"
echo "║                                                                  ║"
fi
echo "╚══════════════════════════════════════════════════════════════════╝"
