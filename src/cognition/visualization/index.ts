/**
 * Visualization Module — Learning Feedback System
 *
 * Provides visual and educational feedback for cognitive operations:
 *
 * - **Insight Formatter**: Format cognitive results as readable blocks
 * - **Progress Tracker**: Track and display learning progress
 * - **Reasoning Explainer**: Educational explanations of cognitive processes
 *
 * @module cognition/visualization
 * @version 1.0.0
 */

import type {
  InsightBlock,
  ExpectedValueResult,
  BiasAnalysis,
  EmotionalState,
  KellyResult,
  CBTReframe,
  DichotomyAnalysis,
  AntifragilityAnalysis,
  Pillar,
  LearningProgress,
  CognitiveHealth,
  PillarHealth,
} from '../types.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const PILLAR_ICONS: Record<Pillar, string> = {
  LOGOS: '🧠',
  ETHOS: '❤️',
  PATHOS: '🌱',
};

const PILLAR_COLORS: Record<Pillar, string> = {
  LOGOS: 'blue',
  ETHOS: 'orange',
  PATHOS: 'green',
};

const HIGHLIGHT_SYMBOLS: Record<string, string> = {
  positive: '✅',
  negative: '❌',
  warning: '⚠️',
  neutral: '•',
};

// =============================================================================
// INSIGHT BLOCK FORMATTING
// =============================================================================

/**
 * Format a cognitive result as a readable insight block
 *
 * Designed for display in CLI or Claude Code sessions.
 */
export function formatInsightBlock(block: InsightBlock): string {
  const icon = PILLAR_ICONS[block.pillar];
  const divider = '═'.repeat(70);
  const thinDivider = '─'.repeat(70);

  let output = `\n${divider}\n`;
  output += `${icon} COGNITIVE INSIGHT | ${block.pillar}: ${block.framework}\n`;
  output += `${divider}\n\n`;

  output += `${block.title}\n\n`;

  for (const section of block.sections) {
    output += `${section.heading}:\n`;

    const highlight = section.highlight ? HIGHLIGHT_SYMBOLS[section.highlight] : '•';

    if (Array.isArray(section.content)) {
      for (const item of section.content) {
        output += `  ${highlight} ${item}\n`;
      }
    } else {
      output += `  ${section.content}\n`;
    }
    output += '\n';
  }

  output += `${thinDivider}\n`;
  output += `Recommendation: ${block.recommendation}\n`;
  output += `Confidence: ${(block.confidence * 100).toFixed(0)}%\n`;

  if (block.educationalNote) {
    output += `\n📚 WHY THIS MATTERS\n`;
    output += `${block.educationalNote}\n`;
  }

  output += `${divider}\n`;

  return output;
}

/**
 * Format Expected Value result as insight block
 */
export function formatExpectedValueInsight(result: ExpectedValueResult): string {
  return formatInsightBlock({
    pillar: 'LOGOS',
    framework: 'Expected Value Theory',
    title: `Decision Analysis: ${result.decision}`,
    sections: [
      {
        heading: 'Outcomes Analyzed',
        content: result.outcomes.map(o =>
          `${(o.probability * 100).toFixed(0)}% chance: ${o.value >= 0 ? '+' : ''}$${o.value.toFixed(2)} - ${o.description}`
        ),
        highlight: 'neutral',
      },
      {
        heading: 'Expected Value',
        content: `${result.expectedValue >= 0 ? '+' : ''}$${result.expectedValue.toFixed(2)} (${result.recommendation})`,
        highlight: result.expectedValue > 0 ? 'positive' : result.expectedValue < 0 ? 'negative' : 'neutral',
      },
      {
        heading: 'Risk Profile',
        content: [
          `Standard Deviation: $${result.standardDeviation.toFixed(2)}`,
          `Best Case: +$${result.bestCase.value.toFixed(2)} (${(result.bestCase.probability * 100).toFixed(0)}%)`,
          `Worst Case: $${result.worstCase.value.toFixed(2)} (${(result.worstCase.probability * 100).toFixed(0)}%)`,
        ],
        highlight: 'neutral',
      },
    ],
    recommendation: result.reasoning[result.reasoning.length - 1],
    confidence: result.confidence,
    educationalNote: 'Expected Value = Σ(probability × value). Positive EV means the decision has positive average return over many repetitions. Source: Decision Theory',
  });
}

/**
 * Format Bias Analysis result as insight block
 */
export function formatBiasInsight(result: BiasAnalysis): string {
  const biasCount = result.biasesDetected.length;

  return formatInsightBlock({
    pillar: 'ETHOS',
    framework: 'Cognitive Bias Detection',
    title: `Bias Check: ${biasCount} bias${biasCount !== 1 ? 'es' : ''} detected`,
    sections: biasCount > 0 ? [
      {
        heading: 'Biases Found',
        content: result.biasesDetected.map(b =>
          `${b.type.replace(/_/g, ' ')}: Severity ${(b.severity * 100).toFixed(0)}%`
        ),
        highlight: 'warning',
      },
      {
        heading: 'Evidence',
        content: result.biasesDetected.flatMap(b => b.evidence).slice(0, 5),
        highlight: 'neutral',
      },
      {
        heading: 'Mitigations',
        content: result.recommendations.slice(0, 3),
        highlight: 'positive',
      },
    ] : [
      {
        heading: 'Result',
        content: 'No significant cognitive biases detected in this reasoning.',
        highlight: 'positive',
      },
    ],
    recommendation: biasCount > 0
      ? `Overall Risk: ${(result.overallRisk * 100).toFixed(0)}% - Apply mitigations before proceeding`
      : 'Proceed with confidence - reasoning appears unbiased',
    confidence: 1 - result.overallRisk,
    educationalNote: biasCount > 0
      ? 'Cognitive biases are systematic errors in thinking that affect everyone. Awareness is the first step to mitigation. Source: Kahneman & Tversky research'
      : undefined,
  });
}

/**
 * Format Kelly Criterion result as insight block
 */
export function formatKellyInsight(result: KellyResult): string {
  return formatInsightBlock({
    pillar: 'LOGOS',
    framework: 'Kelly Criterion',
    title: 'Optimal Position Sizing',
    sections: [
      {
        heading: 'Kelly Fractions',
        content: [
          `Full Kelly: ${(result.fullKelly * 100).toFixed(1)}%`,
          `Half Kelly: ${(result.halfKelly * 100).toFixed(1)}%`,
          `Quarter Kelly: ${(result.quarterKelly * 100).toFixed(1)}%`,
        ],
        highlight: 'neutral',
      },
      {
        heading: 'Edge Analysis',
        content: [
          `Edge: ${(result.edge * 100).toFixed(2)}%`,
          `Expected Growth Rate: ${(result.expectedGrowthRate * 100).toFixed(4)}%`,
        ],
        highlight: result.edge > 0 ? 'positive' : 'negative',
      },
      ...(result.warnings.length > 0 ? [{
        heading: 'Warnings',
        content: result.warnings,
        highlight: 'warning' as const,
      }] : []),
      ...(result.dollarAmount !== undefined ? [{
        heading: 'Dollar Amount',
        content: `Recommended allocation: $${result.dollarAmount.toFixed(2)}`,
        highlight: 'neutral' as const,
      }] : []),
    ],
    recommendation: `Use ${result.recommendedStrategy} Kelly: ${(result.recommendedFraction * 100).toFixed(1)}% of capital`,
    confidence: result.edge > 0 ? Math.min(0.95, 0.5 + result.edge) : 0.3,
    educationalNote: 'The Kelly Criterion maximizes long-term growth while avoiding ruin. Half-Kelly is often recommended to reduce volatility. Source: John Kelly (1956), Ed Thorp',
  });
}

/**
 * Format Emotional State result as insight block
 */
export function formatEmotionalInsight(result: EmotionalState): string {
  const riskLevel = result.riskToDecisionQuality > 0.6 ? 'HIGH' : result.riskToDecisionQuality > 0.3 ? 'MODERATE' : 'LOW';

  return formatInsightBlock({
    pillar: 'ETHOS',
    framework: 'Emotional State (VAD Model)',
    title: `Emotional Risk Assessment: ${riskLevel}`,
    sections: [
      {
        heading: 'Current State',
        content: [
          `Valence: ${result.valence > 0 ? '+' : ''}${result.valence.toFixed(2)} (${result.valence > 0 ? 'positive' : 'negative'})`,
          `Arousal: ${result.arousal.toFixed(2)} (${result.arousal > 0.6 ? 'elevated' : 'calm'})`,
          `Dominance: ${result.dominance.toFixed(2)} (${result.dominance > 0.5 ? 'in control' : 'uncertain'})`,
        ],
        highlight: 'neutral',
      },
      {
        heading: 'Detected Emotions',
        content: result.emotions,
        highlight: result.riskToDecisionQuality > 0.5 ? 'warning' : 'neutral',
      },
      {
        heading: 'Risk to Decision Quality',
        content: `${(result.riskToDecisionQuality * 100).toFixed(0)}%`,
        highlight: result.riskToDecisionQuality > 0.6 ? 'negative' : result.riskToDecisionQuality > 0.3 ? 'warning' : 'positive',
      },
    ],
    recommendation: result.recommendations[0] || 'Emotional state is within acceptable range for decision-making',
    confidence: 1 - result.riskToDecisionQuality,
    educationalNote: "The VAD model (Valence-Arousal-Dominance) maps emotional states. High arousal + positive valence = euphoria risk. High arousal + negative valence = fear risk. Source: Russell's Circumplex Model",
  });
}

/**
 * Format CBT Reframe result as insight block
 */
export function formatCBTInsight(result: CBTReframe): string {
  const distortionCount = result.distortionsDetected.length;

  return formatInsightBlock({
    pillar: 'PATHOS',
    framework: 'Cognitive Behavioral Therapy',
    title: `Thought Analysis: ${distortionCount} distortion${distortionCount !== 1 ? 's' : ''} found`,
    sections: [
      {
        heading: 'Original Thought',
        content: result.originalThought,
        highlight: distortionCount > 0 ? 'warning' : 'neutral',
      },
      ...(distortionCount > 0 ? [{
        heading: 'Distortions Detected',
        content: result.distortionsDetected.map(d =>
          `${d.type.replace(/_/g, ' ')}: ${(d.severity * 100).toFixed(0)}% severity`
        ),
        highlight: 'warning' as const,
      }] : []),
      {
        heading: 'Reframed Thought',
        content: result.reframedThought,
        highlight: 'positive',
      },
      {
        heading: 'Action Step',
        content: result.actionable,
        highlight: 'neutral',
      },
    ],
    recommendation: result.balancedPerspective,
    confidence: distortionCount > 0 ? 0.85 : 0.7,
    educationalNote: distortionCount > 0
      ? 'Cognitive distortions are exaggerated or irrational thought patterns. Identifying and reframing them improves emotional well-being and decision-making. Source: David Burns, Aaron Beck'
      : undefined,
  });
}

/**
 * Format Dichotomy of Control analysis as insight block
 */
export function formatDichotomyInsight(result: DichotomyAnalysis): string {
  return formatInsightBlock({
    pillar: 'PATHOS',
    framework: 'Dichotomy of Control (Stoicism)',
    title: `Control Analysis: ${result.situation.substring(0, 50)}...`,
    sections: [
      {
        heading: 'Within Your Control',
        content: result.controllable.length > 0
          ? result.controllable.map(c => `${c.item} → ${c.actionable}`)
          : ['No controllable elements identified'],
        highlight: 'positive',
      },
      {
        heading: 'Outside Your Control',
        content: result.uncontrollable.length > 0
          ? result.uncontrollable.map(u => `${u.item} → Accept and release`)
          : ['No uncontrollable elements - full agency available'],
        highlight: result.uncontrollable.length > 0 ? 'warning' : 'positive',
      },
      {
        heading: 'Focus Area',
        content: result.focusArea,
        highlight: 'positive',
      },
      ...(result.stoicQuote ? [{
        heading: 'Stoic Wisdom',
        content: `"${result.stoicQuote.text}" — ${result.stoicQuote.source}`,
        highlight: 'neutral' as const,
      }] : []),
    ],
    recommendation: result.recommendation,
    confidence: 0.9,
    educationalNote: 'The Dichotomy of Control is the foundation of Stoic philosophy. By focusing only on what we can control (our actions and attitudes) and accepting what we cannot, we reduce suffering and increase effectiveness. Source: Epictetus',
  });
}

/**
 * Format Antifragility analysis as insight block
 */
export function formatAntifragilityInsight(result: AntifragilityAnalysis): string {
  const categoryEmoji = result.category === 'antifragile' ? '💪' :
                        result.category === 'robust' ? '🛡️' : '💔';

  return formatInsightBlock({
    pillar: 'LOGOS',
    framework: 'Antifragility Analysis',
    title: `${categoryEmoji} ${result.item}: ${result.category.toUpperCase()}`,
    sections: [
      {
        heading: 'Category',
        content: `${result.category.toUpperCase()} (Score: ${result.score.toFixed(2)})`,
        highlight: result.category === 'antifragile' ? 'positive' :
                   result.category === 'fragile' ? 'negative' : 'neutral',
      },
      {
        heading: 'Stressor Analysis',
        content: result.stressors.map(s =>
          `${s.stressor}: ${s.effect} (magnitude: ${s.magnitude.toFixed(2)})`
        ),
        highlight: 'neutral',
      },
      {
        heading: 'Metrics',
        content: [
          `Optionality: ${(result.optionality.score * 100).toFixed(0)}%`,
          `Convexity: ${result.convexity.score.toFixed(2)}`,
        ],
        highlight: result.optionality.score > 0.5 ? 'positive' : 'neutral',
      },
      {
        heading: 'Recommendations',
        content: result.recommendations,
        highlight: 'positive',
      },
    ],
    recommendation: result.category === 'antifragile'
      ? 'System benefits from volatility - embrace stressors'
      : result.category === 'robust'
      ? 'System is resilient but could be improved'
      : 'System is fragile - add redundancy and optionality',
    confidence: 0.85,
    educationalNote: 'Antifragility means getting stronger from stressors (like muscles from exercise). Fragile things break, robust things resist, antifragile things grow. Source: Nassim Taleb',
  });
}

// =============================================================================
// COMPREHENSIVE ANALYSIS FORMATTING
// =============================================================================

/**
 * Format multiple pillar results together
 */
export function formatComprehensiveAnalysis(results: {
  ev?: ExpectedValueResult;
  kelly?: KellyResult;
  biases?: BiasAnalysis;
  emotional?: EmotionalState;
  cbt?: CBTReframe;
  dichotomy?: DichotomyAnalysis;
  antifragility?: AntifragilityAnalysis;
}): string {
  const outputs: string[] = [];

  outputs.push('\n' + '═'.repeat(70));
  outputs.push('🎯 COMPREHENSIVE COGNITIVE ANALYSIS');
  outputs.push('═'.repeat(70));

  if (results.ev) {
    outputs.push(formatExpectedValueInsight(results.ev));
  }

  if (results.kelly) {
    outputs.push(formatKellyInsight(results.kelly));
  }

  if (results.biases) {
    outputs.push(formatBiasInsight(results.biases));
  }

  if (results.emotional) {
    outputs.push(formatEmotionalInsight(results.emotional));
  }

  if (results.cbt) {
    outputs.push(formatCBTInsight(results.cbt));
  }

  if (results.dichotomy) {
    outputs.push(formatDichotomyInsight(results.dichotomy));
  }

  if (results.antifragility) {
    outputs.push(formatAntifragilityInsight(results.antifragility));
  }

  // Summary section
  outputs.push('\n' + '═'.repeat(70));
  outputs.push('📋 SUMMARY');
  outputs.push('─'.repeat(70));

  const summaryPoints: string[] = [];

  if (results.ev) {
    summaryPoints.push(`LOGOS: EV ${results.ev.expectedValue >= 0 ? '+' : ''}$${results.ev.expectedValue.toFixed(2)} → ${results.ev.recommendation}`);
  }

  if (results.kelly) {
    summaryPoints.push(`LOGOS: Kelly recommends ${results.kelly.recommendedStrategy} (${(results.kelly.recommendedFraction * 100).toFixed(1)}%)`);
  }

  if (results.biases) {
    const count = results.biases.biasesDetected.length;
    summaryPoints.push(`ETHOS: ${count} bias${count !== 1 ? 'es' : ''} detected, risk ${(results.biases.overallRisk * 100).toFixed(0)}%`);
  }

  if (results.emotional) {
    summaryPoints.push(`ETHOS: Emotional risk ${(results.emotional.riskToDecisionQuality * 100).toFixed(0)}% (${results.emotional.emotions[0] || 'stable'})`);
  }

  if (results.cbt) {
    const count = results.cbt.distortionsDetected.length;
    summaryPoints.push(`PATHOS: ${count} cognitive distortion${count !== 1 ? 's' : ''} identified`);
  }

  if (results.dichotomy) {
    summaryPoints.push(`PATHOS: ${results.dichotomy.controllable.length} controllable, ${results.dichotomy.uncontrollable.length} uncontrollable`);
  }

  if (results.antifragility) {
    summaryPoints.push(`LOGOS: System is ${results.antifragility.category.toUpperCase()}`);
  }

  outputs.push(summaryPoints.join('\n'));
  outputs.push('═'.repeat(70) + '\n');

  return outputs.join('\n');
}

// =============================================================================
// PROGRESS VISUALIZATION
// =============================================================================

/**
 * Format learning progress for display
 */
export function formatLearningProgress(progress: LearningProgress): string {
  const stages = [
    { id: 'PERFORMANCE_REVIEW', name: 'Performance Review', icon: '📊' },
    { id: 'GAP_ANALYSIS', name: 'Gap Analysis', icon: '🔍' },
    { id: 'SOURCE_DISCOVERY', name: 'Source Discovery', icon: '📚' },
    { id: 'KNOWLEDGE_INTEGRATION', name: 'Knowledge Integration', icon: '🧩' },
    { id: 'SELF_ASSESSMENT', name: 'Self-Assessment', icon: '📝' },
  ];

  const currentIndex = stages.findIndex(s => s.id === progress.currentStage);

  let output = '\n' + '═'.repeat(70) + '\n';
  output += '🎓 LEARNING LOOP PROGRESS\n';
  output += '═'.repeat(70) + '\n\n';

  // Stage progress bar
  output += 'Stage Progress:\n';
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const isComplete = i < currentIndex;
    const isCurrent = i === currentIndex;
    const symbol = isComplete ? '✅' : isCurrent ? '🔄' : '⬜';
    output += `  ${symbol} ${stage.icon} ${stage.name}${isCurrent ? ' ← Current' : ''}\n`;
  }

  output += '\n' + '─'.repeat(70) + '\n';

  // Schedule
  output += 'Schedule:\n';
  output += `  Last Review: ${formatDate(progress.lastReview)}\n`;
  output += `  Next Review: ${formatDate(progress.nextReview)}\n`;
  output += `  Last Gap Analysis: ${formatDate(progress.lastGapAnalysis)}\n`;
  output += `  Next Gap Analysis: ${formatDate(progress.nextGapAnalysis)}\n`;
  output += `  Last Assessment: ${formatDate(progress.lastAssessment)}\n`;
  output += `  Next Assessment: ${formatDate(progress.nextAssessment)}\n`;

  output += '\n' + '─'.repeat(70) + '\n';

  // Stats
  output += 'Stats:\n';
  output += `  Recent Insights: ${progress.recentInsightsCount}\n`;
  output += `  Current Grade: ${progress.currentGrade}\n`;
  output += `  Streak: ${progress.streakDays} days\n`;
  output += `  Trend: ${progress.improvementTrend === 'IMPROVING' ? '📈' : progress.improvementTrend === 'DECLINING' ? '📉' : '➡️'} ${progress.improvementTrend}\n`;

  output += '═'.repeat(70) + '\n';

  return output;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// HEALTH VISUALIZATION
// =============================================================================

/**
 * Format cognitive health for display
 */
export function formatCognitiveHealth(health: CognitiveHealth): string {
  const healthEmoji = health.overall >= 0.9 ? '💚' :
                      health.overall >= 0.7 ? '💛' :
                      health.overall >= 0.5 ? '🧡' : '❤️';

  let output = '\n' + '═'.repeat(70) + '\n';
  output += `${healthEmoji} COGNITIVE LAYER HEALTH: ${health.overallLevel}\n`;
  output += '═'.repeat(70) + '\n\n';

  output += `Overall Health: ${(health.overall * 100).toFixed(0)}%\n\n`;

  // Pillar breakdown
  output += 'Pillars:\n';
  for (const pillar of health.pillars) {
    const icon = PILLAR_ICONS[pillar.pillar];
    const bar = generateHealthBar(pillar.health);
    output += `  ${icon} ${pillar.pillar.padEnd(6)} ${bar} ${(pillar.health * 100).toFixed(0)}%\n`;
    output += `     APIs: ${pillar.apisActive}/${pillar.apisTotal} | Top: ${pillar.topFramework}\n`;
  }

  output += '\n' + '─'.repeat(70) + '\n';

  // System status
  output += 'System Status:\n';
  output += `  Learning Loop: ${health.learningLoopActive ? '✅ Active' : '❌ Inactive'} (${health.learningLoopStage})\n`;
  output += `  Knowledge Sources: ${health.knowledgeSourcesActive}/${health.knowledgeSources} active\n`;
  output += `  Council Profiles: ${health.councilProfilesLoaded} loaded\n`;
  output += `  Last Updated: ${formatDate(health.lastUpdated)}\n`;

  output += '═'.repeat(70) + '\n';

  return output;
}

function generateHealthBar(value: number): string {
  const filled = Math.round(value * 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  InsightBlock,
  Pillar,
  LearningProgress,
  CognitiveHealth,
  PillarHealth,
};
