#!/bin/bash
# ARI Secure Pushover Notification
#
# SECURITY:
# - Credentials stored in ~/.ari/pushover.conf (chmod 600)
# - Never sends sensitive data (keys, tokens, audit content)
# - Only sends status messages, never data payloads
#
# Setup:
#   1. Create ~/.ari/pushover.conf with:
#      PUSHOVER_USER="your-user-key"
#      PUSHOVER_TOKEN="your-api-token"
#   2. chmod 600 ~/.ari/pushover.conf

CONFIG_FILE="${HOME}/.ari/pushover.conf"

# Secure config loading
if [ -f "$CONFIG_FILE" ]; then
  # Verify permissions (should be 600)
  PERMS=$(stat -f "%Lp" "$CONFIG_FILE" 2>/dev/null || stat -c "%a" "$CONFIG_FILE" 2>/dev/null)
  if [ "$PERMS" != "600" ]; then
    echo "WARNING: ${CONFIG_FILE} should have permissions 600, has ${PERMS}"
    echo "Run: chmod 600 ${CONFIG_FILE}"
  fi
  source "$CONFIG_FILE"
fi

# Validate credentials exist
if [ -z "$PUSHOVER_USER" ] || [ -z "$PUSHOVER_TOKEN" ]; then
  echo "Pushover not configured. Create ${CONFIG_FILE} with:"
  echo "  PUSHOVER_USER=\"your-user-key\""
  echo "  PUSHOVER_TOKEN=\"your-api-token\""
  exit 1
fi

# ALLOWED notification types (whitelist approach)
ALLOWED_TYPES="status|alert|health|startup|shutdown"

TYPE="${1:-status}"
TITLE="${2:-ARI}"
MESSAGE="${3:-System notification}"
PRIORITY="${4:-0}"

# Sanitize inputs - remove anything that looks sensitive
sanitize() {
  echo "$1" | sed -E \
    -e 's/[a-f0-9]{32,}/**REDACTED**/gi' \
    -e 's/token[=:][^ ]+/**REDACTED**/gi' \
    -e 's/key[=:][^ ]+/**REDACTED**/gi' \
    -e 's/password[=:][^ ]+/**REDACTED**/gi' \
    -e 's/secret[=:][^ ]+/**REDACTED**/gi' \
    -e 's/Bearer [^ ]+/Bearer **REDACTED**/gi'
}

# Validate type
if ! echo "$TYPE" | grep -qE "^(${ALLOWED_TYPES})$"; then
  echo "Invalid notification type. Allowed: ${ALLOWED_TYPES}"
  exit 1
fi

# Sanitize message content
SAFE_TITLE=$(sanitize "$TITLE" | cut -c1-100)
SAFE_MESSAGE=$(sanitize "$MESSAGE" | cut -c1-500)

# Send notification
curl -s \
  --form-string "token=${PUSHOVER_TOKEN}" \
  --form-string "user=${PUSHOVER_USER}" \
  --form-string "title=${SAFE_TITLE}" \
  --form-string "message=${SAFE_MESSAGE}" \
  --form-string "priority=${PRIORITY}" \
  --form-string "sound=cosmic" \
  https://api.pushover.net/1/messages.json > /dev/null

exit 0
