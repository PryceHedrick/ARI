---
name: ari-practice
description: Run deliberate practice sessions with drills, feedback, and tracked progression
triggers:
  - "deliberate practice"
  - "practice plan"
  - "practice session"
  - "skill progression"
  - "weaknesses"
  - "drills"
  - "/ari-practice"
---

# ARI Practice (Deliberate Practice)

Run a deliberate practice session based on Ericsson's research (2016). This implements skill proficiency tracking with Zone of Proximal Development (ZPD) optimization.

## What It Does

1. Gets or registers a skill in the skill registry
2. Calculates Zone of Proximal Development for optimal challenge
3. Generates practice problems at the right difficulty
4. Tracks performance and updates skill level
5. Detects plateaus and provides targeted recommendations

## How To Run

When invoked with a skill (e.g., `/ari-practice kelly-criterion`):

```typescript
// 1. Initialize the skill registry (loads from ~/.ari/learning/)
const { getSkillRegistry } = await import('../cognition/learning/skill-registry.js');
const registry = await getSkillRegistry();

// 2. Get or register the skill
let skill = registry.getSkill(skillId);
if (!skill) {
  skill = await registry.registerSkill({
    skillId: skillId,
    skillName: 'Kelly Criterion',
    domain: 'LOGOS',
    targetLevel: 80,
    initialLevel: 0,
  });
}

// 3. Calculate ZPD for optimal challenge
const zpd = registry.calculateZPD(skillId);
```

## Session Flow

### 1. Skill Overview

```
┌────────────────────────────────────────────────────────────┐
│ 🎯 ARI PRACTICE SESSION                                    │
│ Skill: Kelly Criterion                                     │
│ Domain: LOGOS                                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Current Level: 35/100                                      │
│ Target Level: 80/100                                       │
│                                                            │
│ Zone of Proximal Development:                              │
│                                                            │
│ [0]═══════════[25]═══════════[45]═══════════[100]          │
│       TOO EASY   │    ZPD     │   TOO HARD                 │
│                  ↑                                         │
│              You are here                                  │
│                                                            │
│ Recommendation: Practice problems in the 25-45 range       │
│ Current challenge level: OPTIMAL                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 2. Practice Problems

Generate problems at ZPD difficulty:

```
┌────────────────────────────────────────────────────────────┐
│ PRACTICE PROBLEM 1/5                                       │
│ Difficulty: 35 (IN YOUR ZPD)                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ You have a bet with:                                       │
│ - 60% win probability                                      │
│ - 2:1 payout odds                                          │
│ - $10,000 bankroll                                         │
│                                                            │
│ What fraction of your bankroll should you bet?             │
│                                                            │
│ Your answer: ___                                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 3. Evaluation & Feedback

After each answer:

```
┌────────────────────────────────────────────────────────────┐
│ ✅ CORRECT!                                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ The Kelly fraction is 0.40 (40%)                           │
│                                                            │
│ Calculation:                                               │
│ f* = (bp - q) / b                                          │
│ f* = (2 × 0.60 - 0.40) / 2                                 │
│ f* = (1.20 - 0.40) / 2                                     │
│ f* = 0.80 / 2 = 0.40                                       │
│                                                            │
│ Recommended bet: $4,000 (40% of $10,000)                   │
│                                                            │
│ Visual:                                                    │
│ [No Bet] ████████████████░░░░░░░░ [Full Kelly]             │
│                 ↑ 40%                                      │
│                                                            │
│ 📈 Skill progress: 35 → 37 (+2 points)                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4. Session Summary

```
═══════════════════════════════════════════════════════════════
📊 PRACTICE SESSION COMPLETE
═══════════════════════════════════════════════════════════════

Skill: Kelly Criterion
Duration: 25 minutes (20 focused)

Problems Attempted: 5
  ✅ Correct: 4
  ❌ Incorrect: 1

Accuracy: 80%
Time Efficiency: 95%

Level Progress: 35 → 42 (+7 points)
[████████████████████░░░░░░░░░░░░░░░░░░░░] 42%

ZPD Status: OPTIMAL
Weekly Gain: +12 points
Estimated to Target: 4 weeks

Common Errors:
  • Forgot to subtract q (loss probability)

Next Session Recommendation:
  Focus on: Edge cases with break-even odds
  Difficulty: 40-50 (slightly harder)

🎯 MILESTONE: Foundation Laid! (25%)
   "You have established the basics!"

═══════════════════════════════════════════════════════════════
```

## Recording Sessions

```typescript
// After practice session completes
const { getPracticeTracker } = await import('../cognition/learning/practice-tracker.js');
const tracker = await getPracticeTracker();

const { session, skill } = await tracker.recordSession({
  userId: 'default',
  skill: skillId,
  session: {
    skill: skillId,
    startedAt: sessionStart,
    endedAt: new Date(),
    plannedMinutes: 25,
    focusedMinutes: 20,
    tasksPlanned: 5,
    tasksCompleted: 4,
    errorPatterns: ['forgot-to-subtract-q'],
  },
});

// Update skill registry with practice
const { milestone } = await registry.updateFromPractice(skillId, session);

if (milestone) {
  console.log(`🎯 MILESTONE: ${milestone.name}!`);
  console.log(`   "${milestone.celebration}"`);
}
```

## Plateau Detection

The system automatically detects plateaus:

```typescript
const plateau = registry.detectPlateau(skillId);

if (plateau.isPlateaued) {
  console.log('⚠️ PLATEAU DETECTED');
  console.log(`   Stagnant for ${plateau.weeksStagnant} weeks`);
  console.log(`   Recommendation: ${plateau.recommendation}`);
}
```

## Core Modules

- `src/cognition/learning/skill-registry.ts` - ZPD and proficiency tracking
- `src/cognition/learning/practice-tracker.ts` - Session recording
- `src/cognition/learning/storage-adapter.ts` - Persistence
- `src/cognition/learning/weakness-analyzer.ts` - Error pattern detection

## ZPD Algorithm

| Success Rate | Position | Recommendation |
|-------------|----------|----------------|
| >90% | BELOW ZPD | Increase difficulty |
| 60-90% | IN ZPD | Optimal challenge |
| <60% | ABOVE ZPD | Decrease difficulty |

## Best Practices

1. **Practice in ZPD** - Maximum learning at edge of ability
2. **Track focused time** - Quality over quantity
3. **Record errors** - Patterns reveal weaknesses
4. **Vary problems** - Interleaving improves transfer
5. **Rest on plateau** - Consolidation happens during rest

## Skill Domains

| Domain | Focus Areas |
|--------|-------------|
| LOGOS | Bayesian reasoning, Kelly, EV, Systems Thinking |
| ETHOS | Bias detection, Emotional regulation, Discipline |
| PATHOS | CBT, Stoicism, Reflection, Wisdom traditions |

## Example Skills to Practice

```typescript
// Register new skills
await registry.registerSkill({
  skillId: 'expected-value',
  skillName: 'Expected Value Calculation',
  domain: 'LOGOS',
  targetLevel: 80,
});

await registry.registerSkill({
  skillId: 'bias-detection',
  skillName: 'Cognitive Bias Detection',
  domain: 'ETHOS',
  targetLevel: 75,
});

await registry.registerSkill({
  skillId: 'cbt-reframing',
  skillName: 'CBT Thought Reframing',
  domain: 'PATHOS',
  targetLevel: 70,
});
```
