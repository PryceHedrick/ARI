#!/bin/bash
#
# ARI Weekly Review Script
#
# Runs Sunday at 6 PM Indiana time to:
# 1. Analyze the past week's activities
# 2. Generate weekly metrics and trends
# 3. Create Notion weekly review page
#
# Cron: 0 18 * * 0 ${HOME}/Work/ARI/scripts/weekly-review.sh
#

set -e

ARI_DIR="${HOME}/Work/ARI"
LOG_FILE="${HOME}/.ari/logs/weekly-review.log"
ENV_FILE="${HOME}/.ari/notification.env"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting weekly review..."

# Load environment
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  log "WARNING: $ENV_FILE not found. Notifications may not work."
fi

# Change to ARI directory
cd "$ARI_DIR"

# Run the review via Node.js
if [ -f "dist/autonomous/briefings.js" ]; then
  node -e "
    import('./dist/autonomous/notification-manager.js').then(async ({ notificationManager }) => {
      import('./dist/autonomous/briefings.js').then(async ({ createBriefingGenerator }) => {
        // Initialize notification manager (Notion only for weekly)
        await notificationManager.init({
          sms: { enabled: false },
          notion: {
            enabled: !!process.env.NOTION_API_KEY,
            apiKey: process.env.NOTION_API_KEY,
            inboxDatabaseId: process.env.NOTION_INBOX_DB_ID,
            dailyLogParentId: process.env.NOTION_DAILY_LOG_PARENT_ID,
          },
        });

        // Generate weekly review
        const generator = createBriefingGenerator(notificationManager);
        await generator.initNotion({
          enabled: !!process.env.NOTION_API_KEY,
          apiKey: process.env.NOTION_API_KEY,
          dailyLogParentId: process.env.NOTION_DAILY_LOG_PARENT_ID,
        });

        const result = await generator.weeklyReview();
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

log "Weekly review complete."
