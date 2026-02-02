---
name: ari-review
description: Run spaced repetition reviews (SM-2) with retrieval-first prompts and quality scoring
triggers:
  - "daily review"
  - "spaced repetition"
  - "review due"
  - "SM-2"
  - "quiz me"
  - "/ari-review"
---

# ARI Review (Spaced Repetition)

Run a spaced repetition review session using the SM-2 algorithm. This implements evidence-based learning science from Roediger & Karpicke (2006) showing retrieval practice produces 3x better retention than restudying.

## What It Does

1. Fetches all cards due for review from persistent storage
2. Presents each card as a retrieval prompt (front first)
3. Collects quality rating (0-5) after reveal
4. Updates card scheduling via SM-2 algorithm
5. Shows session summary with streak and next review info

## How To Run

When invoked, execute this review session:

```typescript
// 1. Initialize the spaced repetition engine (loads from ~/.ari/learning/)
const { getSpacedRepetitionEngine } = await import('../cognition/learning/spaced-repetition.js');
const engine = await getSpacedRepetitionEngine();

// 2. Get cards due for review
const now = new Date();
const dueCards = engine.getReviewsDue(now);
const stats = engine.getStats();
```

## Session Flow

For each due card, present this interaction:

```
┌─────────────────────────────────────────────────────────────┐
│ 📚 ARI REVIEW SESSION                                       │
│ Card 1/5 • 5 cards due for review                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ CONCEPT: Expected Value                                     │
│                                                             │
│ Q: What is the formula for Expected Value?                  │
│                                                             │
│ [Take a moment to recall before revealing the answer...]    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Press Enter to reveal answer]                              │
└─────────────────────────────────────────────────────────────┘
```

After user attempts recall, reveal and rate:

```
┌─────────────────────────────────────────────────────────────┐
│ ANSWER REVEALED                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ A: EV = Σ(probability × value)                              │
│                                                             │
│ How well did you recall this?                               │
│                                                             │
│ [0] Complete blackout                                       │
│ [1] Incorrect; barely remembered                            │
│ [2] Incorrect; remembered fragments                         │
│ [3] Correct with serious difficulty                         │
│ [4] Correct with minor hesitation                           │
│ [5] Perfect recall; effortless                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Processing Ratings

```typescript
// After user provides quality rating (0-5)
const review = await engine.reviewCard(card.id, quality);

// Show feedback
console.log(`
✅ Card updated!
   Ease Factor: ${card.easeFactor.toFixed(2)} → ${review.easeFactorAfter.toFixed(2)}
   Next Review: ${review.nextReview.toLocaleDateString()} (${review.intervalAfter} days)
`);
```

## Session Summary

At the end of the session:

```
═══════════════════════════════════════════════════════════════
📊 SESSION COMPLETE
═══════════════════════════════════════════════════════════════

Cards Reviewed: 5
  ✅ Perfect (5):   2
  ✅ Good (4):      1
  ⚠️ Hard (3):      1
  ❌ Failed (0-2):  1

Average Quality: 3.6/5
Time Spent: 4 minutes

📈 Statistics:
   Total Cards: 47
   Due Tomorrow: 8
   Average Ease: 2.43
   Reviewed Today: 12

Next review session: Tomorrow at 8:00 AM
═══════════════════════════════════════════════════════════════
```

## SM-2 Algorithm Reference

| Quality | Meaning | Effect |
|---------|---------|--------|
| 5 | Perfect recall | Interval × ease factor |
| 4 | Correct with hesitation | Interval × ease factor |
| 3 | Correct with difficulty | Interval × ease factor |
| 2 | Wrong but easy in hindsight | Reset to 1 day |
| 1 | Wrong, barely remembered | Reset to 1 day |
| 0 | Complete blackout | Reset to 1 day, decrease ease |

## Creating New Cards

If the user wants to add concepts to review:

```typescript
const card = await engine.createCard({
  concept: 'Kelly Criterion',
  front: 'What is the Kelly Criterion formula?',
  back: 'f* = (bp - q) / b, where b = odds, p = win probability, q = 1-p',
  visual: '[Position Size] ████████░░░░ [Full Kelly]',
});
```

## Core Modules

- `src/cognition/learning/spaced-repetition.ts` - SM-2 engine with persistence
- `src/cognition/learning/storage-adapter.ts` - File-based persistence
- `src/cognition/learning/retrieval-practice.ts` - Socratic dialogue
- `src/cognition/learning/concept-cards.ts` - Card generation

## Best Practices

1. **Keep sessions short** (5-10 minutes, ~10-20 cards max)
2. **Review consistently** - Daily reviews build habit
3. **Be honest with ratings** - Accurate ratings improve scheduling
4. **Use retrieval first** - Try to recall before revealing
5. **Add visual encodings** - Dual coding improves retention
