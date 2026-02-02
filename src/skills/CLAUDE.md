# Skills Layer

Skill execution and management for ARI.

## Components

| Component | Purpose |
|-----------|---------|
| executor.ts | Execute skill definitions |
| loader.ts | Load skills from filesystem |
| types.ts | Skill type definitions |

## Skill Structure

```markdown
# .claude/skills/my-skill/SKILL.md
---
name: my-skill
description: What this skill does
version: 1.0.0
triggers: ["/myskill", "when doing X"]
---

## When to Use
...

## Implementation
...
```

## Loading Skills

```typescript
import { SkillLoader } from './skills';

const loader = new SkillLoader('.claude/skills');
const skills = await loader.loadAll();
```

## Execution

```typescript
import { SkillExecutor } from './skills';

const executor = new SkillExecutor(eventBus);
const result = await executor.execute('my-skill', { args: '...' });
```

Skills: `/ari-skill-generator`
