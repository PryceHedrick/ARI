---
name: ari-learning-loop
description: ARI's 5-stage continuous learning system for self-improvement
triggers:
  - /ari-learning
  - /learning-loop
  - "performance review"
  - "gap analysis"
  - "self assessment"
---

# ARI Learning Loop Skill

This skill covers ARI's continuous self-improvement system.

## The 5-Stage Learning Loop

```
┌────────────────────────────────────────────────────────────────┐
│                     ARI LEARNING LOOP                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│    ┌─────────────────┐                                        │
│    │ 1. Performance  │ ◄── Daily 9PM                          │
│    │    Review       │     Analyze decisions, outcomes        │
│    └────────┬────────┘                                        │
│             │                                                  │
│             ▼                                                  │
│    ┌─────────────────┐                                        │
│    │ 2. Gap          │ ◄── Weekly (Sunday 8PM)                │
│    │    Analysis     │     Identify knowledge gaps            │
│    └────────┬────────┘                                        │
│             │                                                  │
│             ▼                                                  │
│    ┌─────────────────┐                                        │
│    │ 3. Source       │ ◄── Triggered by gaps                  │
│    │    Discovery    │     Find new knowledge sources         │
│    └────────┬────────┘                                        │
│             │                                                  │
│             ▼                                                  │
│    ┌─────────────────┐                                        │
│    │ 4. Knowledge    │ ◄── After validation                   │
│    │    Integration  │     Integrate verified content         │
│    └────────┬────────┘                                        │
│             │                                                  │
│             ▼                                                  │
│    ┌─────────────────┐                                        │
│    │ 5. Self         │ ◄── Monthly (1st, 9AM)                 │
│    │    Assessment   │     Grade improvement trend            │
│    └────────┬────────┘                                        │
│             │                                                  │
│             └──────────────────────────────────┐               │
│                                                │               │
│                        ◄───────────────────────┘               │
│                     (Loop continues)                           │
└────────────────────────────────────────────────────────────────┘
```

## Schedule

| Stage | Trigger | Purpose |
|-------|---------|---------|
| **Performance Review** | Daily 9PM | Analyze decisions, biases, outcomes |
| **Gap Analysis** | Sunday 8PM | Identify weak areas |
| **Source Discovery** | On demand | Find new resources |
| **Integration** | After validation | Add to knowledge base |
| **Self-Assessment** | 1st of month 9AM | Grade and plan |

## Performance Review

Runs daily at 9PM to analyze:

- **Decisions made** — Success rate, EV accuracy
- **Biases detected** — Patterns and trends
- **Emotional risk** — Average risk score
- **Insights generated** — New learnings

```typescript
const review = await runPerformanceReview([
  {
    id: 'decision-1',
    description: 'Bought AAPL',
    outcome: 'success',
    expectedValue: 100,
    actualValue: 120,
    biasesDetected: ['CONFIRMATION_BIAS'],
    emotionalRisk: 0.3,
  },
]);

// Returns:
// - decisions: { total, successful, failed, partial, successRate }
// - expectedValueAccuracy: { meanError, rmse, calibration }
// - biasesDetected: { total, byType, trend }
// - patterns: string[]
// - recommendations: string[]
```

## Gap Analysis

Runs weekly to identify:

- **Unanswered queries** — Questions without good answers
- **Frequent failures** — Repeated problem areas
- **Domain coverage** — Blind spots
- **Source suggestions** — New resources to add

```typescript
const gaps = await runGapAnalysis(
  [
    { query: 'How to value options?', domain: 'finance', answered: false },
    { query: 'Risk assessment', domain: 'risk', answered: true, confidence: 0.4 },
  ],
  [
    { description: 'Failed volatility calc', domain: 'risk', reason: 'Missing data' },
  ]
);

// Returns:
// - gaps: KnowledgeGap[]
// - topGaps: top 5 by priority
// - recommendations: string[]
// - newSourceSuggestions: { name, url, rationale }[]
```

## Self-Assessment

Monthly comprehensive evaluation:

- **Decision quality trend** — Improving, stable, declining
- **Bias reduction** — Fewer biases over time
- **Knowledge growth** — Documents added, queries answered
- **Learning velocity** — Insights per week
- **Framework effectiveness** — Which frameworks help most
- **Overall grade** — A, B, C, D, F

```typescript
const assessment = await runSelfAssessment(
  currentPeriodMetrics,
  previousPeriodMetrics
);

// Returns:
// - decisionQuality: { thisPeriod, lastPeriod, change, trend }
// - biasReduction: { biasesThisPeriod, biasesLastPeriod, reduction }
// - knowledgeGrowth: { documentsAdded, sourcesAdded, querySuccessRate }
// - learningVelocity: { insightsPerWeek, principlesExtracted }
// - frameworkEffectiveness: { framework, usageCount, successRate }[]
// - overallImprovement: number
// - grade: 'A' | 'B' | 'C' | 'D' | 'F'
// - recommendations: string[]
```

## Insights System

Track learnings across sessions:

```typescript
// Add new insight
addInsight({
  id: 'insight-123',
  type: 'PATTERN',         // SUCCESS, MISTAKE, PATTERN, PRINCIPLE, ANTIPATTERN
  description: 'Market timing fails consistently',
  evidence: ['Lost 3 times timing market', 'Studies show timing impossible'],
  actionable: 'Use DCA instead of market timing',
  confidence: 0.85,
  generalizes: true,       // Applies broadly
  priority: 'HIGH',
  framework: 'LOGOS: Expected Value',
  timestamp: new Date(),
});

// Retrieve insights
const recent = getRecentInsights(10);
const patterns = getInsightsByType('PATTERN');
```

## EventBus Events

```typescript
// Performance review complete
'learning:performance_review': {
  period: string;
  successRate: number;
  biasCount: number;
  insightCount: number;
  recommendations: string[];
  timestamp: string;
};

// Gap analysis complete
'learning:gap_analysis': {
  period: string;
  gapsFound: number;
  topGaps: Array<{ domain: string; severity: string }>;
  sourceSuggestions: number;
  timestamp: string;
};

// Self assessment complete
'learning:self_assessment': {
  period: string;
  grade: string;
  improvement: number;
  trend: string;
  recommendations: string[];
  timestamp: string;
};

// New insight generated
'learning:insight_generated': {
  insightId: string;
  type: string;
  description: string;
  confidence: number;
  generalizes: boolean;
  timestamp: string;
};
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cognition/learning/status` | GET | Current loop status |
| `/api/cognition/learning/performance` | GET | Latest review |
| `/api/cognition/learning/gaps` | GET | Knowledge gaps |
| `/api/cognition/insights` | GET | Recent insights |
| `/api/cognition/insights` | POST | Add new insight |

## Best Practices

1. **Don't skip reviews** — Consistency builds patterns
2. **Act on recommendations** — Reviews mean nothing without action
3. **Track insights honestly** — Include mistakes, not just wins
4. **Fill gaps proactively** — Don't wait for failures
5. **Grade yourself honestly** — Accurate assessment enables growth

## Related Skills

- `/ari-cognitive-layer` — Full cognitive architecture
- `/ari-knowledge-synthesizer` — Knowledge integration
- `/ari-continuous-improvement` — Self-improvement patterns
