# Changelog

All notable changes to ARI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [2.0.0] — 2026-01-28 — Aurora Protocol

> *The dawn of a new era. Your life, your rules, fully auditable.*

### Added

#### Multi-Agent System
- **Core Agent** — Central coordination and decision making with 5-step message pipeline
- **Guardian Agent** — Real-time threat detection with 8 injection patterns and behavioral anomaly detection
- **Planner Agent** — Task decomposition with dependency DAG and circular dependency detection
- **Executor Agent** — Tool execution with 3-layer permission gating and approval workflows
- **Memory Manager** — Provenance-tracked memory with 6 types and 3 partitions

#### Constitutional Governance
- **Council** — 13-member voting body with 3 quorum thresholds (majority, supermajority, unanimous)
- **Arbiter** — Constitutional enforcement with 5 hard rules
- **Overseer** — Quality gate enforcement with 5 release gates
- **Stop-the-Line** — Immediate halt capability for security violations

#### Web Dashboard
- Real-time monitoring interface (Vite 6 + React 19)
- Agent status and health visualization
- Audit log viewer with hash chain verification
- Governance decision tracking
- Memory partition browser

#### REST API
- 15 endpoints for system interaction
- WebSocket real-time events
- Health monitoring endpoints
- Audit query endpoints

#### CLI Commands
- `ari onboard init` — Initialize ARI system
- `ari doctor` — Run health checks
- `ari gateway start|status` — Gateway management
- `ari audit list|verify|security` — Audit operations
- `ari context init|list|create|select|show` — Context management
- `ari governance show|list` — Governance inspection
- `ari daemon install|uninstall|status` — macOS daemon

#### macOS Operations
- launchd daemon integration for always-on operation
- Auto-start on login
- Log rotation and management
- Health monitoring with auto-recovery

#### Testing
- 187 tests across 18 test files
- Unit tests for all agents, governance, and kernel components
- Integration tests for full message pipeline
- Security tests for injection defense

### Security

- 21-pattern injection detection across 6 categories
- 6-level trust scoring with risk multipliers (0.5x to 2.0x)
- SHA-256 hash-chained tamper-evident audit logging
- Auto-block at risk threshold ≥ 0.8
- 3-layer permission checks for all tool execution

### Documentation

- Full architecture documentation with layer diagrams
- Security model with threat analysis
- Operations runbook for Mac mini deployment
- Governance framework specification
- CLAUDE.md context file for AI assistants

---

## [1.0.0] — 2026-01-26 — Kagemusha Protocol

> *The shadow warrior that guards the gate.*

### Added

#### Gateway
- Loopback-only Fastify server (127.0.0.1 hardcoded)
- Port configurable, host immutable
- No remote access by design

#### Sanitizer
- 21 injection patterns across 6 categories:
  - Direct Override (5 patterns)
  - Role Manipulation (4 patterns)
  - Command Injection (4 patterns)
  - Prompt Extraction (3 patterns)
  - Authority Claims (3 patterns)
  - Data Exfiltration (2 patterns)

#### Audit
- SHA-256 hash-chained tamper-evident logging
- Genesis block anchors chain (`previousHash = "0x00...00"`)
- Verification command: `npx ari audit verify`

#### EventBus
- Typed pub/sub event system
- Error isolation per subscriber
- Inter-layer communication backbone

#### Configuration
- Zod-validated configuration
- Config stored at `~/.ari/`
- Type-safe schema validation

### Security

- **Content ≠ Command** — All inbound messages are data, never instructions
- **Loopback-Only** — Gateway binding hardcoded, cannot be overridden
- **Hash Chain Integrity** — Append-only audit log with cryptographic verification
- **Trust Levels** — SYSTEM, OPERATOR, VERIFIED, STANDARD, UNTRUSTED, HOSTILE

---

## [0.1.0] — 2026-01-26 — Genesis Protocol

> *The first light. The shadow warrior awakens.*

### Added

- Initial repository structure
- Project scaffolding and configuration
- Security-hardened multi-agent architecture concept
- Constitutional framework defining agent boundaries

---

## Protocol Naming Convention

| Version | Protocol | Meaning | Philosophy |
|---------|----------|---------|------------|
| v0.1.0 | **Genesis** | The beginning, first light | Shadow Integration — acknowledging origins |
| v1.0.0 | **Kagemusha** | Shadow warrior, the guardian | Shadow Integration — the protective foundation |
| v2.0.0 | **Aurora** | Dawn, new beginning | Radical Transparency — the Life OS emerges |

---

## Links

[Unreleased]: https://github.com/PryceHedrick/ARI/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/PryceHedrick/ARI/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/PryceHedrick/ARI/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/PryceHedrick/ARI/releases/tag/v0.1.0
