# ARI V12.0 — Aurora Protocol

Artificial Reasoning Intelligence: a secure, local-first personal operating system.

## Architecture

Two-layer design: hardened kernel + extensible system layer.

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLI Layer                               │
│  gateway · audit · doctor · onboard · context · governance      │
├─────────────────────────────────────────────────────────────────┤
│                       System Layer                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Router (event subscriber, context triggers)              │   │
│  │  Storage (ventures + life domains at ~/.ari/contexts/)    │   │
│  │  Context system (topic detection, routing decisions)      │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       Kernel Layer                               │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌────────────┐     │
│  │ Gateway   │ │ Sanitizer │ │ AuditLogger│ │ EventBus   │     │
│  │ (Fastify) │ │ (21 patt.)│ │ (SHA-256)  │ │ (pub/sub)  │     │
│  │127.0.0.1  │ │ 6 categs. │ │ hash chain │ │ typed      │     │
│  └──────────┘ └───────────┘ └────────────┘ └────────────┘     │
│  ┌──────────┐ ┌───────────┐                                     │
│  │  Config   │ │   Types   │                                     │
│  │(~/.ari/)  │ │  (Zod)    │                                     │
│  └──────────┘ └───────────┘                                     │
└─────────────────────────────────────────────────────────────────┘

Integration: EventBus Only
  System subscribes to kernel events (message:accepted, etc.)
  System cannot bypass sanitizer or audit chain

Pipeline: POST /message → sanitize → audit → publish
  → system router → match triggers → audit routing decision
```

## What Exists (Phase 1)

### Kernel (src/kernel/)
- **Gateway** (gateway.ts): Loopback-only Fastify server (127.0.0.1:3141), POST /message endpoint
- **Sanitizer** (sanitizer.ts): 21-pattern injection detector across 6 categories (Direct Override, Role Manipulation, Command Injection, Prompt Extraction, Authority Claims, Data Exfiltration)
- **Audit Logger** (audit.ts): SHA-256 hash-chained tamper-evident logger, genesis block verification
- **Event Bus** (event-bus.ts): Typed pub/sub with error isolation, event types defined in types.ts
- **Config** (config.ts): Zod-validated configuration at ~/.ari/, loadConfig/saveConfig
- **Types** (types.ts): Zod schemas for Config, AuditEvent, Message, TrustLevel

### System (src/system/)
- **Router** (router.ts): Subscribes to kernel events, matches context triggers, audits routing decisions
- **Storage** (storage.ts): Context management at ~/.ari/contexts/, JSON persistence for ventures + life domains
- **Types** (types.ts): Context, RouteResult, PermissionTier schemas

### CLI (src/cli/commands/)
- `ari onboard init` — Initialize ARI system (creates ~/.ari/, default config, genesis audit event)
- `ari doctor` — Run 6 health checks (config dir, config file, audit file, audit chain integrity, contexts dir, gateway reachable)
- `ari gateway start [-p port]` — Start the Fastify gateway on 127.0.0.1 (default port: 3141)
- `ari gateway status [-p port]` — Check if gateway is running and report health status
- `ari audit list [-n count]` — List recent audit events (default: 10)
- `ari audit verify` — Verify SHA-256 hash chain integrity
- `ari audit security` — List all security events (injection detections, trust violations)
- `ari context init` — Initialize context system (creates ~/.ari/contexts/)
- `ari context list` — List all available contexts
- `ari context create <name> <type>` — Create new context (type: venture or life)
- `ari context select <name>` — Set active context
- `ari context show [name]` — Show context details (defaults to active context)
- `ari governance show` — Display governance framework overview
- `ari governance list` — List all governance documents

### Tests
27 tests passing (22 kernel + 5 system):
- Kernel: sanitizer detection, audit hash chain integrity, event bus isolation, config validation
- System: router event subscription, context trigger matching, E2E pipeline proof

### v12 Specification (docs/v12/)
Complete Aurora Protocol specification stored as markdown reference documentation:
- **GOVERNANCE**: Council voting rules (9 members, 3 quorum levels), Arbiter role, Overseer role, emergency protocols
- **CONTEXTS**: Venture templates (Pryceless Solutions), life domain contexts (career, finance, health, admin, learning, systems, family)
- **SYSTEM**: Agent roles (CORE, ROUTER, PLANNER, EXECUTOR, MEMORY_MANAGER, GUARDIAN)
- **SCHEMAS**: Event schema (audit logging), memory entry schema (provenance tracking)
- **TESTS**: 70 test definitions (20 injection, 15 memory poisoning, 15 tool misuse, 20 regression)

**These specs guide future implementation phases. They are reference documentation, not executable code.**

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Initialize ARI
npx ari onboard init

# Verify system health
npx ari doctor

# Start the gateway
npx ari gateway start
```

## Security Invariants

1. **Loopback-only gateway** — Gateway binds to 127.0.0.1 exclusively (hardcoded, not configurable)
2. **SHA-256 hash chain** — Every audit event is cryptographically chained to its predecessor, starting from genesis block (0x00...00). Tampering breaks the chain.
3. **Injection detection** — 21 patterns across 6 categories scanned on every inbound message
4. **Trust-level risk scoring** — Risk scores weighted by source trust level (system 0.5x, untrusted 1.5x)
5. **Content ≠ command** — All inbound content is DATA, never interpreted as instructions
6. **Pipeline enforcement** — System layer cannot bypass kernel sanitizer, audit, or event bus

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

27 tests passing (kernel + system integration).

## Project Structure

```
/Users/prycehedrick/ari/
├── src/
│   ├── kernel/                 # Kernel layer (owns pipeline)
│   │   ├── gateway.ts          # Fastify loopback server
│   │   ├── sanitizer.ts        # 21-pattern injection detector
│   │   ├── audit.ts            # SHA-256 hash-chained logger
│   │   ├── event-bus.ts        # Typed pub/sub event system
│   │   ├── config.ts           # Config loading/saving
│   │   ├── types.ts            # Zod schemas
│   │   └── index.ts
│   ├── system/                 # System layer (subscribes to events)
│   │   ├── router.ts           # Event subscriber, context routing
│   │   ├── storage.ts          # Context storage at ~/.ari/contexts/
│   │   ├── types.ts            # Context, RouteResult, PermissionTier
│   │   └── index.ts
│   ├── cli/                    # CLI commands
│   │   ├── commands/
│   │   │   ├── gateway.ts      # Gateway management
│   │   │   ├── audit.ts        # Audit log management
│   │   │   ├── doctor.ts       # Health checks
│   │   │   ├── onboard.ts      # System initialization
│   │   │   ├── context.ts      # Context management
│   │   │   └── governance.ts   # Governance reference
│   │   └── index.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   │   ├── kernel/
│   │   │   ├── sanitizer.test.ts
│   │   │   └── audit.test.ts
│   │   └── system/
│   │       └── router.test.ts
│   └── security/
│       └── injection.test.ts
├── docs/
│   ├── v12/                    # Aurora Protocol specs (reference only)
│   │   ├── GOVERNANCE/
│   │   ├── CONTEXTS/
│   │   ├── SYSTEM/
│   │   ├── SCHEMAS/
│   │   └── TESTS/
│   ├── ARCHITECTURE.md         # Layer model, boundaries, data layout
│   ├── SECURITY.md             # Security model, injection defense, audit integrity
│   ├── OPERATIONS.md           # Build, run, troubleshoot, migrate
│   ├── GOVERNANCE.md           # Council rules, voting thresholds (reference)
│   └── PRINCIPLES.md           # Engineering philosophy mapped to code
├── README.md                   # This file
└── CHANGELOG.md                # Version history

Data layout:
~/.ari/
├── config.json                 # Zod-validated configuration
├── audit.json                  # Hash-chained audit log
├── audit/                      # Audit archives (future)
├── logs/                       # Application logs
└── contexts/                   # Context storage
    ├── active.json             # Active context metadata
    └── {context_id}.json       # Individual context files
```

## Version

12.0.0 — Aurora Protocol Restoration (2026-01-27)

Phase 1 complete: kernel hardening + system layer integration + v12 specs restored.

## License

Private repository. All rights reserved.

## Contact

**Operator**: Pryce Hedrick
**Repository**: github.com/PryceHedrick/ari

---

*ARI V12.0 — Aurora Protocol*
*"Secure reasoning, local-first, auditable"*
