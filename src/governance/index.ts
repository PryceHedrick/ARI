/**
 * Governance layer exports (Layer 4 - Strategic).
 *
 * The governance layer provides:
 * - Council: 15-member governing body for collective decisions (Legislative)
 * - Arbiter: Constitutional enforcement of hard invariants (Judicial)
 * - Overseer: Quality gate enforcement for releases
 * - PolicyEngine: Central authority for permission decisions (Executive/Governance)
 * - PlanReviewer: Review pipeline for plans before execution
 *
 * Constitutional Alignment:
 * - Article II: Separation of Powers
 * - PolicyEngine implements Section 2.4.1 (Permission Authority)
 */

export { Council } from './council.js';
export { Arbiter } from './arbiter.js';
export { Overseer } from './overseer.js';
export { PolicyEngine } from './policy-engine.js';
export { PlanReviewer } from './plan-reviewer.js';
export type {
  Plan,
  PlanTask,
  PlanReview,
  ReviewPipeline,
  ReviewPipelineStatus,
  ReviewType,
  ReviewOptions,
} from './plan-reviewer.js';
export { SOULManager } from './soul.js';
export type {
  SOULIdentity,
  VotingStyle,
  DecisionContext,
  InfluencedDecision,
} from './soul.js';
