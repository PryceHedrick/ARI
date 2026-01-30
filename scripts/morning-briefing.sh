#!/bin/bash
#
# ARI Morning Briefing Script
#
# Runs at 7 AM Indiana time to:
# 1. Process queued notifications from overnight
# 2. Generate morning briefing
# 3. Send SMS ping + create Notion page
#
# Cron: 0 7 * * * /Users/prycehedrick/Work/ARI/scripts/morning-briefing.sh
#

set -e

ARI_DIR="/Users/prycehedrick/Work/ARI"
LOG_FILE="${HOME}/.ari/logs/morning-briefing.log"
ENV_FILE="${HOME}/.ari/notification.env"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting morning briefing..."

# Load environment
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  log "WARNING: $ENV_FILE not found. Notifications may not work."
fi

# Change to ARI directory
cd "$ARI_DIR"

# Run the briefing via Node.js
if [ -f "dist/autonomous/briefings.js" ]; then
  node -e "
    import('./dist/autonomous/notification-manager.js').then(async ({ notificationManager }) => {
      import('./dist/autonomous/briefings.js').then(async ({ createBriefingGenerator }) => {
        // Initialize notification manager
        await notificationManager.init({
          sms: {
            enabled: !!process.env.GMAIL_USER,
            gmailUser: process.env.GMAIL_USER,
            gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
            carrierGateway: process.env.CARRIER_GATEWAY || 'vtext.com',
            phoneNumber: process.env.PHONE_NUMBER,
          },
          notion: {
            enabled: !!process.env.NOTION_API_KEY,
            apiKey: process.env.NOTION_API_KEY,
            inboxDatabaseId: process.env.NOTION_INBOX_DB_ID,
            dailyLogParentId: process.env.NOTION_DAILY_LOG_PARENT_ID,
          },
        });

        // Generate briefing
        const generator = createBriefingGenerator(notificationManager);
        await generator.initNotion({
          enabled: !!process.env.NOTION_API_KEY,
          apiKey: process.env.NOTION_API_KEY,
          dailyLogParentId: process.env.NOTION_DAILY_LOG_PARENT_ID,
        });

        const result = await generator.morningBriefing();
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

log "Morning briefing complete."
