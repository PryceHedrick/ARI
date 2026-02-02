/**
 * Chart Generator — ASCII/Unicode visualizations
 *
 * Creates beautiful text-based charts that work everywhere:
 * - CLI output
 * - Dashboard
 * - Markdown files
 * - Log files
 * - Claude Code responses
 *
 * All charts are designed for instant comprehension.
 */

import { renderMiniGauge, type NormalizedMetric } from './normalizer.js';

// ═══════════════════════════════════════════════════════════════════════════════
// GAUGE CHARTS — Show single metric scores
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render a large decorated gauge for a single metric
 */
export function renderDecoratedGauge(metric: NormalizedMetric): string {
  const lines: string[] = [];
  const width = 50;

  // Header
  lines.push(`┌${'─'.repeat(width)}┐`);
  lines.push(`│ ${metric.name.padEnd(width - 2)} │`);
  lines.push(`├${'─'.repeat(width)}┤`);

  // Score gauge
  const gaugeWidth = 40;
  const position = Math.round((metric.score / 10) * gaugeWidth);
  const filled = '█'.repeat(position);
  const empty = '░'.repeat(gaugeWidth - position);
  const emoji = metric.score >= 7 ? '🟢' : metric.score >= 5 ? '🟡' : '🔴';

  lines.push(`│ ${emoji} [${filled}${empty}] ${metric.score.toFixed(1)}/10 │`);

  // Category and traffic light
  const categoryLine = `  ${metric.category} — ${metric.trafficLight}`;
  lines.push(`│${categoryLine.padEnd(width)}│`);

  // Comparable
  if (metric.comparable) {
    const comparableLine = `  ≈ ${metric.comparable.slice(0, width - 6)}`;
    lines.push(`│${comparableLine.padEnd(width)}│`);
  }

  lines.push(`└${'─'.repeat(width)}┘`);

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON CHARTS — Compare multiple metrics side-by-side
// ═══════════════════════════════════════════════════════════════════════════════

export interface ComparisonItem {
  name: string;
  score: number;
}

/**
 * Render a side-by-side comparison of multiple metrics
 */
export function renderComparison(items: ComparisonItem[], opts?: { width?: number }): string {
  const width = opts?.width ?? 30;
  const barWidth = width - 10; // Leave room for label and score

  const lines: string[] = [];

  for (const item of items) {
    const emoji = item.score >= 7 ? '🟢' : item.score >= 5 ? '🟡' : '🔴';
    const filled = Math.round((item.score / 10) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
    const nameStr = item.name.slice(0, 15).padEnd(15);
    lines.push(`${nameStr} ${emoji} ${bar} ${item.score.toFixed(1)}`);
  }

  return lines.join('\n');
}

/**
 * Render pillar comparison (LOGOS vs ETHOS vs PATHOS)
 */
export function renderPillarComparison(logos: number, ethos: number, pathos: number): string {
  const width = 25;

  const renderBar = (score: number, color: string): string => {
    const filled = Math.round((score / 10) * width);
    return `${color}${'█'.repeat(filled)}${'░'.repeat(width - filled)} ${score.toFixed(1)}/10`;
  };

  return [
    `LOGOS  🧠 ${renderBar(logos, '')}`,
    `ETHOS  ❤️ ${renderBar(ethos, '')}`,
    `PATHOS 🌱 ${renderBar(pathos, '')}`,
  ].join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPARKLINE — Inline trend visualization
// ═══════════════════════════════════════════════════════════════════════════════

const SPARKLINE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * Render a sparkline for a series of values
 */
export function renderSparkline(values: number[], opts?: { showTrend?: boolean }): string {
  if (values.length === 0) return '';
  if (values.length === 1) return SPARKLINE_CHARS[Math.floor(values[0] / 12.5 * 7)];

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const line = values.map(v => {
    const normalized = (v - min) / range;
    const index = Math.min(7, Math.floor(normalized * 8));
    return SPARKLINE_CHARS[index];
  }).join('');

  if (opts?.showTrend !== false) {
    const first = values[0];
    const last = values[values.length - 1];
    const trend = last > first ? '↗' : last < first ? '↘' : '→';
    const change = ((last - first) / first * 100).toFixed(0);
    return `${line} ${trend} ${change}%`;
  }

  return line;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION CHARTS — Show probability/frequency distributions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render a horizontal histogram
 */
export function renderHistogram(
  data: Array<{ label: string; value: number }>,
  opts?: { width?: number; showPercent?: boolean }
): string {
  const width = opts?.width ?? 30;
  const maxValue = Math.max(...data.map(d => d.value));

  const lines: string[] = [];

  for (const item of data) {
    const normalizedWidth = Math.round((item.value / maxValue) * width);
    const bar = '█'.repeat(normalizedWidth);
    const label = item.label.slice(0, 12).padEnd(12);
    const valueStr = opts?.showPercent
      ? `${(item.value * 100).toFixed(0)}%`
      : item.value.toFixed(1);
    lines.push(`${label} ${bar.padEnd(width)} ${valueStr}`);
  }

  return lines.join('\n');
}

/**
 * Render outcome probabilities
 */
export function renderOutcomes(
  outcomes: Array<{ label: string; probability: number; value: number }>
): string {
  const lines: string[] = [];

  for (const outcome of outcomes) {
    const prob = (outcome.probability * 100).toFixed(0);
    const bar = '█'.repeat(Math.round(outcome.probability * 20));
    const emoji = outcome.value >= 0 ? '✅' : '❌';
    const sign = outcome.value >= 0 ? '+' : '';
    lines.push(`${emoji} ${prob.padStart(3)}% ${bar.padEnd(20)} ${sign}$${outcome.value}`);
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECISION TREE — Visualize decision paths
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChartDecisionNode {
  label: string;
  probability?: number;
  value?: number;
  children?: ChartDecisionNode[];
}

/**
 * Render a decision tree
 */
export function renderDecisionTree(root: ChartDecisionNode, depth = 0): string {
  const lines: string[] = [];
  const indent = '    '.repeat(depth);
  const prefix = depth === 0 ? '' : (depth === 1 ? '├── ' : '│   ');

  let label = root.label;
  if (root.probability !== undefined) {
    label += ` (${(root.probability * 100).toFixed(0)}%)`;
  }
  if (root.value !== undefined) {
    const sign = root.value >= 0 ? '+' : '';
    const emoji = root.value >= 0 ? '✅' : '❌';
    label += ` → ${emoji} ${sign}$${root.value}`;
  }

  lines.push(`${indent}${prefix}${label}`);

  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      const isLast = i === root.children.length - 1;
      const childLines = renderDecisionTreeNode(child, depth + 1, isLast);
      lines.push(...childLines);
    }
  }

  return lines.join('\n');
}

function renderDecisionTreeNode(node: ChartDecisionNode, depth: number, isLast: boolean): string[] {
  const lines: string[] = [];
  const indent = '    '.repeat(depth - 1) + (isLast ? '└── ' : '├── ');

  let label = node.label;
  if (node.probability !== undefined) {
    label += ` (${(node.probability * 100).toFixed(0)}%)`;
  }
  if (node.value !== undefined) {
    const sign = node.value >= 0 ? '+' : '';
    const emoji = node.value >= 0 ? '✅' : '❌';
    label += ` → ${emoji} ${sign}$${node.value}`;
  }

  lines.push(`${indent}${label}`);

  if (node.children) {
    const childIndent = '    '.repeat(depth - 1) + (isLast ? '    ' : '│   ');
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childIsLast = i === node.children.length - 1;
      const childPrefix = childIsLast ? '└── ' : '├── ';

      let childLabel = child.label;
      if (child.probability !== undefined) {
        childLabel += ` (${(child.probability * 100).toFixed(0)}%)`;
      }
      if (child.value !== undefined) {
        const sign = child.value >= 0 ? '+' : '';
        const emoji = child.value >= 0 ? '✅' : '❌';
        childLabel += ` → ${emoji} ${sign}$${child.value}`;
      }

      lines.push(`${childIndent}${childPrefix}${childLabel}`);
    }
  }

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BARS — Show completion/progress
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render a styled progress bar
 */
export function renderStyledProgressBar(
  current: number,
  max: number,
  opts?: { width?: number; label?: string; showPercent?: boolean }
): string {
  const width = opts?.width ?? 30;
  const percent = Math.min(100, Math.max(0, (current / max) * 100));
  const filled = Math.round((percent / 100) * width);

  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const percentStr = opts?.showPercent !== false ? ` ${percent.toFixed(0)}%` : '';
  const label = opts?.label ? `${opts.label}: ` : '';

  return `${label}[${bar}]${percentStr}`;
}

/**
 * Render a learning progress bar with stages
 */
export function renderLearningProgress(
  stage: 'PERFORMANCE_REVIEW' | 'GAP_ANALYSIS' | 'SOURCE_DISCOVERY' | 'KNOWLEDGE_INTEGRATION' | 'SELF_ASSESSMENT'
): string {
  const stages = [
    { id: 'PERFORMANCE_REVIEW', icon: '📊', name: 'Review' },
    { id: 'GAP_ANALYSIS', icon: '🔍', name: 'Gaps' },
    { id: 'SOURCE_DISCOVERY', icon: '📚', name: 'Discover' },
    { id: 'KNOWLEDGE_INTEGRATION', icon: '🧩', name: 'Integrate' },
    { id: 'SELF_ASSESSMENT', icon: '📝', name: 'Assess' },
  ];

  const currentIndex = stages.findIndex(s => s.id === stage);

  return stages.map((s, i) => {
    if (i < currentIndex) return `✅ ${s.icon}`;
    if (i === currentIndex) return `🔄 ${s.icon}`;
    return `⬜ ${s.icon}`;
  }).join(' → ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATION BOX — Clear DO/DON'T display
// ═══════════════════════════════════════════════════════════════════════════════

export interface RecommendationData {
  action: 'DO' | 'DONT' | 'CAUTION';
  statement: string;
  reasons: string[];
  alternatives?: string[];
  overallScore: number;
}

/**
 * Render a recommendation box with clear action
 */
export function renderRecommendation(data: RecommendationData): string {
  const width = 60;
  const lines: string[] = [];

  // Action banner
  const actionEmoji = data.action === 'DO' ? '✅' : data.action === 'DONT' ? '❌' : '⚠️';
  const actionWord = data.action === 'DO' ? 'PROCEED' : data.action === 'DONT' ? 'DO NOT PROCEED' : 'PROCEED WITH CAUTION';
  const actionColor = data.action === 'DO' ? '🟢' : data.action === 'DONT' ? '🔴' : '🟡';

  lines.push(`╔${'═'.repeat(width)}╗`);
  lines.push(`║ ${actionColor} ${actionEmoji} ${actionWord.padEnd(width - 8)} ║`);
  lines.push(`╠${'═'.repeat(width)}╣`);

  // Statement
  const statementLines = wrapText(data.statement, width - 4);
  for (const line of statementLines) {
    lines.push(`║  ${line.padEnd(width - 2)} ║`);
  }

  // Score gauge
  lines.push(`╟${'─'.repeat(width)}╢`);
  const gauge = renderMiniGauge(data.overallScore);
  lines.push(`║  Overall: ${gauge.padEnd(width - 12)} ║`);

  // Reasons
  if (data.reasons.length > 0) {
    lines.push(`╟${'─'.repeat(width)}╢`);
    lines.push(`║  Reasoning:${' '.repeat(width - 13)} ║`);
    for (const reason of data.reasons.slice(0, 4)) {
      const reasonLine = `    ${reason}`.slice(0, width - 2);
      lines.push(`║${reasonLine.padEnd(width)} ║`);
    }
  }

  // Alternatives (if DON'T)
  if (data.action === 'DONT' && data.alternatives && data.alternatives.length > 0) {
    lines.push(`╟${'─'.repeat(width)}╢`);
    lines.push(`║  Instead, consider:${' '.repeat(width - 21)} ║`);
    for (const alt of data.alternatives.slice(0, 3)) {
      const altLine = `    • ${alt}`.slice(0, width - 2);
      lines.push(`║${altLine.padEnd(width)} ║`);
    }
  }

  lines.push(`╚${'═'.repeat(width)}╝`);

  return lines.join('\n');
}

/**
 * Wrap text to fit width
 */
function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE ANALYSIS — Full multi-pillar view
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnalysisData {
  title: string;
  pillar: 'LOGOS' | 'ETHOS' | 'PATHOS' | 'MULTI';
  metrics: NormalizedMetric[];
  recommendation: RecommendationData;
}

/**
 * Render a comprehensive analysis block
 */
export function renderAnalysis(data: AnalysisData): string {
  const width = 70;
  const lines: string[] = [];

  const pillarEmoji = {
    LOGOS: '🧠',
    ETHOS: '❤️',
    PATHOS: '🌱',
    MULTI: '🎯',
  }[data.pillar];

  // Header
  lines.push('═'.repeat(width));
  lines.push(`${pillarEmoji} ${data.pillar}: ${data.title}`);
  lines.push('═'.repeat(width));
  lines.push('');

  // Metrics comparison
  if (data.metrics.length > 0) {
    lines.push('📊 Metric Breakdown');
    lines.push('─'.repeat(width));
    lines.push(renderComparison(
      data.metrics.map(m => ({ name: m.name, score: m.score })),
      { width: 50 }
    ));
    lines.push('');
  }

  // Recommendation
  lines.push(renderRecommendation(data.recommendation));
  lines.push('');

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK STATUS — One-line summaries for inline display
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render a quick inline status
 */
export function renderQuickStatus(metrics: NormalizedMetric[]): string {
  return metrics.map(m => `${m.name}: ${renderMiniGauge(m.score)}`).join(' | ');
}

/**
 * Render agent activity status
 */
export function renderAgentStatus(
  agent: string,
  status: 'idle' | 'working' | 'complete' | 'error',
  task?: string
): string {
  const statusEmoji = {
    idle: '💤',
    working: '⚡',
    complete: '✅',
    error: '❌',
  }[status];

  const spinner = status === 'working' ? '▓░░' : '';
  const taskStr = task ? ` — ${task.slice(0, 40)}` : '';

  return `${statusEmoji} ${agent}${spinner}${taskStr}`;
}

/**
 * Render code edit status
 */
export function renderEditStatus(
  file: string,
  action: 'reading' | 'writing' | 'editing' | 'complete',
  progress?: number
): string {
  const actionEmoji = {
    reading: '📖',
    writing: '✍️',
    editing: '✏️',
    complete: '✅',
  }[action];

  const progressBar = progress !== undefined
    ? ` [${renderStyledProgressBar(progress, 100, { width: 10, showPercent: false })}]`
    : '';

  return `${actionEmoji} ${action.toUpperCase()} ${file}${progressBar}`;
}
