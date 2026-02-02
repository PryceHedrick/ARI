// Core visualization components
export * from './visual-encoder.js';
export * from './comparables.js';
export * from './interpreter.js';
export * from './visualizer.js';
export * from './diagrams.js';
export * from './interactive.js';
export * from './engagement.js';

// Enhanced 0-10 scoring system (explicit exports to avoid conflicts)
export {
  normalize,
  normalizeMultiple,
  getAvailableMetricTypes,
  isValidMetricType,
  getNormalizationRules,
  renderGauge,
  renderMiniGauge,
  type ScoreCategory,
  type NormalizerTrafficLight,
  type ActionType,
  type NormalizedMetric,
  type NormalizationRules,
} from './normalizer.js';

export {
  renderDecoratedGauge,
  renderComparison,
  renderPillarComparison,
  renderSparkline,
  renderHistogram,
  renderOutcomes,
  renderDecisionTree,
  renderStyledProgressBar,
  renderLearningProgress,
  renderRecommendation,
  renderAnalysis,
  renderQuickStatus,
  renderAgentStatus,
  renderEditStatus,
  isEmojiSupported,
  type ComparisonItem,
  type ChartDecisionNode,
  type RecommendationData,
  type AnalysisData,
  type RenderOptions,
} from './charts.js';

export {
  generateRecommendation,
  generateDecisionRecommendation,
  rankDecisions as rankDecisionsByRecommendation,
  shouldProceed,
  hasBlockers,
  generateContextualRecommendation,
  type Recommendation,
  type RecommendationInput,
  type DecisionContext,
} from './recommender.js';

