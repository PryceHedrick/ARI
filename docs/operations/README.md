# Operations

> Deployment runbooks — macOS daemon, Mac Mini, monitoring.

---

## Runbooks

| Document | Purpose |
|----------|---------|
| [RUNBOOK_MAC.md](RUNBOOK_MAC.md) | macOS daemon setup with launchd |
| [RUNBOOK_MAC_MINI.md](RUNBOOK_MAC_MINI.md) | Mac Mini always-on deployment |
| [SOCIAL_INTEGRATION.md](SOCIAL_INTEGRATION.md) | Social media automation (roadmap) |

---

## Quick Reference

### Daemon Commands

```bash
# Start daemon
launchctl load ~/Library/LaunchAgents/com.ari.daemon.plist

# Stop daemon
launchctl unload ~/Library/LaunchAgents/com.ari.daemon.plist

# Restart daemon
launchctl kickstart -k gui/$(id -u)/com.ari.daemon

# Check status
curl http://localhost:3142/health
```

### Important Paths

```
~/.ari/              # Config directory
~/.ari/audit.json    # Audit log (hash-chained)
~/.ari/logs/         # Application logs
```

---

← [Back to docs](../README.md)
