# ARI vNext — 影武者 Kagemusha Protocol

**Constitutional Multi-Agent Personal Operating System**

> *The shadow warrior observes, integrates, and records — never suppresses.*

ARI vNext is a local-first, security-focused personal operating system that implements a constitutional framework for multi-agent AI interactions. Built on three philosophical pillars: Jung's shadow integration, Musashi's ruthless simplicity, and Dalio's radical transparency.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      External Clients                        │
│            (Claude Desktop, Custom Integrations)             │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket (127.0.0.1 only)
┌──────────────────────────▼──────────────────────────────────┐
│                     Gateway Service                          │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Input Sanitizer│─▶│ Event Bus    │─▶│ Audit Logger   │  │
│  │ (Shadow Watch) │  │ (Pub/Sub)    │  │ (Hash Chain)   │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Refiner    │  │   Sessions   │  │    Agents    │
│  (Pure Fn)   │  │  Management  │  │   (Future)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Core Principles

### CONTENT ≠ COMMAND
All inbound content is treated as data, never as instructions. This fundamental separation prevents prompt injection attacks and maintains clear boundaries between user content and system operations.

### Shadow Integration (Jung)
Rather than blocking suspicious patterns, we log and integrate them into the audit trail. Understanding the shadow makes the system more resilient.

### Ruthless Simplicity (Musashi)
Every component serves a clear purpose. Complexity is the enemy. No feature exists without justification.

### Radical Transparency (Dalio)
All operations are logged in a tamper-evident audit trail. The system's behavior is observable and verifiable.

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Run Tests

```bash
npm test
```

### Start the Gateway

```bash
# Development mode
npm run dev

# Production mode (requires build)
ari gateway start

# Run as daemon (macOS)
ari onboard install-daemon
```

### CLI Commands

```bash
# Gateway management
ari gateway start          # Start the gateway service
ari gateway status         # Check gateway status

# Audit operations
ari audit list            # List audit entries
ari audit verify          # Verify hash chain integrity
ari audit tail            # Watch audit log in real-time

# System setup
ari onboard init          # Initialize configuration
ari onboard install-daemon # Install as macOS launchd daemon

# Maintenance
ari doctor                # Run system diagnostics
ari refine <text>         # Test prompt refiner (pure function)
```

## Technology Stack

- **Runtime**: Node.js 22+ with TypeScript 5.4+
- **Gateway**: WebSocket server (ws library)
- **Storage**: JSONL append-only files
- **Crypto**: SHA-256 hash chains
- **Process**: macOS launchd daemon
- **Testing**: Vitest
- **CLI**: Commander.js

## Project Structure

```
ari-vnext/
├── src/
│   ├── types/            # Zod schemas & TypeScript types
│   ├── config/           # Configuration management
│   ├── utils/            # Pino structured logging
│   ├── security/         # Input sanitization with shadow detection
│   ├── audit/            # SHA-256 hash-chained audit logger
│   ├── gateway/          # WebSocket server, event bus, protocol
│   ├── prompting/        # Pure-function prompt refiner
│   ├── ops/              # macOS launchd daemon management
│   ├── cli/              # Commander.js CLI
│   └── index.ts          # Public API exports
├── docs/                 # Architecture, security, API, principles
├── CONTEXTS/             # Namespace isolation (ventures, life)
└── .github/              # CI/CD, issue templates, CODEOWNERS
```

## Security Model

- **Loopback Only**: Gateway binds exclusively to 127.0.0.1
- **No Remote Access**: Cannot be accessed from network
- **Input Sanitization**: All inputs validated and sanitized
- **Shadow Detection**: Suspicious patterns logged, not blocked
- **Audit Trail**: Tamper-evident hash chain of all operations
- **Rate Limiting**: Protection against abuse

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and components
- [Security](docs/SECURITY.md) - Security model and threat analysis
- [Operations](docs/OPERATIONS.md) - Installation and maintenance
- [Principles](docs/PRINCIPLES.md) - Engineering philosophy
- [API](docs/API.md) - WebSocket protocol reference
- [Governance](docs/GOVERNANCE.md) - Multi-agent council framework

## Development Status

**Phase 1: Kagemusha Protocol** (v1.0.0)
- Core gateway with WebSocket server (127.0.0.1:18789)
- 5-stage input sanitization with shadow pattern detection
- SHA-256 hash-chained audit logging (tamper-evident)
- Typed pub/sub event bus with wildcard support
- Commander.js CLI (gateway, audit, onboard, doctor, refine)
- macOS launchd daemon support
- Pure-function prompt refiner
- 56 tests passing, TypeScript strict mode (all flags)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

## Security

For security vulnerabilities, see [SECURITY.md](SECURITY.md) for reporting procedures.

## License

MIT License - Copyright (c) 2026 Pryce Hedrick

## Philosophy

ARI vNext is built on three philosophical pillars:

1. **Carl Jung**: Integration of the shadow rather than suppression
2. **Miyamoto Musashi**: Ruthless elimination of the unnecessary
3. **Ray Dalio**: Radical transparency in all operations

These aren't just aspirations—they map directly to architectural decisions. See [PRINCIPLES.md](docs/PRINCIPLES.md) for details.
