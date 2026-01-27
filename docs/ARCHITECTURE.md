# ARI Architecture

Version 12.0.0 — Aurora Protocol

## Overview

ARI is a two-layer secure personal operating system with strict boundaries between kernel (pipeline enforcement) and system (context routing).

## Layer Model

### Kernel Layer (src/kernel/)

**Owns the ingest pipeline. All inbound content is DATA.**

Pipeline: POST /message → sanitize() → audit.log() → eventBus.emit('message:accepted')

**Components:**

- **gateway.ts**: Fastify server binding to 127.0.0.1:3141
  - Loopback-only (hardcoded, not configurable)
  - POST /message endpoint
  - GET /health endpoint
  - Rejects all non-loopback bindings

- **sanitizer.ts**: Injection pattern detector
  - 21 patterns across 6 categories
  - Categories: Direct Override, Role Manipulation, Command Injection, Prompt Extraction, Authority Claims, Data Exfiltration
  - Risk scoring weighted by trust level
  - Returns detection results with matched patterns

- **audit.ts**: Tamper-evident logger
  - SHA-256 hash chain linking events
  - Genesis block: previousHash = "0x00...00"
  - Verification method checks chain integrity
  - Append-only log at ~/.ari/audit.json

- **event-bus.ts**: Typed pub/sub system
  - Event types: message:accepted, message:rejected, system:routed, audit:event
  - Error isolation (one handler failure doesn't break others)
  - Sync emit with error collection

- **config.ts**: Configuration management
  - Loads/saves config to ~/.ari/config.json
  - Zod schema validation
  - Default values for fresh install

- **types.ts**: Zod schemas and TypeScript types
  - Config, AuditEvent, Message, TrustLevel
  - Enum: TrustLevel (SYSTEM, TRUSTED, UNTRUSTED)

**Kernel responsibilities:**
- Gateway binding (loopback only)
- Sanitization (all inbound content)
- Audit logging (hash chain integrity)
- Event emission (typed pub/sub)

**Kernel cannot:**
- Route to contexts (system layer owns routing)
- Make routing decisions
- Load context-specific logic

### System Layer (src/system/)

**Subscribes to kernel events. Cannot bypass pipeline.**

Integration: eventBus.on('message:accepted') → route → audit.log('system:routed')

**Components:**

- **router.ts**: Event subscriber and context routing
  - Subscribes to 'message:accepted' events
  - Matches context triggers (topic detection)
  - Logs routing decisions via kernel audit logger
  - Returns RouteResult (matchedContext, confidence, permissionTier)

- **storage.ts**: Context persistence
  - Storage at ~/.ari/contexts/
  - JSON files: {context_id}.json
  - Active context tracker: active.json
  - CRUD operations: create, read, update, delete, list

- **types.ts**: System schemas
  - Context (id, name, type, metadata, triggers)
  - RouteResult (matchedContext, confidence, permissionTier)
  - PermissionTier enum (READ_ONLY, WRITE_SAFE, WRITE_DESTRUCTIVE, ADMIN)

**System responsibilities:**
- Context routing (based on message content)
- Context storage (ventures + life domains)
- Routing decision audit (via kernel audit logger)

**System cannot:**
- Bypass sanitizer (events only arrive post-sanitization)
- Bypass audit (all routing logged via kernel)
- Mutate audit chain (append-only via kernel API)
- Bind to network (no gateway access)

### CLI Layer (src/cli/)

**Commander-based CLI. Orchestrates kernel and system.**

**Commands:**

- **onboard.ts**: `ari onboard init`
  - Creates ~/.ari/ directory structure
  - Writes default config.json
  - Initializes audit.json with genesis event
  - Creates contexts/ directory

- **doctor.ts**: `ari doctor`
  - 6 health checks:
    1. Config directory exists
    2. Config file valid (Zod validation)
    3. Audit file exists
    4. Audit chain integrity (SHA-256 verification)
    5. Contexts directory exists
    6. Gateway reachable (HTTP GET /health)
  - Reports passed/total

- **gateway.ts**: `ari gateway start [-p port]`, `ari gateway status [-p port]`
  - start: Launches Fastify gateway on 127.0.0.1
  - status: Checks health endpoint, reports if running

- **audit.ts**: `ari audit list [-n count]`, `ari audit verify`, `ari audit security`
  - list: Shows recent audit events
  - verify: Checks hash chain integrity
  - security: Filters events by type (injection_detected, trust_violation)

- **context.ts**: `ari context init|list|create|select|show`
  - init: Creates contexts/ directory
  - list: Shows all contexts
  - create: New context (venture or life type)
  - select: Set active context
  - show: Display context details

- **governance.ts**: `ari governance show|list`
  - show: Display governance framework overview
  - list: List all governance files in docs/v12/GOVERNANCE/

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       INBOUND PIPELINE                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  POST /message  │  (gateway.ts)
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   sanitize()    │  (sanitizer.ts)
                    │  21 patterns    │
                    │  6 categories   │
                    └─────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │                     │
                   ▼                     ▼
          [injection detected]   [clean message]
                   │                     │
                   │                     ▼
                   │            ┌─────────────────┐
                   │            │  audit.log()    │  (audit.ts)
                   │            │  SHA-256 chain  │
                   │            └─────────────────┘
                   │                     │
                   │                     ▼
                   │            ┌─────────────────┐
                   │            │ eventBus.emit() │  (event-bus.ts)
                   │            │ 'message:accepted'
                   │            └─────────────────┘
                   │                     │
                   │                     ▼
                   │            ┌─────────────────┐
                   │            │  router.route() │  (router.ts)
                   │            │  match triggers │
                   │            └─────────────────┘
                   │                     │
                   │                     ▼
                   │            ┌─────────────────┐
                   │            │  audit.log()    │  (audit.ts)
                   │            │ 'system:routed' │
                   │            └─────────────────┘
                   │                     │
                   ▼                     ▼
          ┌─────────────────────────────────┐
          │   eventBus.emit()               │
          │   'message:rejected'            │
          │   (logged with detection info)  │
          └─────────────────────────────────┘
```

## Security Boundaries

### Kernel Owns
- Gateway binding (127.0.0.1 only, no configuration override)
- Sanitization (all inbound content passes through 21 patterns)
- Audit chain (SHA-256 hash linking, genesis verification)
- Event emission (typed events with error isolation)

### System Owns
- Context routing (trigger matching based on message content)
- Context storage (ventures + life domains in ~/.ari/contexts/)
- Routing decisions (logged via kernel audit for provenance)

### Governance Reference (docs/v12/)
- Council voting rules (9 members, 3 quorum levels: 5/9, 7/9, 9/9)
- Arbiter role (constitutional enforcement, conflict resolution)
- Overseer role (quality gates, release authority)
- Agent specifications (ROUTER, PLANNER, EXECUTOR, MEMORY_MANAGER, GUARDIAN)
- Test suite definitions (70 tests: 20 injection, 15 memory poisoning, 15 tool misuse, 20 regression)

**Note: v12 governance documents are reference specifications, not executable code.**

### System Cannot
- Bypass sanitizer (events only arrive after sanitization)
- Mutate audit chain (append-only via kernel API)
- Bind to network (no gateway access)
- Modify kernel configuration (kernel owns config.ts)

## Data Layout

```
~/.ari/
├── config.json              # Kernel configuration (Zod-validated)
│                            # Default port, audit path, log level
│
├── audit.json               # Hash-chained audit log
│                            # Events: message:accepted, message:rejected,
│                            # system:routed, injection_detected
│
├── audit/                   # Audit archives (future: rotation)
│
├── logs/                    # Application logs (pino output)
│
└── contexts/                # System layer context storage
    ├── active.json          # Active context metadata
    │                        # { contextId, timestamp }
    │
    └── {context_id}.json    # Individual context files
                             # Structure:
                             # {
                             #   id: string,
                             #   name: string,
                             #   type: 'venture' | 'life',
                             #   metadata: object,
                             #   triggers: string[]
                             # }
```

## Integration Points

### Kernel → System
- Event emission: `eventBus.emit('message:accepted', { message, metadata })`
- System subscribes: `eventBus.on('message:accepted', handler)`
- System cannot call kernel internals directly

### System → Kernel
- Audit logging: `auditLogger.log('system:routed', { context, confidence })`
- System cannot bypass audit chain
- System cannot emit kernel events (one-way subscription)

### CLI → Kernel
- Config management: `loadConfig()`, `saveConfig()`
- Audit inspection: `auditLogger.load()`, `auditLogger.verify()`
- Gateway control: Start/stop Fastify server

### CLI → System
- Context CRUD: `storage.create()`, `storage.read()`, `storage.update()`, `storage.delete()`, `storage.list()`
- Active context: `storage.setActive()`, `storage.getActive()`

## Future Phases

Phase 2 (planned):
- Agent executor (tool execution with permission gating)
- Memory manager (provenance tracking, quarantine)
- Guardian (active threat monitoring)

Phase 3 (planned):
- UI console for audit inspection
- Context editor
- Health monitoring dashboard

Phase 4 (planned):
- Multi-venture isolation hardening
- Automated test harness for v12 specs
- Launchd integration for daemon mode

---

*Architecture documentation for ARI V12.0*
