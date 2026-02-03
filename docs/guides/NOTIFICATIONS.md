# Notification Configuration Guide

How to configure ARI's multi-channel notification system.

## Overview

ARI supports multiple notification channels with intelligent routing based on priority.

```
┌─────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Event Occurs                                                  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────┐                                          │
│   │ Priority Rating │                                          │
│   │   P0 → P4       │                                          │
│   └────────┬────────┘                                          │
│            │                                                    │
│   ┌────────┴────────────────────────────────┐                  │
│   │        │        │        │              │                  │
│   P0       P1       P2       P3             P4                 │
│   │        │        │        │              │                  │
│   ▼        ▼        ▼        ▼              ▼                  │
│  SMS +   SMS +    Notion   Batched      Suppressed            │
│ Notion  Notion    Only     at 7 AM                             │
│   │        │        │        │                                  │
│   │    Work hrs  Work hrs    │                                  │
│   │     only     only        │                                  │
│   │                                                             │
│   └─────► Bypasses quiet hours                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Setup

### 1. SMS via Gmail (Recommended)

Uses Gmail SMTP to send SMS via carrier gateways. Free and reliable.

```bash
# Set environment variables in ~/.bashrc or ~/.zshrc

export GMAIL_USER="your.email@gmail.com"
export GMAIL_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # 16-character app password
export PHONE_NUMBER="1234567890"                  # Your phone number
export CARRIER_GATEWAY="vtext.com"                # See carrier list below
```

**Create Gmail App Password:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Generate password for "Mail" on "Other"
5. Copy the 16-character password

**Carrier Gateways:**

| Carrier | Gateway |
|---------|---------|
| Verizon | vtext.com |
| AT&T | txt.att.net |
| T-Mobile | tmomail.net |
| Sprint | messaging.sprintpcs.com |
| US Cellular | email.uscc.net |
| Cricket | sms.cricketwireless.net |
| Boost | sms.myboostmobile.com |

### 2. Notion Integration

Creates pages in your Notion inbox for notifications.

```bash
# Get your API key from https://www.notion.so/my-integrations
export NOTION_API_KEY="secret_xxxxxxxxxxxxxxxxxxxxx"

# Get database ID from your Notion inbox database URL
# https://notion.so/yourworkspace/{database_id}?v=...
export NOTION_INBOX_DB_ID="your-database-id"
```

**Notion Setup:**
1. Create a database called "ARI Inbox"
2. Add properties: Title (title), Priority (select), Category (select), Status (select)
3. Share with your integration

### 3. Dashboard Notifications

Built-in, no configuration required. Shows alerts in the web dashboard.

```
http://127.0.0.1:3141
```

## Priority System

| Priority | Name | Channels | Behavior |
|----------|------|----------|----------|
| **P0** | Critical | SMS + Notion | Immediate, bypasses quiet hours |
| **P1** | High | SMS + Notion | Work hours only, queued otherwise |
| **P2** | Normal | Notion only | Work hours only |
| **P3** | Low | Batched | Delivered at 7 AM |
| **P4** | Silent | None | Logged only, no notification |

### When Each Priority Is Used

**P0 - Critical:**
- Security violations detected
- Audit chain tampering
- System health failures

**P1 - High:**
- E2E test failures (2+ consecutive)
- Budget critical (90%+ used)
- Important reminders

**P2 - Normal:**
- Morning briefing ready
- Evening summary ready
- Task completions

**P3 - Low:**
- Knowledge index updates
- Learning insights
- Non-urgent system info

**P4 - Silent:**
- Debug information
- Telemetry events
- Internal logging

## Quiet Hours

Notifications (except P0) are held during quiet hours:

- **Default quiet hours:** 10 PM - 7 AM (local time)
- **P0 alerts:** Always delivered immediately
- **P1-P3 alerts:** Queued and delivered at 7 AM

### Configure Quiet Hours

```typescript
// In your ARI config (~/.ari/config.json)
{
  "notifications": {
    "quietHoursStart": 22,  // 10 PM (24-hour format)
    "quietHoursEnd": 7,     // 7 AM
    "timezone": "America/Indiana/Indianapolis"
  }
}
```

## Throttling

Prevents notification spam:

| Priority | Max per hour | Max per day |
|----------|--------------|-------------|
| P0 | Unlimited | Unlimited |
| P1 | 10 | 50 |
| P2 | 20 | 100 |
| P3 | 5 (batched) | 20 |

## Testing Notifications

### Via CLI

```bash
# Test SMS
npx ari notify test --channel sms

# Test Notion
npx ari notify test --channel notion

# Test specific priority
npx ari notify test --priority P1 --message "Test notification"
```

### Via Dashboard

1. Open dashboard at http://127.0.0.1:3141
2. Click the notification bell icon
3. Click "Test Notification"

### Via API (Dev Only)

```bash
curl -X POST http://127.0.0.1:3141/api/alerts/test
```

## Troubleshooting

### SMS Not Arriving

1. **Check carrier gateway spelling** - Must match exactly
2. **Verify Gmail app password** - Not your regular password
3. **Check spam folder** - SMS from email may be filtered
4. **Test SMTP connection:**
   ```bash
   npx ari doctor --check smtp
   ```

### Notion Pages Not Created

1. **Verify API key** - Must start with `secret_`
2. **Check database sharing** - Integration must have access
3. **Verify database ID** - From URL, not page title
4. **Test connection:**
   ```bash
   npx ari doctor --check notion
   ```

### Too Many Notifications

1. **Increase throttle limits** in config
2. **Batch more with P3** priority
3. **Use quiet hours** for non-urgent items
4. **Review alert rules** - Some may be too sensitive

### Missing Notifications

1. **Check priority** - P4 is suppressed
2. **Check quiet hours** - May be held until morning
3. **Check throttle** - May have hit hourly limit
4. **Check logs:**
   ```bash
   tail -f ~/.ari/logs/notifications.log
   ```

## Advanced Configuration

### Custom Channel Routing

Override default routing for specific categories:

```json
{
  "notifications": {
    "categoryOverrides": {
      "security": {
        "channels": ["sms", "notion", "dashboard"],
        "minPriority": "P0"
      },
      "learning": {
        "channels": ["notion"],
        "maxPriority": "P3"
      }
    }
  }
}
```

### Webhook Integration

Send notifications to a custom webhook:

```json
{
  "notifications": {
    "webhooks": [
      {
        "url": "https://your-service.com/webhook",
        "events": ["alert:created", "e2e:run_complete"],
        "headers": {
          "Authorization": "Bearer your-token"
        }
      }
    ]
  }
}
```

### Notification Templates

Customize message format:

```json
{
  "notifications": {
    "templates": {
      "sms": {
        "maxLength": 160,
        "format": "[ARI {priority}] {title}: {message}"
      },
      "notion": {
        "includeDetails": true,
        "includeTimestamp": true
      }
    }
  }
}
```

## Dashboard Alert Management

### Alert Banner

- Shows P0/P1 alerts at top of dashboard
- Click "Acknowledge" to dismiss
- Multiple alerts rotate automatically

### Notification Bell

- Shows unread count as badge
- Click to see recent alerts
- Filter by priority or category
- "Mark all read" for bulk acknowledge

### Alert Center

- Full history of all alerts
- Search and filter
- Export to CSV
- Bulk actions

## Categories

Alerts are categorized for better organization:

| Category | Icon | Description |
|----------|------|-------------|
| `security` | `shield` | Security violations, threats |
| `system` | `server` | System health, gateway status |
| `budget` | `wallet` | Cost alerts, spending thresholds |
| `performance` | `activity` | Response times, memory usage |
| `learning` | `brain` | Spaced repetition, insights |
| `e2e` | `check-circle` | Test failures, regressions |
| `self-improvement` | `trending-up` | Improvement suggestions |

## Best Practices

1. **Use P0 sparingly** - Only for true emergencies
2. **Batch low-priority** - Use P3 for non-urgent items
3. **Test before production** - Verify channels work
4. **Review weekly** - Check alert patterns
5. **Acknowledge promptly** - Keep alert count low
6. **Use categories** - Helps filtering and routing

## Related Commands

```bash
# Check notification status
npx ari status --notifications

# View pending notifications
npx ari notify pending

# Clear notification queue
npx ari notify clear --priority P3

# Show notification history
npx ari notify history --limit 50
```
