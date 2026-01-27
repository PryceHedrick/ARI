# ARI V12.0 — Artificial Reasoning Intelligence

A secure, multi-agent personal operating system with injection detection, hash-chained audit logging, and a local-only gateway.

## Architecture

```
┌─────────────────────────────────────────────┐
│                  CLI Layer                   │
│  gateway · audit · doctor · onboard         │
├─────────────────────────────────────────────┤
│                Kernel Layer                  │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ │
│  │ Gateway   │ │ Sanitizer │ │ AuditLogger│ │
│  │ (Fastify) │ │ (6 cats)  │ │ (SHA-256)  │ │
│  │ 127.0.0.1 │ │           │ │ hash chain │ │
│  └──────────┘ └───────────┘ └────────────┘ │
│  ┌──────────┐ ┌───────────┐ ┌────────────┐ │
│  │ EventBus │ │  Config   │ │   Types    │ │
│  │ (pub/sub)│ │ (~/.ari/) │ │   (Zod)    │ │
│  └──────────┘ └───────────┘ └────────────┘ │
└─────────────────────────────────────────────┘
```

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

## Commands

### `ari onboard init`
Initializes the ARI system — creates `~/.ari/` directory structure, default configuration, and genesis audit event.

### `ari doctor`
Runs 5 health checks: config directory, config file, audit file, audit chain integrity, gateway reachability.

### `ari gateway start [-p port]`
Starts the Fastify gateway on `127.0.0.1` (loopback only). Default port: 3141.

### `ari gateway status [-p port]`
Checks if the gateway is running and reports health status.

### `ari audit list [-n count]`
Lists the most recent audit events (default: 10).

### `ari audit verify`
Verifies the SHA-256 hash chain integrity of the audit log.

### `ari audit security`
Lists all security events (injection detections, trust violations, etc.).

## Security Invariants

1. **Loopback-only gateway** — The gateway binds to `127.0.0.1` exclusively. This is hardcoded and not configurable.
2. **SHA-256 hash chain** — Every audit event is cryptographically chained to its predecessor, starting from a genesis block (`0x00...00`). Tampering with any event breaks the chain.
3. **Injection detection** — Six categories of prompt injection patterns are scanned on every inbound message:
   - Direct Override (e.g., "ignore previous instructions")
   - Role Manipulation (e.g., "you are now")
   - Command Injection (e.g., `$(rm -rf /)`)
   - Prompt Extraction (e.g., "reveal your system prompt")
   - Authority Claims (e.g., "as your creator")
   - Data Exfiltration (e.g., "send data to")
4. **Trust-level risk scoring** — Risk scores are weighted by source trust level (system 0.5x, untrusted 1.5x).
5. **Full audit trail** — All gateway actions, security events, and system operations are logged with tamper-evident hashing.

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## Project Structure

```
src/
├── kernel/
│   ├── types.ts        # Zod schemas & TypeScript types
│   ├── sanitizer.ts    # Injection detection engine
│   ├── audit.ts        # SHA-256 hash-chained logger
│   ├── event-bus.ts    # Typed pub/sub event system
│   ├── gateway.ts      # Fastify loopback-only server
│   ├── config.ts       # Config loading/saving
│   └── index.ts        # Re-exports
├── cli/
│   ├── index.ts        # Commander entry point
│   └── commands/
│       ├── gateway.ts  # Gateway management
│       ├── audit.ts    # Audit log management
│       ├── doctor.ts   # Health checks
│       └── onboard.ts  # System initialization
└── index.ts            # Main export barrel
tests/
├── unit/kernel/
│   ├── sanitizer.test.ts
│   └── audit.test.ts
└── security/
    └── injection.test.ts
```
