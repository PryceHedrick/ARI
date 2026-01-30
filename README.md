<div align="center">

```
                    ░█████╗░██████╗░██╗
                    ██╔══██╗██╔══██╗██║
                    ███████║██████╔╝██║
                    ██╔══██║██╔══██╗██║
                    ██║  ██║██║  ██║██║
                    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
```

### Artificial Reasoning Intelligence

*The system that watches while you sleep.*

<br>

[![CI](https://github.com/ARI-OS/ARI/actions/workflows/ci.yml/badge.svg)](https://github.com/ARI-OS/ARI/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-black?logo=typescript)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/Node-20+-black?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-black)](LICENSE)

</div>

<br>

## What is ARI?

ARI is a local-first autonomous agent that manages your digital life. It runs on your machine, answers only to you, and keeps a cryptographic record of every decision it makes.

No cloud. No subscriptions. No trust required.

```
127.0.0.1:3141 — the only address that matters.
```

<br>

## Philosophy

ARI is built on three principles stolen from smarter people:

| | |
|---|---|
| **Shadow Integration** | Don't suppress what's suspicious—log it, understand it, integrate it. The shadow reveals truth. *(Jung)* |
| **Radical Transparency** | Every operation audited. Every decision traceable. No hidden state. *(Dalio)* |
| **Ruthless Simplicity** | Every line must justify its existence. Obvious over clever. *(Musashi)* |

<br>

## Architecture

Six layers. Strict boundaries. All roads lead through the kernel.

```
┌─────────────────────────────────────────────────────────────┐
│  INTERFACES         CLI · Dashboard · SMS · Pushover        │
├─────────────────────────────────────────────────────────────┤
│  EXECUTION          Daemon (macOS launchd)                  │
├─────────────────────────────────────────────────────────────┤
│  STRATEGIC          Council (13) · Arbiter (5) · Overseer   │
├─────────────────────────────────────────────────────────────┤
│  CORE               Guardian · Planner · Executor · Memory  │
├─────────────────────────────────────────────────────────────┤
│  SYSTEM             Router · Storage                        │
├─────────────────────────────────────────────────────────────┤
│  KERNEL             Gateway · Sanitizer · Audit · EventBus  │
└─────────────────────────────────────────────────────────────┘
                    ↑ everything passes through here
```

<br>

## Security

Security isn't a feature. It's the foundation.

| Invariant | What it means |
|-----------|---------------|
| **Loopback Only** | Gateway binds to `127.0.0.1`. Period. |
| **Content ≠ Command** | Your messages are data, never instructions. |
| **Immutable Audit** | SHA-256 hash chain. Tampering breaks everything. |
| **Least Privilege** | Three checks before any tool runs. |
| **Trust Levels** | Six tiers. Hostile sources get 2x risk multiplier. |

<br>

## Quick Start

```bash
git clone https://github.com/ARI-OS/ARI.git
cd ARI && npm install && npm run build

npx ari onboard init     # Initialize
npx ari doctor           # Health check
npx ari gateway start    # Start (127.0.0.1:3141)
```

<br>

## Talk to ARI

```bash
# Check pulse
curl http://127.0.0.1:3141/health

# Send a message
curl -X POST http://127.0.0.1:3141/message \
  -H "Content-Type: application/json" \
  -d '{"content": "What needs my attention?", "source": "operator"}'

# Verify nothing was tampered with
curl http://127.0.0.1:3141/api/audit/verify
```

<br>

## Notifications

ARI can reach you through multiple channels, prioritized by urgency:

| Priority | Channels | When |
|----------|----------|------|
| **P0** Critical | Pushover + SMS | Always. Even at 3am. |
| **P1** High | Pushover | Errors, failures |
| **P2** Normal | Pushover | During waking hours |
| **P3** Low | Notion | Logged quietly |
| **P4** Minimal | Notion (batched) | Background noise |

Quiet hours respected. Rate limits enforced. Your sleep matters.

<br>

## Project Structure

```
src/
├── kernel/         Security boundary. Gateway, Sanitizer, Audit.
├── system/         Message routing and storage.
├── agents/         Guardian, Planner, Executor, Memory.
├── governance/     Council, Arbiter, Overseer.
├── integrations/   Pushover, Notion, SMS, Claude.
├── ops/            macOS daemon.
└── cli/            Command line interface.

scripts/
└── ari-daemon.ts   The always-on brain.
```

<br>

## Development

```bash
npm run build          # Compile
npm run dev            # Watch mode
npm test               # 187 tests
npm run lint           # Check style
```

<br>

## Documentation

| Doc | Purpose |
|-----|---------|
| [CLAUDE.md](CLAUDE.md) | Context for AI assistants |
| [SECURITY.md](docs/SECURITY.md) | Threat model and invariants |
| [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | System design |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to help |

<br>

---

<div align="center">

```
        "The shadow reveals truth."
```

<br>

**Created by [Pryce Hedrick](https://github.com/PryceHedrick)**

Built with [Claude](https://anthropic.com) — an experiment in human-AI collaboration.

<br>

*One machine. One owner. Full autonomy.*

<br>

[MIT License](LICENSE) · 2024-2026

</div>
