#!/bin/bash
# ARI 24/7 Secure Monitor
#
# SECURITY PRINCIPLES:
# - Never sends data content, only status
# - No tokens/keys in notifications
# - No audit content exposed
# - Logs stored locally only
# - Credentials in secure config file
#
# Install as launchd service for 24/7 monitoring

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARI_URL="http://127.0.0.1:3141"
STATE_FILE="${HOME}/.ari/monitor-state"
LOG_FILE="${HOME}/.ari/monitor.log"
CONFIG_FILE="${HOME}/.ari/pushover.conf"

# Ensure .ari directory exists with secure permissions
mkdir -p "${HOME}/.ari"
chmod 700 "${HOME}/.ari"

# Load credentials securely
if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi

# Secure notification - NEVER includes sensitive data
send_secure_alert() {
  local type="$1"      # status|alert|health
  local title="$2"     # Short title only
  local status="$3"    # online|offline|warning
  local priority="${4:-0}"

  # Only send if configured
  [ -z "$PUSHOVER_USER" ] && return

  # Build safe message - NO DATA, only status
  local safe_msg="Status: ${status} | Time: $(date '+%H:%M')"

  curl -s --max-time 10 \
    --form-string "token=${PUSHOVER_TOKEN}" \
    --form-string "user=${PUSHOVER_USER}" \
    --form-string "title=ARI: ${title}" \
    --form-string "message=${safe_msg}" \
    --form-string "priority=${priority}" \
    --form-string "sound=cosmic" \
    https://api.pushover.net/1/messages.json > /dev/null 2>&1
}

# Health check - returns only status, no data
check_health() {
  local response=$(curl -s --max-time 5 "${ARI_URL}/health" 2>/dev/null)
  if [ -n "$response" ]; then
    echo "online"
  else
    echo "offline"
  fi
}

# Audit integrity check - returns only valid/invalid, no content
check_integrity() {
  local response=$(curl -s --max-time 10 "${ARI_URL}/api/audit/verify" 2>/dev/null)
  if echo "$response" | grep -q '"valid":true' 2>/dev/null; then
    echo "valid"
  else
    echo "unknown"
  fi
}

# Main monitoring
main() {
  local prev_state=$(cat "$STATE_FILE" 2>/dev/null || echo "unknown")
  local current_state=$(check_health)

  # State change notifications
  if [ "$prev_state" != "$current_state" ]; then
    if [ "$current_state" = "online" ]; then
      send_secure_alert "status" "Online" "operational" 0
    elif [ "$current_state" = "offline" ]; then
      send_secure_alert "alert" "Offline" "not responding" 1
    fi
    echo "$current_state" > "$STATE_FILE"
  fi

  # Integrity check (only when online, no content leaked)
  if [ "$current_state" = "online" ]; then
    local integrity=$(check_integrity)
    if [ "$integrity" = "unknown" ]; then
      # Only alert about check failure, not content
      send_secure_alert "alert" "Check Failed" "integrity unknown" 1
    fi
  fi

  # Local log only (never sent externally)
  echo "$(date '+%Y-%m-%d %H:%M:%S') | ${current_state}" >> "$LOG_FILE"

  # Rotate log if too large (keep local)
  if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE") -gt 10000 ]; then
    tail -1000 "$LOG_FILE" > "${LOG_FILE}.tmp"
    mv "${LOG_FILE}.tmp" "$LOG_FILE"
  fi
}

main "$@"
