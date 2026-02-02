---
name: ari-cognitive-layer
description: Complete guide to ARI's Layer 0 cognitive architecture (LOGOS/ETHOS/PATHOS)
triggers:
  - /ari-cognitive
  - /cognitive-layer
  - "cognitive architecture"
  - "three pillars"
  - "logos ethos pathos"
---

# ARI Cognitive Layer Skill

This skill provides expertise in ARI's Layer 0 cognitive architecture.

## Architecture Overview

```
Layer 0: Cognitive Foundation
├── LOGOS 🧠 (Reason)
│   ├── Bayesian Reasoning — Belief updating with evidence
│   ├── Expected Value — Decision optimization
│   ├── Kelly Criterion — Position sizing
│   ├── Decision Trees — Recursive evaluation
│   ├── Systems Thinking — Leverage point identification
│   └── Antifragility — Stress response assessment
│
├── ETHOS ❤️ (Character)
│   ├── Cognitive Bias Detection — 10 bias patterns
│   ├── Emotional State — VAD model analysis
│   ├── Fear/Greed Cycle — Trading psychology
│   └── Discipline Check — Pre-decision gates
│
├── PATHOS 🌱 (Growth)
│   ├── CBT Reframing — Cognitive distortion correction
│   ├── Dichotomy of Control — Stoic analysis
│   ├── Virtue Alignment — Ethical decision check
│   ├── Reflection — Kolb learning cycle
│   ├── Wisdom Traditions — 7 philosophies
│   └── Deliberate Practice — Skill improvement planning
│
├── Knowledge System
│   ├── 92 Curated Sources — Verified trust levels
│   ├── 16 Council Profiles — Member specializations
│   └── 5-Stage Validation — Content pipeline
│
└── Learning Loop
    ├── Performance Review — Daily 9PM
    ├── Gap Analysis — Sunday 8PM
    └── Self-Assessment — 1st of month 9AM
```

## When to Use

Use this skill when:

1. **Making important decisions** — Run the full cognitive pipeline
2. **Detecting biases** — Analyze reasoning for cognitive traps
3. **Position sizing** — Calculate Kelly fractions
4. **Emotional awareness** — Assess decision-making readiness
5. **Reframing thoughts** — Apply CBT techniques
6. **Seeking wisdom** — Query philosophical traditions

## Quick Reference

### LOGOS APIs

```typescript
// Bayesian belief update
const result = await updateBelief(
  { hypothesis: 'Investment succeeds', priorProbability: 0.5 },
  { description: 'Strong earnings', likelihoodRatio: 2.5, strength: 'strong' }
);

// Expected Value calculation
const ev = await calculateExpectedValue({
  description: 'Stock purchase',
  outcomes: [
    { description: 'Up 20%', probability: 0.6, value: 200 },
    { description: 'Down 10%', probability: 0.4, value: -100 },
  ],
});

// Kelly position sizing
const kelly = await calculateKellyFraction({
  winProbability: 0.6,
  winAmount: 200,
  lossAmount: 100,
  currentCapital: 10000,
});
```

### ETHOS APIs

```typescript
// Bias detection
const biases = await detectCognitiveBias(
  'I knew this would work all along. Everyone agrees.',
  { expertise: 'intermediate' }
);

// Emotional state check
const emotional = await assessEmotionalState({
  valence: -0.3,    // negative mood
  arousal: 0.7,     // high energy
  dominance: 0.4,   // feeling less in control
});

// Discipline check
const discipline = await runDisciplineCheck('major investment', 'core', {
  sleep: { hours: 7, quality: 'good' },
  researchDocuments: ['analysis.pdf'],
});
```

### PATHOS APIs

```typescript
// CBT reframing
const reframe = await reframeThought(
  'I always fail at everything',
  { situation: 'Starting new project' }
);

// Dichotomy analysis
const dichotomy = await analyzeDichotomy('Market uncertainty', [
  { item: 'My research', category: 'controllable' },
  { item: 'Market prices', category: 'uncontrollable' },
]);

// Wisdom query
const wisdom = await queryWisdom(
  'How to handle loss?',
  ['STOIC', 'TALEB']
);
```

## CLI Commands

```bash
# Check cognitive health
ari cognitive status

# Analyze text for biases
ari cognitive analyze "I always fail at this"

# Get wisdom guidance
ari cognitive wisdom "How to handle uncertainty?"

# Calculate Kelly sizing
ari cognitive kelly -p 0.6 -w 200 -l 100 -c 10000

# Bayesian update
ari cognitive bayesian -h "Stock rises" -p 0.5 -r 3

# Full decision analysis
ari cognitive decide "Buy AAPL"

# View Council profile
ari cognitive profile strategic
```

## Integration Points

- **API**: `/api/cognition/*` endpoints
- **WebSocket**: Real-time cognitive events
- **Dashboard**: `/cognition` page with pillar health
- **EventBus**: 30+ typed cognitive events

## Best Practices

1. **Always check biases** before major decisions
2. **Run discipline checks** for important trades
3. **Use Kelly sizing** to prevent over-allocation
4. **Query multiple wisdom traditions** for balanced perspective
5. **Track insights** to build pattern recognition
6. **Review performance** to improve calibration

## Related Skills

- `/ari-learning-loop` — Learning system details
- `/ari-council-governance` — Council decision-making
- `/ari-trust-levels` — Security and trust system
