/**
 * Worked Examples
 *
 * A worked example reduces extraneous load by showing a complete path once,
 * then letting the learner practice variations.
 */

export interface WorkedExample {
  concept: string;
  problem: string;
  steps: string[];
  solution: string;
}

export function createWorkedExample(input: WorkedExample): string {
  const lines: string[] = [];
  lines.push(`Worked example: ${input.concept}`);
  lines.push('');
  lines.push(`Problem: ${input.problem}`);
  lines.push('');
  lines.push('Steps:');
  input.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push('');
  lines.push(`Solution: ${input.solution}`);
  return lines.join('\n');
}

