import { Command } from 'commander';
import { Gateway } from '../../kernel/gateway.js';

const GATEWAY_URL = 'http://127.0.0.1:3141';

/** Load API key from Keychain for authenticating with the gateway */
function getAuthHeaders(): Record<string, string> {
  try {
    const { key } = Gateway.loadOrCreateApiKey();
    return { 'X-ARI-Key': key };
  } catch {
    return {};
  }
}

// ── Type Definitions ────────────────────────────────────────────────────────

interface BudgetStatusResponse {
  profile?: string;
  throttle?: {
    level: string;
    projectedEOD?: number;
  };
  usage?: {
    percentUsed: number;
    tokensUsed: number;
    tokensRemaining: number;
    costUsed: number;
  };
  budget?: {
    maxTokens: number;
    maxCost: number;
  };
  breakdown?: {
    byTaskType?: Array<{
      taskType: string;
      cost: number;
      percentOfTotal?: number;
    }>;
  };
  date?: string;
}

interface BillingCycleResponse {
  status?: string;
  percentComplete?: number;
  daysElapsed?: number;
  totalSpent?: number;
  projectedTotal?: number;
  recommendation?: string;
  cycle?: {
    totalBudget?: number;
  };
  recommended?: {
    dailyBudget?: number;
    confidence: number;
    reason?: string;
  };
}

interface ValueTodayResponse {
  currentScore?: number;
  breakdown?: string[];
  metrics?: {
    morningBriefDelivered?: boolean;
    eveningSummaryDelivered?: boolean;
    testsGenerated?: number;
    docsWritten?: number;
    bugsFixed?: number;
    initiativesExecuted?: number;
    tasksSucceeded?: number;
    tasksAttempted?: number;
  };
}

interface ValueWeeklyResponse {
  weekStart?: string;
  weekEnd?: string;
  averageScore?: number;
  totalCost?: number;
  trend?: string;
  recommendations?: string[];
}

interface ApprovalItem {
  id: string;
  title: string;
  type: string;
  risk: string;
  estimatedCost?: number;
}

interface ErrorResponse {
  error?: string;
}

// ── ANSI Colors ─────────────────────────────────────────────────────────────

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function progressBar(percent: number, width: number = 30): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  let color: keyof typeof COLORS = 'green';
  if (percent >= 95) color = 'red';
  else if (percent >= 80) color = 'yellow';

  return colorize(bar, color);
}

// ── Command Registration ────────────────────────────────────────────────────

export function registerBudgetCommand(program: Command): void {
  const budget = program
    .command('budget')
    .description('Budget and cost management');

  // ── status ──────────────────────────────────────────────────────────────
  budget
    .command('status')
    .description('Show current budget status')
    .option('--json', 'Output in JSON format')
    .action(async (options: { json?: boolean }) => {
      try {
        const response = await fetch(`${GATEWAY_URL}/api/budget/status`, {
          headers: getAuthHeaders(),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          console.error(colorize('Failed to fetch budget status', 'red'));
          process.exit(1);
        }

        const data = (await response.json()) as BudgetStatusResponse;

        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }

        // Pretty print
        console.log('');
        console.log(colorize('╔═══════════════════════════════════════════════════════╗', 'cyan'));
        console.log(colorize('║           ARI Token Budget Status                      ║', 'cyan'));
        console.log(colorize('╚═══════════════════════════════════════════════════════╝', 'cyan'));
        console.log('');

        // Profile and throttle
        const throttleColor = data.throttle?.level === 'normal' ? 'green' :
          data.throttle?.level === 'warning' ? 'yellow' : 'red';
        console.log(`  Profile:  ${colorize(data.profile ?? 'unknown', 'bold')}`);
        console.log(`  Throttle: ${colorize(data.throttle?.level ?? 'unknown', throttleColor)}`);
        console.log('');

        // Progress bar
        const percent = data.usage?.percentUsed ?? 0;
        console.log(`  Usage:    ${progressBar(percent)} ${percent.toFixed(1)}%`);
        console.log('');

        // Stats
        const tokensUsed = (data.usage?.tokensUsed ?? 0).toLocaleString();
        const tokensRemaining = (data.usage?.tokensRemaining ?? 0).toLocaleString();
        const costUsed = (data.usage?.costUsed ?? 0).toFixed(2);
        const maxTokens = (data.budget?.maxTokens ?? 800000).toLocaleString();
        const maxCost = (data.budget?.maxCost ?? 2.50).toFixed(2);

        console.log(`  Tokens:   ${colorize(tokensUsed, 'bold')} / ${maxTokens}`);
        console.log(`  Cost:     ${colorize('$' + costUsed, 'bold')} / $${maxCost}`);
        console.log(`  Remaining: ${colorize(tokensRemaining + ' tokens', 'dim')}`);
        console.log('');

        // Projected
        if (data.throttle?.projectedEOD) {
          const projected = Math.round(data.throttle.projectedEOD).toLocaleString();
          const overBudget = data.throttle.projectedEOD > (data.budget?.maxTokens ?? 800000);
          console.log(`  Projected EOD: ${colorize(projected + ' tokens', overBudget ? 'red' : 'dim')}`);
          if (overBudget) {
            console.log(colorize('  ⚠ Warning: Projected to exceed budget', 'yellow'));
          }
        }
        console.log('');

        // Top consumers
        if (data.breakdown?.byTaskType && data.breakdown.byTaskType.length > 0) {
          console.log(colorize('  Top Consumers:', 'dim'));
          for (const item of data.breakdown.byTaskType.slice(0, 5)) {
            const pct = (item.percentOfTotal ?? 0).toFixed(1);
            console.log(`    • ${item.taskType}: $${item.cost.toFixed(3)} (${pct}%)`);
          }
          console.log('');
        }

        console.log(colorize(`  Resets at midnight (${data.date ?? 'today'})`, 'gray'));
        console.log('');

      } catch {
        console.error(colorize('Error: Gateway not reachable. Is the daemon running?', 'red'));
        console.error(colorize('Run: npx ari daemon start', 'dim'));
        process.exit(1);
      }
    });

  // ── profile ──────────────────────────────────────────────────────────────
  budget
    .command('profile [name]')
    .description('Get or set budget profile (conservative, balanced, aggressive)')
    .action(async (name?: string) => {
      try {
        if (!name) {
          // Get current profile
          const response = await fetch(`${GATEWAY_URL}/api/budget/status`, {
            headers: getAuthHeaders(),
            signal: AbortSignal.timeout(5000),
          });
          const data = (await response.json()) as BudgetStatusResponse;
          console.log(`Current profile: ${colorize(data.profile ?? 'unknown', 'bold')}`);
          console.log('');
          console.log('Available profiles:');
          console.log('  • conservative - $1.50/day, 500K tokens, essential tasks only');
          console.log('  • balanced     - $2.50/day, 800K tokens, standard operations');
          console.log('  • aggressive   - $5.00/day, 1.5M tokens, full autonomous mode');
          return;
        }

        if (!['conservative', 'balanced', 'aggressive'].includes(name)) {
          console.error(colorize(`Invalid profile: ${name}`, 'red'));
          console.error('Valid profiles: conservative, balanced, aggressive');
          process.exit(1);
        }

        const response = await fetch(`${GATEWAY_URL}/api/budget/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ profile: name }),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ErrorResponse;
          console.error(colorize(`Failed to switch profile: ${errorData.error ?? 'Unknown error'}`, 'red'));
          process.exit(1);
        }

        console.log(colorize(`✓ Switched to ${name} profile`, 'green'));

      } catch {
        console.error(colorize('Error: Gateway not reachable', 'red'));
        process.exit(1);
      }
    });

  // ── cycle ──────────────────────────────────────────────────────────────
  budget
    .command('cycle')
    .description('Show billing cycle status ($75/14 days)')
    .option('--json', 'Output in JSON format')
    .action(async (options: { json?: boolean }) => {
      try {
        const response = await fetch(`${GATEWAY_URL}/api/billing/cycle`, {
          headers: getAuthHeaders(),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          console.error(colorize('Failed to fetch billing cycle', 'red'));
          process.exit(1);
        }

        const data = (await response.json()) as BillingCycleResponse;

        if (options.json) {
          console.log(JSON.stringify(data, null, 2));
          return;
        }

        console.log('');
        console.log(colorize('╔═══════════════════════════════════════════════════════╗', 'blue'));
        console.log(colorize('║           Billing Cycle ($75 / 14 days)                ║', 'blue'));
        console.log(colorize('╚═══════════════════════════════════════════════════════╝', 'blue'));
        console.log('');

        // Status
        const statusColor = data.status === 'on_track' || data.status === 'under_budget' ? 'green' :
          data.status === 'at_risk' ? 'yellow' : 'red';
        const statusDisplay = data.status?.replace('_', ' ') ?? 'unknown';
        console.log(`  Status: ${colorize(statusDisplay, statusColor)}`);
        console.log('');

        // Time progress
        const timePercent = data.percentComplete ?? 0;
        console.log(`  Time:   Day ${data.daysElapsed ?? 0} of 14`);
        console.log(`          ${progressBar(timePercent, 20)} ${timePercent.toFixed(0)}%`);
        console.log('');

        // Spend progress
        const totalBudget = data.cycle?.totalBudget ?? 75;
        const totalSpent = data.totalSpent ?? 0;
        const spendPercent = (totalSpent / totalBudget) * 100;
        console.log(`  Spent:  $${totalSpent.toFixed(2)} / $${totalBudget.toFixed(2)}`);
        console.log(`          ${progressBar(spendPercent, 20)} ${spendPercent.toFixed(0)}%`);
        console.log('');

        // Projected
        if (data.projectedTotal !== undefined) {
          const projected = data.projectedTotal.toFixed(2);
          const overBudget = data.projectedTotal > totalBudget;
          console.log(`  Projected: $${colorize(projected, overBudget ? 'red' : 'dim')}`);
          if (overBudget) {
            const overBy = (data.projectedTotal - totalBudget).toFixed(2);
            console.log(colorize(`  ⚠ Over budget by $${overBy}`, 'yellow'));
          }
        }
        console.log('');

        // Recommendation
        if (data.recommendation) {
          console.log(colorize('  Recommendation:', 'dim'));
          console.log(`  ${data.recommendation}`);
        }
        console.log('');

        // Daily recommendation
        if (data.recommended) {
          console.log(colorize('  Recommended Daily Budget:', 'dim'));
          const dailyBudget = data.recommended.dailyBudget?.toFixed(2) ?? '5.36';
          const confidence = (data.recommended.confidence * 100).toFixed(0);
          console.log(`  $${dailyBudget} (${confidence}% confidence)`);
          if (data.recommended.reason) {
            console.log(`  ${colorize(data.recommended.reason, 'gray')}`);
          }
        }
        console.log('');

      } catch {
        console.error(colorize('Error: Gateway not reachable', 'red'));
        process.exit(1);
      }
    });

  // ── value ──────────────────────────────────────────────────────────────
  budget
    .command('value')
    .description('Show today\'s value score and analytics')
    .option('--json', 'Output in JSON format')
    .option('--weekly', 'Show weekly report')
    .action(async (options: { json?: boolean; weekly?: boolean }) => {
      try {
        const endpoint = options.weekly ? '/api/analytics/value/weekly' : '/api/analytics/value/today';
        const response = await fetch(`${GATEWAY_URL}${endpoint}`, {
          headers: getAuthHeaders(),
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          console.error(colorize('Failed to fetch value analytics', 'red'));
          process.exit(1);
        }

        if (options.json) {
          const data = (await response.json()) as unknown;
          console.log(JSON.stringify(data, null, 2));
          return;
        }

        if (options.weekly) {
          const data = (await response.json()) as ValueWeeklyResponse;

          // Weekly report
          console.log('');
          console.log(colorize('╔═══════════════════════════════════════════════════════╗', 'green'));
          console.log(colorize('║           Weekly Value Report                          ║', 'green'));
          console.log(colorize('╚═══════════════════════════════════════════════════════╝', 'green'));
          console.log('');

          console.log(`  Period: ${data.weekStart ?? 'N/A'} to ${data.weekEnd ?? 'N/A'}`);
          const avgScore = data.averageScore?.toFixed(0) ?? '0';
          console.log(`  Average Score: ${colorize(avgScore + '/100', 'bold')}`);
          console.log(`  Total Cost: $${(data.totalCost ?? 0).toFixed(2)}`);
          const trendColor = data.trend === 'improving' ? 'green' : data.trend === 'declining' ? 'yellow' : 'dim';
          console.log(`  Trend: ${colorize(data.trend ?? 'stable', trendColor)}`);
          console.log('');

          if (data.recommendations && data.recommendations.length > 0) {
            console.log(colorize('  Recommendations:', 'dim'));
            for (const rec of data.recommendations) {
              console.log(`    • ${rec}`);
            }
          }
          console.log('');
          return;
        }

        // Today's progress
        const data = (await response.json()) as ValueTodayResponse;

        console.log('');
        console.log(colorize('╔═══════════════════════════════════════════════════════╗', 'green'));
        console.log(colorize('║           Today\'s Value Score                          ║', 'green'));
        console.log(colorize('╚═══════════════════════════════════════════════════════╝', 'green'));
        console.log('');

        const score = data.currentScore ?? 0;
        const scoreColor = score >= 70 ? 'green' : score >= 50 ? 'yellow' : score >= 30 ? 'blue' : 'red';
        console.log(`  Score: ${colorize(String(score) + '/100', scoreColor)}`);
        console.log('');

        // Breakdown
        if (data.breakdown && data.breakdown.length > 0) {
          console.log(colorize('  Breakdown:', 'dim'));
          for (const item of data.breakdown) {
            console.log(`    ${item}`);
          }
          console.log('');
        }

        // Metrics summary
        const m = data.metrics ?? {};
        console.log(colorize('  Today\'s Activity:', 'dim'));
        if (m.morningBriefDelivered) console.log('    ✓ Morning brief delivered');
        if (m.eveningSummaryDelivered) console.log('    ✓ Evening summary delivered');
        if (m.testsGenerated && m.testsGenerated > 0) console.log(`    ${m.testsGenerated} tests generated`);
        if (m.docsWritten && m.docsWritten > 0) console.log(`    ${m.docsWritten} docs written`);
        if (m.bugsFixed && m.bugsFixed > 0) console.log(`    ${m.bugsFixed} bugs fixed`);
        if (m.initiativesExecuted && m.initiativesExecuted > 0) console.log(`    ${m.initiativesExecuted} initiatives executed`);
        if (m.tasksSucceeded && m.tasksSucceeded > 0) console.log(`    ${m.tasksSucceeded}/${m.tasksAttempted ?? 0} tasks succeeded`);
        console.log('');

      } catch {
        console.error(colorize('Error: Gateway not reachable', 'red'));
        process.exit(1);
      }
    });

  // ── approve ──────────────────────────────────────────────────────────────
  budget
    .command('approve [id]')
    .description('List or approve pending items')
    .option('--all', 'Approve all pending items')
    .action(async (id?: string, options?: { all?: boolean }) => {
      try {
        if (!id && !options?.all) {
          // List pending
          const response = await fetch(`${GATEWAY_URL}/api/approval-queue/pending`, {
            headers: getAuthHeaders(),
            signal: AbortSignal.timeout(5000),
          });
          const pending = (await response.json()) as ApprovalItem[];

          if (!Array.isArray(pending) || pending.length === 0) {
            console.log(colorize('No items pending approval', 'green'));
            return;
          }

          console.log('');
          console.log(colorize('Pending Approval Items:', 'bold'));
          console.log('');
          for (const item of pending) {
            const riskColor = item.risk === 'HIGH' || item.risk === 'CRITICAL' ? 'red' :
              item.risk === 'MEDIUM' ? 'yellow' : 'dim';
            console.log(`  ${colorize(item.id, 'cyan')} [${colorize(item.risk, riskColor)}]`);
            console.log(`    ${item.title}`);
            console.log(`    Type: ${item.type} | Est. Cost: $${(item.estimatedCost ?? 0).toFixed(3)}`);
            console.log('');
          }
          console.log(`Use: npx ari budget approve <id>`);
          return;
        }

        if (id) {
          // Approve single item
          const response = await fetch(`${GATEWAY_URL}/api/approval-queue/${id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ approvedBy: 'cli' }),
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            const errorData = (await response.json()) as ErrorResponse;
            console.error(colorize(`Failed to approve: ${errorData.error ?? 'Unknown error'}`, 'red'));
            process.exit(1);
          }

          console.log(colorize(`✓ Approved ${id}`, 'green'));
        }

      } catch {
        console.error(colorize('Error: Gateway not reachable', 'red'));
        process.exit(1);
      }
    });
}
