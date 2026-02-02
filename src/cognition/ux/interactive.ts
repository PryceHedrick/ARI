/**
 * Cognition UX — Interactive Explanations
 *
 * Produces step-through explanations suitable for chat/CLI.
 */

export interface ExplanationStep {
  title: string;
  body: string | string[];
}

export function buildStepThroughExplanation(title: string, steps: ExplanationStep[]): string {
  const lines: string[] = [];
  lines.push(title);
  lines.push('');

  steps.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.title}`);
    if (Array.isArray(s.body)) {
      for (const line of s.body) lines.push(`   - ${line}`);
    } else {
      lines.push(`   ${s.body}`);
    }
    lines.push('');
  });

  return lines.join('\n').trim();
}

