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

## Error Handling

### Storage Failures

If the spaced repetition engine cannot load or save card data:

```
╔════════════════════════════════════════════════════════════════╗
║  ⚠️ STORAGE ERROR                                              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Unable to load review cards from ~/.ari/learning/             ║
║                                                                 ║
║  Possible causes:                                               ║
║  • Directory does not exist                                     ║
║  • Insufficient read/write permissions                          ║
║  • Corrupted cards.json file                                    ║
║                                                                 ║
║  Recovery options:                                              ║
║  [A] Create directory and start fresh                           ║
║  [B] Restore from backup (cards.json.backup)                    ║
║  [C] View detailed error                                        ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

**Auto-recovery:**

```typescript
try {
  const engine = await getSpacedRepetitionEngine();
} catch (error) {
  if (error.code === 'STORAGE_INIT_FAILED') {
    // Attempt to create directory structure
    await fs.mkdir(path.join(homeDir, '.ari', 'learning'), { recursive: true });
    // Initialize empty cards file
    await fs.writeFile(cardsPath, JSON.stringify({ cards: [] }));
  }
}
```

### Card Scheduling Errors

If SM-2 algorithm encounters invalid state:

```typescript
// Cards with corrupted scheduling data are auto-repaired
if (card.interval < 0 || card.easeFactor < 1.3) {
  // Reset to default values
  card.interval = 1;
  card.easeFactor = 2.5;
  card.consecutiveCorrect = 0;
}
```

## Card Management

### Edit Cards

Update existing cards without losing scheduling history:

```typescript
const updatedCard = await engine.updateCard(cardId, {
  front: 'New question text',
  back: 'New answer text',
  // Scheduling data preserved
});
```

**UI Flow:**

```
╔════════════════════════════════════════════════════════════════╗
║  ✏️ EDIT CARD                                                   ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Card ID: abc123                                                ║
║  Concept: Kelly Criterion                                       ║
║                                                                 ║
║  Current Front:                                                 ║
║  "What is the Kelly Criterion formula?"                         ║
║                                                                 ║
║  New Front (or press Enter to keep):                            ║
║  [_____________________________________________]                ║
║                                                                 ║
║  Current Back:                                                  ║
║  "f* = (bp - q) / b"                                            ║
║                                                                 ║
║  New Back (or press Enter to keep):                             ║
║  [_____________________________________________]                ║
║                                                                 ║
║  ⚠️ Scheduling data will be preserved                           ║
║                                                                 ║
║  [Save] [Cancel]                                                ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

### Delete Cards

Remove cards permanently:

```typescript
await engine.deleteCard(cardId);
```

**Confirmation:**

```
╔════════════════════════════════════════════════════════════════╗
║  🗑️ DELETE CARD?                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Card: "What is the Kelly Criterion formula?"                   ║
║  Concept: Kelly Criterion                                       ║
║                                                                 ║
║  ⚠️ This action cannot be undone                                ║
║                                                                 ║
║  [Delete] [Cancel]                                              ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

### Archive Cards

Suspend cards without deleting (for concepts no longer relevant):

```typescript
await engine.archiveCard(cardId);
```

Archived cards are excluded from review queues but can be restored:

```typescript
await engine.unarchiveCard(cardId);
```

## Import/Export

### Export All Cards

Save cards as portable JSON:

```typescript
const exported = await engine.exportCards();
await fs.writeFile('my-cards-backup.json', JSON.stringify(exported, null, 2));
```

**Export Format:**

```json
{
  "exportedAt": "2026-02-02T12:00:00.000Z",
  "version": "1.0",
  "cards": [
    {
      "id": "abc123",
      "concept": "Kelly Criterion",
      "front": "What is the Kelly Criterion formula?",
      "back": "f* = (bp - q) / b",
      "interval": 7,
      "easeFactor": 2.5,
      "nextReview": "2026-02-09T12:00:00.000Z"
    }
  ]
}
```

### Import Cards

Restore from backup or import shared decks:

```typescript
const imported = JSON.parse(await fs.readFile('my-cards-backup.json', 'utf-8'));
const result = await engine.importCards(imported.cards, {
  mergeStrategy: 'skip' // 'skip' | 'overwrite' | 'merge'
});

console.log(`Imported ${result.added} new cards, skipped ${result.skipped} duplicates`);
```

**Import Conflict Resolution:**

```
╔════════════════════════════════════════════════════════════════╗
║  📥 IMPORT CONFLICT                                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Found 3 cards with matching IDs in your deck:                 ║
║                                                                 ║
║  Card 1: "Kelly Criterion"                                      ║
║  • Your version: Interval 7 days, EF 2.5                        ║
║  • Import version: Interval 1 day, EF 2.3                       ║
║                                                                 ║
║  How should conflicts be resolved?                              ║
║                                                                 ║
║  [A] Skip (keep your version)                                   ║
║  [B] Overwrite (replace with import)                            ║
║  [C] Merge (keep better scheduling data)                        ║
║  [D] Ask for each conflict                                      ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
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

## See Also

**Related Skills:**

- `/ari-practice` - Deliberate practice sessions that auto-generate review cards
- `/ari-learning-mode` - Comprehension checks that create cards for key concepts
- `/ari-think` - Deep reasoning that identifies concepts worth memorizing

**Integration:**

When you complete a `/ari-practice` session, cards are automatically generated for concepts where you struggled. These appear in your next review queue.

**Workflow:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [/ari-practice] → Practice generates cards for weak areas │
│         ↓                                                   │
│  [/ari-review] → Daily reviews reinforce learning          │
│         ↓                                                   │
│  Cards mature over time (1d → 7d → 30d → 120d intervals)   │
│         ↓                                                   │
│  Long-term retention and mastery                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Cross-Domain Learning:**

Review cards span all three cognitive domains:

- **LOGOS**: Formulas, algorithms, quantitative reasoning
- **ETHOS**: Bias patterns, decision frameworks, emotional regulation
- **PATHOS**: Wisdom traditions, CBT techniques, philosophical concepts
