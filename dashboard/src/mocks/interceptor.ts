// Mock fetch interceptor for ARI Dashboard
// Intercepts /api/* requests and returns mock data when the backend is offline

import * as mock from './data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResolver = () => any;

// Map endpoint patterns to mock data
const mockRoutes: Array<[RegExp, MockResolver]> = [
  // Health
  [/^\/api\/health\/detailed$/, () => mock.detailedHealth],
  [/^\/api\/health$/, () => mock.health],

  // Agents
  [/^\/api\/agents$/, () => mock.agents],
  [/^\/api\/agents\/[^/]+\/stats$/, () => ({
    agentId: 'agt-core-001', type: 'CORE', tasksCompleted: 1247,
    tasksInProgress: 3, tasksFailed: 2, averageTaskDuration: 1200,
    lastActive: new Date().toISOString(), uptime: 847293,
  })],

  // Governance
  [/^\/api\/proposals$/, () => mock.proposals],
  [/^\/api\/proposals\/[^/]+$/, () => mock.proposals[0]],
  [/^\/api\/governance\/rules$/, () => mock.governanceRules],
  [/^\/api\/governance\/gates$/, () => mock.qualityGates],
  [/^\/api\/governance\/dissent-reports$/, () => mock.dissentReports],
  [/^\/api\/governance\/emergency-votes$/, () => mock.emergencyVotes],
  [/^\/api\/governance\/pending-feedback$/, () => mock.pendingFeedback],
  [/^\/api\/governance\/feedback-stats$/, () => mock.feedbackStats],

  // Memory
  [/^\/api\/memory(\?.*)?$/, () => mock.memories],
  [/^\/api\/memory\/[^/]+$/, () => mock.memories[0]],

  // Audit
  [/^\/api\/audit\/verify$/, () => mock.auditVerification],
  [/^\/api\/audit(\?.*)?$/, () => mock.auditLog],

  // Tools
  [/^\/api\/tools$/, () => mock.tools],

  // Contexts
  [/^\/api\/contexts\/active$/, () => mock.contexts[0]],
  [/^\/api\/contexts$/, () => mock.contexts],

  // Scheduler
  [/^\/api\/scheduler\/status$/, () => mock.schedulerStatus],
  [/^\/api\/scheduler\/tasks$/, () => mock.scheduledTasks],

  // Subagents
  [/^\/api\/subagents\/stats$/, () => mock.subagentStats],
  [/^\/api\/subagents$/, () => mock.subagents],
  [/^\/api\/subagents\/[^/]+$/, () => mock.subagents[0]],

  // System
  [/^\/api\/system\/metrics$/, () => mock.systemMetrics],

  // Cognition
  [/^\/api\/cognition\/health$/, () => mock.cognitiveHealth],
  [/^\/api\/cognition\/pillars$/, () => mock.cognitivePillars],
  [/^\/api\/cognition\/sources$/, () => mock.cognitiveSources],
  [/^\/api\/cognition\/council-profiles\/[^/]+$/, () => mock.councilProfiles[0]],
  [/^\/api\/cognition\/council-profiles$/, () => mock.councilProfiles],
  [/^\/api\/cognition\/learning\/status$/, () => mock.learningStatus],
  [/^\/api\/cognition\/learning\/analytics(\?.*)?$/, () => mock.learningAnalytics],
  [/^\/api\/cognition\/learning\/calibration$/, () => ({
    overconfidenceBias: 0.08, underconfidenceBias: -0.03,
    calibrationCurve: [
      { confidenceBucket: '0-20%', statedConfidence: 0.1, actualAccuracy: 0.12, delta: 0.02, count: 5 },
      { confidenceBucket: '20-40%', statedConfidence: 0.3, actualAccuracy: 0.28, delta: -0.02, count: 8 },
      { confidenceBucket: '40-60%', statedConfidence: 0.5, actualAccuracy: 0.47, delta: -0.03, count: 15 },
      { confidenceBucket: '60-80%', statedConfidence: 0.7, actualAccuracy: 0.63, delta: -0.07, count: 22 },
      { confidenceBucket: '80-100%', statedConfidence: 0.9, actualAccuracy: 0.82, delta: -0.08, count: 30 },
    ],
    predictions: [],
  })],
  [/^\/api\/cognition\/frameworks\/usage$/, () => mock.frameworkUsage],
  [/^\/api\/cognition\/insights(\?.*)?$/, () => mock.cognitiveInsights],

  // Budget
  [/^\/api\/budget\/status$/, () => mock.budgetStatus],
  [/^\/api\/budget\/page-status$/, () => mock.budgetPageStatus],
  [/^\/api\/budget\/state$/, () => mock.budgetState],
  [/^\/api\/budget\/profile$/, () => ({ success: true, profile: 'balanced' })],

  // Billing
  [/^\/api\/billing\/cycle$/, () => mock.billingCycle],

  // Value Analytics
  [/^\/api\/analytics\/value\/today$/, () => mock.valueToday],
  [/^\/api\/analytics\/value\/daily(\?.*)?$/, () => mock.valueAnalytics.days],
  [/^\/api\/analytics\/value\/weekly$/, () => ({
    weekStart: mock.valueAnalytics.days[0].date,
    weekEnd: mock.valueAnalytics.days[6].date,
    totalCost: mock.valueAnalytics.totalCost,
    totalValuePoints: mock.valueAnalytics.totalValuePoints,
    averageScore: mock.valueAnalytics.averageValueScore,
    bestDay: null, worstDay: null,
    trend: 'improving',
    recommendations: mock.valueAnalytics.recommendations,
    costBreakdown: [
      { category: 'code-generation', cost: 5.12, percentage: 39.9 },
      { category: 'analysis', cost: 3.52, percentage: 27.4 },
      { category: 'review', cost: 2.57, percentage: 20.0 },
      { category: 'simple-query', cost: 1.63, percentage: 12.7 },
    ],
  })],
  [/^\/api\/analytics\/value$/, () => mock.valueAnalytics],

  // Adaptive
  [/^\/api\/adaptive\/patterns$/, () => mock.adaptivePatterns],
  [/^\/api\/adaptive\/recommendations$/, () => mock.adaptiveRecommendations],
  [/^\/api\/adaptive\/summaries$/, () => mock.adaptiveSummaries],
  [/^\/api\/adaptive\/peak-hours$/, () => ({ hours: [9, 10, 11, 14, 15] })],

  // E2E
  [/^\/api\/e2e\/runs$/, () => mock.e2eRuns],

  // Alerts
  [/^\/api\/alerts\/summary$/, () => mock.alertSummary],
  [/^\/api\/alerts(\?.*)?$/, () => mock.alerts],

  // Approval Queue
  [/^\/api\/approval-queue$/, () => mock.approvalQueue],
];

function findMockData(url: string): unknown | undefined {
  // Extract the path portion (remove origin if present)
  const path = url.startsWith('http') ? new URL(url).pathname + new URL(url).search : url;

  for (const [pattern, resolver] of mockRoutes) {
    if (pattern.test(path)) {
      return resolver();
    }
  }
  return undefined;
}

const originalFetch = window.fetch.bind(window);
let mockActive = false;

export function enableMockInterceptor(): void {
  if (mockActive) return;
  mockActive = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

    // Only intercept /api/* requests
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }

    // Try the real server first
    try {
      const response = await originalFetch(input, init);
      if (response.ok) {
        return response;
      }
      throw new Error(`API error: ${response.status}`);
    } catch {
      // Backend unreachable — use mock data
      const data = findMockData(url);
      if (data !== undefined) {
        console.debug(`[ARI Mock] ${init?.method || 'GET'} ${url}`);
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // No mock data for this endpoint — return empty success for POSTs, throw for GETs
      if (init?.method === 'POST' || init?.method === 'DELETE') {
        console.debug(`[ARI Mock] ${init.method} ${url} → default success`);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.warn(`[ARI Mock] No mock data for: ${url}`);
      return new Response(JSON.stringify({ error: 'No mock data available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };

  console.info(
    '%c[ARI] Mock mode active — using demo data',
    'color: #a78bfa; font-weight: bold;',
  );
}
