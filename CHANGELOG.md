# Changelog

All notable changes to ARI (Artificial Reasoning Intelligence) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [12.0.0] — 2026-01-27 — Aurora Protocol Restoration

### Added

**System Layer (src/system/)**
- Context storage at ~/.ari/contexts/ with JSON persistence
- System router subscribing to kernel events (event-bus integration)
- Context trigger matching (topic detection for routing decisions)
- Context types: ventures + life domains
- PermissionTier enum (READ_ONLY, WRITE_SAFE, WRITE_DESTRUCTIVE, ADMIN)

**CLI Commands (src/cli/commands/)**
- `ari context init` — Initialize context system (creates ~/.ari/contexts/)
- `ari context list` — List all available contexts
- `ari context create <name> <type>` — Create new context (venture or life type)
- `ari context select <name>` — Set active context
- `ari context show [name]` — Display context details (defaults to active context)
- `ari governance show` — Display governance framework overview
- `ari governance list` — List all governance documents in docs/v12/GOVERNANCE/

**Tests (tests/unit/system/)**
- 5 system router tests (E2E pipeline proof):
  - Router subscribes to kernel events
  - System receives only sanitized messages
  - Routing decisions are audited via kernel audit logger
  - Context trigger matching works correctly
  - Integration: inbound → sanitize → audit → publish → system route

**Documentation (docs/)**
- ARCHITECTURE.md — Layer model, event flow, security boundaries, data layout
- SECURITY.md — Content≠command principle, injection detection (21 patterns, 6 categories), audit integrity (SHA-256 hash chain), trust levels, pipeline enforcement
- OPERATIONS.md — Build commands, running gateway, daemon operations (future: launchd), log locations, troubleshooting, migration
- GOVERNANCE.md — Council composition (9 members), voting thresholds (5/9, 7/9, 9/9), Arbiter role, Overseer role, emergency protocols (reference specs, not executable)
- PRINCIPLES.md — Shadow Integration (Jung), Radical Transparency (Dalio), Ruthless Simplicity (Musashi) translated into engineering rules with file path references

**v12 Aurora Protocol Specs (docs/v12/)**
- Complete v12 specification restored from Aurora Protocol:
  - GOVERNANCE/ — Council voting rules, Arbiter/Overseer roles, emergency protocols, COUNCIL_VOTE_V12.md (unanimous approval), ARBITER_SIGNOFF_V12.md (release certification)
  - CONTEXTS/ — Venture templates (Pryceless Solutions), life domain contexts (career, finance, health, admin, learning, systems, family)
  - SYSTEM/ — Agent roles (CORE, ROUTER, PLANNER, EXECUTOR, MEMORY_MANAGER, GUARDIAN)
  - SCHEMAS/ — Event schema (audit logging), memory entry schema (provenance tracking)
  - TESTS/ — 70 test definitions (20 injection, 15 memory poisoning, 15 tool misuse, 20 regression)
  - README.md, CHANGELOG.md, DECISIONS.md

**Scripts**
- scripts/v12-scan.ts — Forensic scanner for v12 specs (generates docs/RESTORE_REPORT.generated.md)

**Documentation**
- README.md — Full rewrite covering architecture, kernel/system layers, CLI commands, v12 specs, security invariants, project structure
- CHANGELOG.md — This file (version history)

### Preserved (v3 Kagemusha Kernel)

All v3 kernel functionality preserved and passing tests:

**Kernel Layer (src/kernel/)**
- gateway.ts — Loopback-only Fastify server (127.0.0.1 hardcoded, not configurable)
- sanitizer.ts — 21-pattern injection detector across 6 categories:
  1. Direct Override (5 patterns)
  2. Role Manipulation (4 patterns)
  3. Command Injection (4 patterns)
  4. Prompt Extraction (3 patterns)
  5. Authority Claims (3 patterns)
  6. Data Exfiltration (2 patterns)
- audit.ts — SHA-256 hash-chained tamper-evident audit logger with genesis block verification
- event-bus.ts — Typed pub/sub event system with error isolation
- config.ts — Zod-validated configuration at ~/.ari/
- types.ts — Zod schemas for Config, AuditEvent, Message, TrustLevel

**CLI Commands (v3)**
- `ari onboard init` — Initialize ARI system (creates ~/.ari/, default config, genesis audit event)
- `ari doctor` — Run 6 health checks (config dir, config file, audit file, audit chain integrity, contexts dir, gateway reachable)
- `ari gateway start [-p port]` — Start Fastify gateway on 127.0.0.1
- `ari gateway status [-p port]` — Check gateway health
- `ari audit list [-n count]` — List recent audit events
- `ari audit verify` — Verify SHA-256 hash chain integrity
- `ari audit security` — List all security events (injection detections, trust violations)

**Tests (v3)**
- 22 kernel tests passing:
  - Sanitizer pattern detection (all 6 categories)
  - Audit hash chain integrity (genesis block, chain linking, tampering detection)
  - Event bus error isolation
  - Config Zod validation
  - Gateway loopback enforcement

### Security

**Pipeline Enforcement**
- Inbound pipeline: POST /message → sanitize → audit → publish → system route
- System layer subscribes to kernel events (cannot bypass sanitizer or audit)
- All system routing decisions audited with hash chain evidence
- Content remains DATA — never interpreted as commands

**Audit Integrity**
- All system routing logged via kernel audit logger
- SHA-256 hash chain prevents tampering
- Genesis block anchors chain (previousHash = "0x00...00")
- Verification available: `npx ari audit verify`

**Trust Boundaries**
- System layer: UNTRUSTED trust level for external content (future)
- Kernel layer: SYSTEM trust level (risk multiplier 0.5x)
- Operator input: TRUSTED trust level (risk multiplier 1.0x)

**Loopback-Only Gateway**
- 127.0.0.1 binding hardcoded in src/kernel/gateway.ts
- No remote access, no network exposure
- Cannot be overridden by configuration

### Changed

**README.md**
- Replaced v3 README with comprehensive v12 documentation
- Added full architecture diagram (CLI → System → Kernel layers)
- Added "What Exists (Phase 1)" section listing all implemented features
- Added v12 specification summary (reference docs, not executable)
- Added security invariants (6 hard rules)
- Added project structure with full file tree
- Removed marketing language, added truthful status

**Package Version**
- Bumped from 3.x.x to 12.0.0 (Aurora Protocol release)

### Documentation

**New Files**
- /Users/prycehedrick/ari/docs/ARCHITECTURE.md
- /Users/prycehedrick/ari/docs/SECURITY.md
- /Users/prycehedrick/ari/docs/OPERATIONS.md
- /Users/prycehedrick/ari/docs/GOVERNANCE.md
- /Users/prycehedrick/ari/docs/PRINCIPLES.md
- /Users/prycehedrick/ari/CHANGELOG.md (this file)

**v12 Specs Restored**
- /Users/prycehedrick/ari/docs/v12/ (full directory tree from Aurora Protocol)

### Notes

**Phase 1 Scope**
- Kernel hardening complete (v3 Kagemusha preserved)
- System layer integration complete (event bus subscription, context routing)
- v12 specifications restored (reference documentation)
- Documentation complete (architecture, security, operations, governance, principles)

**Future Phases**
- Phase 2: Executor (tool execution with permission gating), Memory Manager (provenance tracking, quarantine), Guardian (active threat monitoring)
- Phase 3: UI Console (audit inspection, context editor, health dashboard)
- Phase 4: Multi-venture isolation hardening, automated test harness for v12 specs, launchd integration

**Test Status**
- 27 tests passing (22 kernel + 5 system)
- All v3 kernel tests preserved
- New system integration tests added
- No regressions

**Governance Status**
- v12 governance rules documented in docs/v12/GOVERNANCE/
- Council vote simulated (COUNCIL_VOTE_V12.md — unanimous approval)
- Arbiter signoff simulated (ARBITER_SIGNOFF_V12.md — production ready certification)
- Governance not yet enforced in executable code (Phase 2+)

---

## [3.0.0] — 2026-01-XX — Kagemusha Kernel (Preserved)

### Added
- Loopback-only Fastify gateway (127.0.0.1 hardcoded)
- 21-pattern injection sanitizer with 6 categories
- SHA-256 hash-chained tamper-evident audit logger
- Typed event bus with error isolation
- Zod-validated configuration at ~/.ari/
- CLI commands: onboard, doctor, gateway, audit
- 22 kernel tests (all passing)

### Security
- Loopback-only binding (no remote access)
- Hash chain integrity (genesis block verification)
- Injection detection (6 categories, 21 patterns)
- Trust-weighted risk scoring (0.5x, 1.0x, 1.5x multipliers)

---

*All versions follow semantic versioning: MAJOR.MINOR.PATCH*
*Major version 12 signifies Aurora Protocol restoration and v12 spec integration*
