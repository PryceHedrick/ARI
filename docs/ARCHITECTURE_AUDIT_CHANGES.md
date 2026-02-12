# What Changed: Architecture Audit Response

A plain-English summary of every change made in response to the external architecture audit.

**Date**: 2026-02-10
**Auditor**: ChatGPT (external review)
**Implementer**: Claude Code (ARI development agent)
**Result**: 1 code change, 7 documentation updates, 0 test failures

---

## The Short Version

An external AI (ChatGPT) reviewed ARI's architecture and found issues. Some were real gaps. Some were things that already existed but weren't documented. Here's what we actually did about each one.

---

## Change 1: Network Policy Clarification

**The problem**: ARI says "loopback-only" (meaning it only listens on your local machine), but it also calls external APIs like Telegram, OpenAI, and Anthropic. That sounds contradictory — if it's "loopback-only," how is it talking to the internet?

**The fix**: Created `docs/security/NETWORK_POLICY.md` that explains the difference:

- **Inbound** (things connecting TO ARI): Loopback only. ARI's gateway binds to `127.0.0.1`. Nothing from the internet can reach it. This is hardcoded and cannot be changed.
- **Outbound** (ARI connecting to OTHER things): Allowlisted HTTPS only. ARI can call specific services (Telegram for notifications, AI providers for intelligence). Each service is explicitly listed.

Think of it like a house: the front door is locked and only you have a key (inbound), but you can still make phone calls to specific people (outbound).

**Files**: `docs/security/NETWORK_POLICY.md` (new)

---

## Change 2: Audit Chain Checkpoint System

**The problem**: ARI's audit log uses a hash chain — each entry includes a fingerprint of the previous entry, so if anyone modifies an old entry, the chain breaks and you can detect it. But what if someone replaces the *entire* file with a brand new chain? The new chain would be internally consistent, and verification would pass. You'd never know.

**The fix**: Added a **checkpoint system** to the audit code. Every 100 events, ARI takes a snapshot:

```
"At event #200, the chain's fingerprint was ABC123"
```

This snapshot is signed with a secret key that only exists in memory while ARI is running. If someone replaces the audit file, the new chain's fingerprints won't match the old snapshots, and the signatures can't be forged because the attacker doesn't have the key.

It's like taking a photo of your diary page and locking the photo in a safe. If someone rewrites your diary, the photo won't match.

**Files**:
- `src/kernel/audit.ts` (modified — added checkpoint logic)
- `tests/unit/kernel/audit.test.ts` (modified — 3 new tests)

---

## Change 3: Threat Model Rewrite

**The problem**: The threat model document was outdated — wrong pattern counts, missing the OWASP LLM Top 10 framework (the industry standard for AI security risks), and didn't mention the checkpoint system or risk scoring.

**The fix**: Rewrote `docs/security/THREAT_MODEL.md` with:

- **OWASP LLM Top 10 mapping**: The 10 most important AI security risks, and exactly how ARI handles each one. For example:
  - *Prompt Injection* (someone trying to trick ARI with hidden commands) → ARI has 27 detection patterns and treats all input as data, never as instructions
  - *Sensitive Information Disclosure* → ARI never exposes API keys, credentials, or private data in responses
  - *Excessive Agency* → Every tool use requires a signed, single-use, time-limited permission token

- **Updated numbers**: 27 injection patterns across 12 categories (was incorrectly listed as 21/10)
- **Risk scoring formula**: `Risk = Severity × Trust Multiplier` with worked examples
- **Governance triggers**: 12 mechanical rules that fire automatically (no human judgment needed)

**Files**: `docs/security/THREAT_MODEL.md` (rewritten)

---

## Change 4: Policy Engine Documentation

**The problem**: ARI already has a fully built Policy Engine (632 lines of code) that handles every permission decision. The ChatGPT audit assumed it didn't exist because there was no documentation explaining it.

**The fix**: Created `docs/governance/POLICY_ENGINE.md` that explains how permissions actually work:

Every time any agent wants to use a tool, it goes through three checks:

```
Check 1: Is this agent on the tool's approved list?
         → No  → Denied
         → Yes → Next check

Check 2: Does the request source have enough trust?
         → No  → Denied
         → Yes → Next check

Check 3: How risky is this operation?
         → Risk score calculated: Severity × Trust Multiplier
         → Score ≥ 0.8 → Blocked automatically
         → Score < 0.8 → Check if approval needed
           → Low-risk tools → Auto-approved, token issued
           → High-risk tools → Wait for approval (30 sec timeout)
```

If all checks pass, ARI issues a **ToolCallToken** — a permission slip that is:
- Signed (can't be forged)
- Single-use (can't be reused)
- Time-limited (expires in 5 minutes)
- Parameter-locked (can't be used with different inputs)

**Files**: `docs/governance/POLICY_ENGINE.md` (new)

---

## Change 5: Governance Documentation Fix

**The problem**: The governance document listed the wrong council members. It had 13 old placeholder names like "marketing," "sales," "seo," and "build" — names from an early prototype that no longer existed in the code.

**The fix**: Rewrote `docs/governance/GOVERNANCE.md` with the actual 15-member council:

| Pillar | Members | What They Do |
|--------|---------|-------------|
| Infrastructure | ATLAS, BOLT, ECHO | System operations |
| Protection | AEGIS, SCOUT | Security and risk |
| Strategy | TRUE, TEMPO, OPAL | Planning and resources |
| Domains | PULSE, EMBER, PRISM, MINT, BLOOM | Life domain expertise |
| Meta | VERA, NEXUS | Ethics and integration |

Also clarified the three branches of governance:
- **Council** (legislative): Votes on policy questions. Advisory — can be overridden.
- **Arbiter** (judicial): Enforces 6 constitutional rules. Absolute — cannot be overridden by anyone.
- **PolicyEngine** (runtime): Makes permission decisions mechanically. Deterministic — no judgment, just rules.

**Files**: `docs/governance/GOVERNANCE.md` (rewritten)

---

## Change 6: Audit Security Explanation

**The problem**: No document explained how the audit trail actually works in simple terms, or what its limitations are.

**The fix**: Created `docs/security/AUDIT_SECURITY.md` that explains:

- **How the hash chain works**: Each event includes a fingerprint of the previous event. Modify any event and the chain breaks.
- **How checkpoints work**: Periodic signed snapshots detect if the entire chain gets replaced.
- **What gets audited**: Every gateway start/stop, every message, every security event, every vote, every permission decision.
- **Limitations** (being honest about what it can't do):
  - It's tamper-*evident*, not tamper-*proof* — it detects changes but can't prevent them
  - Timestamps trust the system clock
  - Single-machine storage means hardware failure loses data unless backed up
  - The signing key resets when ARI restarts

**Files**: `docs/security/AUDIT_SECURITY.md` (new)

---

## Change 7: Budget System Specification

**The problem**: No document explained how ARI manages AI spending — what happens when it gets close to its daily limit, how much each AI call costs, or how the degradation works.

**The fix**: Created `docs/operations/BUDGET_SPEC.md` that documents:

- **Three budget profiles**: Conservative ($1/day), Balanced ($2.50/day), Aggressive ($5/day)
- **Per-provider costs**: How much each AI model costs per request
- **Degradation ladder** — what happens as spending increases:

```
  0-80%  → Normal: all models available
 80-90%  → Warning: prefer cheaper models
 90-95%  → Reduce: essential operations only
 95-100% → Pause: only respond to direct commands
  100%   → Stopped: no AI operations until next day
```

- **Governance integration**: Cheap calls ($0.005) are auto-approved. Expensive calls ($1+) need 12/15 council votes.

**Files**: `docs/operations/BUDGET_SPEC.md` (new)

---

## Change 8: Recovery Runbook

**The problem**: No step-by-step procedures for recovering from common failures. If ARI's daemon crashed or the audit chain got corrupted, there was no playbook.

**The fix**: Created `docs/operations/RECOVERY_RUNBOOK.md` with procedures for:

| Problem | Steps |
|---------|-------|
| Daemon crashed | Check status → check logs → restart → verify health |
| Audit chain corrupted | Stop daemon → verify chain → restore from backup → restart |
| Budget overrun | Check status → wait for reset or switch to aggressive profile |
| Notifications not sending | Check bot token → check logs → test manually → update token |
| Mac Mini unreachable | Try SSH → try Tailscale → check uptime → restart daemon |
| Build failure | Check error → reinstall deps → fix TypeScript → rebuild |

Also includes backup/restore procedures and what data lives where.

**Files**: `docs/operations/RECOVERY_RUNBOOK.md` (new)

---

## What the Audit Got Wrong

The ChatGPT audit was useful, but it assumed several things were missing that already existed:

| Audit Claim | Reality |
|------------|---------|
| "No Policy Engine" | 632-line PolicyEngine already exists with full 3-layer checks |
| "No risk scoring" | Risk scoring already implemented: `Severity × Trust Multiplier` |
| "No ToolCallTokens" | ToolCallTokens already exist: signed, single-use, time-bound |
| "Council is the authority" | Council is advisory; PolicyEngine is the runtime authority |
| "Replace injection scanning with capability control" | We have both — scanning AND capability control (they complement each other) |

The real gaps were documentation (explaining what exists) and the checkpoint anchoring system (which was genuinely missing).

---

## What Wasn't Changed

Some audit recommendations were intentionally not implemented:

| Recommendation | Why Not |
|----------------|---------|
| Remove injection pattern scanning | Scanning and capability control are complementary defenses. Removing one weakens security. |
| Bounded job queue for autonomy | The current autonomous system with budget governance and degradation is sufficient for Phase 1. Job queues add complexity without clear benefit yet. |
| Supply chain protection | Important but orthogonal to this audit. Will address when we set up CI/CD pipeline. |

---

## Verification

After all changes:
- **Tests**: 3991/3991 passing (0 failures)
- **TypeScript**: Compiles clean (0 errors)
- **Audit chain**: 3 new tests for checkpoint system, all passing
- **No breaking changes**: Only additive changes to audit.ts, fully backward compatible

---

## File Summary

| File | Status | What |
|------|--------|------|
| `src/kernel/audit.ts` | Modified | Checkpoint anchoring system |
| `tests/unit/kernel/audit.test.ts` | Modified | 3 new checkpoint tests |
| `docs/security/NETWORK_POLICY.md` | New | Inbound vs outbound network rules |
| `docs/security/THREAT_MODEL.md` | Rewritten | OWASP LLM Top 10, updated counts |
| `docs/security/AUDIT_SECURITY.md` | New | How the audit trail works |
| `docs/governance/GOVERNANCE.md` | Rewritten | Correct council members, role clarity |
| `docs/governance/POLICY_ENGINE.md` | New | How permissions actually work |
| `docs/operations/BUDGET_SPEC.md` | New | AI spending and degradation |
| `docs/operations/RECOVERY_RUNBOOK.md` | New | Step-by-step failure recovery |

---

v1.0 - 2026-02-10
