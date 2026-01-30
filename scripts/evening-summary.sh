#!/bin/bash
#
# ARI Evening Summary Script
#
# Runs at 9 PM Indiana time to:
# 1. Summarize the day's activities
# 2. Create/update Notion daily log
# 3. No SMS (approaching quiet hours)
#
# Cron: 0 21 * * * /Users/prycehedrick/Work/ARI/scripts/evening-summary.sh
#

set -e

ARI_DIR="/Users/prycehedrick/Work/ARI"
LOG_FILE="${HOME}/.ari/logs/evening-summary.log"
ENV_FILE="${HOME}/.ari/notification.env"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting evening summary..."

# Load environment
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  log "WARNING: $ENV_FILE not found. Notifications may not work."
fi

# Change to ARI directory
cd "$ARI_DIR"

# Run the summary via Node.js
if [ -f "dist/autonomous/briefings.js" ]; then
  node -e "
    import('./dist/autonomous/notification-manager.js').then(async ({ notificationManager }) => {
      import('./dist/autonomous/briefings.js').then(async ({ createBriefingGenerator }) => {
        // Initialize notification manager (Notion only for evening)
        await notificationManager.init({
          sms: { enabled: false },
          notion: {
            enabled: !!process.env.NOTION_API_KEY,
            apiKey: process.env.NOTION_API_KEY,
            inboxDatabaseId: process.env.NOTION_INBOX_DB_ID,
            dailyLogParentId: process.env.NOTION_DAILY_LOG_PARENT_ID,
          },
        });

        // Generate summary
        const generator = createBriefingGenerator(notificationManager);
        await generator.initNotion({
          enabled: !!process.env.NOTION_API_KEY,
          apiKey: process.env.NOTION_API_KEY,
          dailyLogParentId: process.env.NOTION_DAILY_LOG_PARENT_ID,
        });

        const result = await generator.eveningSummary();
        console.log(JSON.stringify(result));
      });
    }).catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  " 2>&1 | tee -a "$LOG_FILE"
else
  log "ERROR: ARI not built. Run 'npm run build' first."
  exit 1
fi

log "Evening summary complete."
