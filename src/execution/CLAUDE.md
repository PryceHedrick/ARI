# Execution Layer

Tool registry and executor for ARI's capability invocation.

## Components

| Component | Purpose |
|-----------|---------|
| tool-registry.ts | Register and manage available tools |
| executor.ts | Execute tools with permission checks |
| types.ts | Tool and execution type definitions |

## Tool Categories

| Category | Risk Level | Examples |
|----------|------------|----------|
| READ | Low | file_read, search |
| WRITE | Medium | file_write, create |
| DESTRUCTIVE | High | delete, system_modify |

## Permission Model

Three-layer check before execution:
1. **Agent Allowlist** — Is agent permitted?
2. **Trust Level** — Sufficient trust score?
3. **Permission Tier** — Operation allowed?

```typescript
const result = await executor.execute({
  tool: 'file_write',
  args: { path: '/tmp/test', content: 'hello' },
  agent: 'planner',
  trustLevel: 'OPERATOR',
});
```

## Security

- All executions audited
- Destructive ops require approval
- Risk scoring applied

Skills: `/ari-tool-creation`
