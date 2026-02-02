/**
 * ARI — Artificial Reasoning Intelligence
 *
 * Main entry point. Core layers are exported here.
 * For specialized modules, import directly:
 *   - import { ... } from 'ari/cognition'
 *   - import { ... } from 'ari/observability'
 *   - import { ... } from 'ari/autonomous'
 */

// Core Layers (ordered by dependency)
export * from './kernel/index.js';
export * from './system/index.js';
export * from './agents/index.js';
export * from './governance/index.js';
export * from './ops/index.js';
