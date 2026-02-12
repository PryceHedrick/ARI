# Audit Log Security

How ARI's audit trail works, why it's trustworthy, and how to verify it.

## How It Works

Every significant action in ARI gets logged to an **audit chain** — a sequence of events where each event includes a cryptographic hash of the previous event.

```
Event 1          Event 2          Event 3
┌──────────┐     ┌──────────┐     ┌──────────┐
│ id       │     │ id       │     │ id       │
│ action   │     │ action   │     │ action   │
│ actor    │     │ actor    │     │ actor    │
│ prevHash─┼──┐  │ prevHash─┼──┐  │ prevHash │
│ hash ────┼──┼──┤ hash ────┼──┼──┤ hash     │
└──────────┘  │  └──────────┘  │  └──────────┘
              │                │
     Genesis  └── Points to    └── Points to
     (64 zeros)    Event 1          Event 2
```

If anyone modifies Event 1, its hash changes, which means Event 2's `prevHash` no longer matches. The chain breaks. This is **tamper-evident**.

## Hash Chain Mechanics

### What Gets Hashed

Each event's SHA-256 hash is computed from these fields in deterministic order:

```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "action": "what happened",
  "actor": "who did it",
  "trustLevel": "trust level of source",
  "details": { "context": "..." },
  "previousHash": "hash of previous event"
}
```

### Genesis

The first event chains from a genesis hash: 64 zeros (`000...000`). This is hardcoded and cannot be changed.

### Verification

`verify()` walks the entire chain and checks:
1. Each event's `previousHash` matches the actual previous event's `hash`
2. Each event's `hash` matches what you get when you recompute it

If either check fails, the chain is broken at that event.

## Checkpoint Anchoring

### The Problem Checkpoints Solve

The hash chain is internally consistent — but if someone replaces the **entire file** with a new chain, the new chain would also be internally consistent. Verification would pass.

### How Checkpoints Work

Periodically (every 100 events by default), ARI creates a **checkpoint** — a signed snapshot:

```json
{
  "id": "uuid",
  "timestamp": "when checkpoint was taken",
  "eventCount": 200,
  "headHash": "hash of event #200",
  "genesisEventHash": "hash of event #1",
  "signature": "HMAC-SHA256 of the above"
}
```

The HMAC signature uses a key that only exists in the running process's memory. An attacker who replaces the audit file can't forge matching checkpoints because they don't have the signing key.

### Checkpoint Verification

`verifyCheckpoints()` checks each checkpoint against the current chain:
1. Does the chain have at least as many events as the checkpoint recorded?
2. Does the event at position N have the hash the checkpoint recorded?
3. Does the first event still have the same hash?
4. Does the HMAC signature verify?

Any mismatch means the chain was replaced after the checkpoint was taken.

### Checkpoint Storage

Checkpoints are stored separately from the main audit log:
- Audit log: `~/.ari/audit.json`
- Checkpoints: `~/.ari/audit-checkpoints.json`

## Retention

| Data | Location | Retention |
|------|----------|-----------|
| Audit events | `~/.ari/audit.json` | Indefinite (append-only) |
| Checkpoints | `~/.ari/audit-checkpoints.json` | Indefinite |
| Gateway logs | `~/.ari/logs/gateway-*.log` | 7 days (logrotate) |

## What Gets Audited

| Action | Trust Level | Details Recorded |
|--------|-------------|-----------------|
| `gateway_started` | system | host, port |
| `gateway_stopped` | system | host, port |
| `message_received` | source's level | messageId, contentLength |
| `security_event` | system | eventType, severity, threats |
| `vote:created` | verified | voteId, topic, threshold |
| `vote:cast` | verified | voteId, agent, option |
| `vote:closed` | system | voteId, status, result |
| `arbiter:evaluation` | system | ruleId, action, violations |
| `permission:granted` | source's level | requestId, toolId, tokenId |
| `permission:denied` | source's level | requestId, toolId, reason |
| `policy:register` | system | toolId, tier, trust |

## Verification Commands

```bash
# Verify audit chain integrity
npx ari audit verify

# Check chain status
npx ari audit status
```

## Security Properties

| Property | Guarantee | Mechanism |
|----------|-----------|-----------|
| Tamper-evident | Modification detected | SHA-256 hash chain |
| Replacement-evident | Full replacement detected | HMAC-signed checkpoints |
| Append-only | No deletion or modification | Constitutional Rule #3 |
| Complete | All significant actions logged | Gateway + PolicyEngine hooks |
| Timestamped | Events have accurate timestamps | System clock |
| Attributed | Events have actor identity | Trust level assignment |

## Limitations

- **Not tamper-proof**: A sufficiently motivated attacker with filesystem access can modify the file. The hash chain detects this, but doesn't prevent it.
- **Clock trust**: Timestamps come from the system clock. If the clock is wrong, timestamps are wrong.
- **Single-machine**: Audit data is stored on one machine. Hardware failure loses the audit trail unless backed up.
- **Signing key lifecycle**: The HMAC signing key is generated per-process. Restarting ARI generates a new key, so new checkpoints can't be verified against old ones (old checkpoints can still detect tampering from before the restart).

## Recommendations

1. **Back up regularly**: `scripts/backup.sh` creates timestamped backups of `~/.ari/`
2. **Verify weekly**: Run `npx ari audit verify` to check chain integrity
3. **Monitor alerts**: P0 alerts fire when chain or checkpoint verification fails
4. **Keep checkpoints**: Don't delete `audit-checkpoints.json`

---

v1.0 - 2026-02-10
