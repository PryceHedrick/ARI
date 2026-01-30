# Architecture

> How ARI is built — layers, agents, security, and the decisions behind them.

---

## Documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | 6-layer system design with dependency rules |
| [agents.md](agents.md) | 8 specialized agents and their communication |
| [security.md](security.md) | Threat model, injection detection, trust levels |
| [principles.md](principles.md) | Engineering philosophy (Jung, Musashi, Dalio) |
| [DECISIONS.md](DECISIONS.md) | Architectural Decision Records (ADRs) |
| [SECURITY_MODEL.md](SECURITY_MODEL.md) | Detailed security invariants |

---

## Quick Reference

### Layer Rules

```
Higher layers CAN import from lower layers.
Lower layers CANNOT import from higher layers.
All layers communicate via EventBus.
```

### Trust Levels

```
SYSTEM     → 0.5x risk multiplier
OPERATOR   → 0.6x risk multiplier
VERIFIED   → 0.75x risk multiplier
STANDARD   → 1.0x risk multiplier
UNTRUSTED  → 1.5x risk multiplier
HOSTILE    → 2.0x risk multiplier
```

### Core Invariants

1. **Loopback-Only Gateway** — 127.0.0.1 only
2. **Content ≠ Command** — Data is never executable
3. **Audit Immutable** — SHA-256 hash chain
4. **Least Privilege** — Three-layer permission checks
5. **Trust Required** — All messages have trust level

---

← [Back to docs](../README.md)
