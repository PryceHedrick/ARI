# Changelog

All notable changes to ARI vNext will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-26 — 影武者 Kagemusha Protocol

### Phase 1: Constitutional Gateway Foundation

Complete architectural evolution from Aurora Protocol (V12) to ARI vNext.
A production-grade TypeScript WebSocket gateway that integrates the shadow
rather than fighting it, cuts with warrior precision, and records everything
in radical transparency.

#### Added

**Gateway Service**
- WebSocket server bound exclusively to 127.0.0.1
- Configurable port (default: 18789)
- Health check endpoint
- Session management
- Graceful shutdown handling

**Input Sanitization**
- Pattern-based input validation
- Shadow pattern detection (log, don't block)
- Suspicious pattern logging to audit trail
- Configurable sanitization rules
- Content vs. command separation enforcement

**Audit System**
- Hash-chained SHA-256 audit log
- Tamper-evident JSONL format
- Append-only log storage
- Chain verification command
- Real-time tail functionality
- Timestamp indexing

**Event Bus**
- Pub/sub event system
- Topic-based subscriptions
- Event type registry
- WebSocket event streaming
- Memory-based implementation (Phase 1)

**CLI Interface**
- `ari gateway start` - Start gateway service
- `ari gateway status` - Check gateway status
- `ari audit list` - List audit entries
- `ari audit verify` - Verify hash chain integrity
- `ari audit tail` - Watch audit log in real-time
- `ari onboard init` - Initialize configuration
- `ari onboard install-daemon` - Install macOS launchd daemon
- `ari doctor` - Run system diagnostics
- `ari refine` - Test prompt refiner (pure function)

**Prompt Refiner**
- Pure function implementation (no side effects)
- Input normalization
- Pattern-based refinement
- Testable and deterministic

**macOS Integration**
- launchd plist generation
- Daemon installation and management
- Auto-start on boot support
- Log file management

**Documentation**
- Comprehensive README
- Architecture documentation
- Security model documentation
- Operations guide
- Engineering principles guide
- API protocol reference
- Governance framework
- Contributing guidelines
- Code of Conduct
- Security policy

**Development Infrastructure**
- TypeScript configuration
- Vitest test framework
- ESLint and Prettier setup
- Build pipeline
- Development server with hot reload

#### Security Features

- Loopback-only binding (127.0.0.1)
- Input sanitization with shadow detection
- Hash-chained audit trail
- Rate limiting protection
- No remote access capability
- Tamper-evident logging

#### Core Principles Implemented

- **CONTENT ≠ COMMAND**: All inbound content treated as data
- **Shadow Integration**: Log suspicious patterns, don't block
- **Ruthless Simplicity**: Every component serves clear purpose
- **Radical Transparency**: All operations audited

### Architecture Decisions

- Local-first design (no cloud dependencies)
- WebSocket for real-time communication
- JSONL for audit storage (human-readable, append-only)
- Pure functions for core logic (testable, deterministic)
- Event-driven architecture for extensibility

### Known Limitations

- Event bus is memory-based (not persistent across restarts)
- Single-node only (no distributed support)
- macOS-only daemon support (Linux systemd planned for v1.1.0)
- No agent execution framework (planned for Phase 2)

### Breaking Changes

None (initial release)

---

## Version History

- **v1.0.0** (2026-01-26): 影武者 Kagemusha Protocol — Phase 1 Foundation
  - Complete TypeScript WebSocket gateway (127.0.0.1:18789)
  - 5-stage sanitization with shadow pattern detection
  - SHA-256 hash-chained audit log
  - 56 tests, TypeScript strict mode (all flags)

[Unreleased]: https://github.com/PryceHedrick/ARI/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/PryceHedrick/ARI/releases/tag/v1.0.0
