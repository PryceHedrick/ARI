# Observability Layer

Real-time monitoring, alerting, and metrics for ARI operations.

## Components

| Component | Purpose |
|-----------|---------|
| alert-manager.ts | Alert rules and notifications |
| alert-types.ts | Alert type definitions |
| execution-history.ts | Track execution history |
| index.ts | Module exports |

## Alert Severities

| Severity | Description | Action |
|----------|-------------|--------|
| INFO | Informational | Log only |
| WARNING | Potential issue | Review soon |
| ERROR | Action failed | Investigate |
| CRITICAL | System impacted | Immediate action |

## Key Metrics

- Request latency (p50, p95, p99)
- Error rates by type
- Audit chain integrity
- Agent activity counts
- Memory usage

## Dashboard Integration

Metrics are emitted via EventBus for dashboard consumption:
```typescript
eventBus.emit('metrics:recorded', {
  name: 'request_latency',
  value: 42,
  labels: { endpoint: '/api/message' },
});
```

Skills: `/ari-monitoring-alerting`
