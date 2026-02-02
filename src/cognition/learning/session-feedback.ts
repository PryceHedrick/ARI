/**
 * Session Feedback
 *
 * Generates a post-session summary that is dual-coded (numbers + visual bars).
 */

import type { PracticeSession, SkillProficiency } from './practice-tracker.js';
import { analyzeWeaknesses } from './weakness-analyzer.js';
import { renderProgressBar } from '../ux/visual-encoder.js';

export function formatPracticeSessionReview(params: {
  skill: SkillProficiency;
  session: PracticeSession;
}): string {
  const { skill, session } = params;

  const completedPct = session.tasksPlanned > 0 ? (session.tasksCompleted / session.tasksPlanned) : 1;
  const completionBar = renderProgressBar(completedPct * 100, { min: 0, max: 100, width: 20 });

  const durationMinutes = Math.max(0, (session.endedAt.getTime() - session.startedAt.getTime()) / 60000);
  const timeEff =
    session.estimatedMinutes && session.actualMinutes
      ? session.actualMinutes / Math.max(1, session.estimatedMinutes)
      : session.plannedMinutes > 0
        ? durationMinutes / session.plannedMinutes
        : 1;

  const timeEffPct = Math.min(200, Math.max(0, timeEff * 100));
  const timeBar = renderProgressBar(timeEffPct, { min: 0, max: 200, width: 20 });

  const levelBar = renderProgressBar(skill.currentLevel, { min: 0, max: 100, width: 30 });

  const weaknesses = analyzeWeaknesses(session.errorPatterns).slice(0, 3);

  const lines: string[] = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('🎯 Practice Session Review');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`Skill: ${skill.skill}`);
  lines.push(`Session: ${Math.round(durationMinutes)} minutes (planned ${session.plannedMinutes}m)`);
  lines.push(`Completed: ${session.tasksCompleted}/${session.tasksPlanned} (${(completedPct * 100).toFixed(0)}%)`);
  lines.push(`Progress: ${completionBar} ${(completedPct * 100).toFixed(0)}/100`);
  lines.push('');
  lines.push(`Time efficiency (actual / planned): ${(timeEff * 100).toFixed(0)}%`);
  lines.push(`Visual: ${timeBar} ${(timeEffPct).toFixed(0)}/200`);
  lines.push('');
  lines.push(`Skill level: ${skill.currentLevel.toFixed(0)}/100 → target ${skill.targetLevel}/100`);
  lines.push(`${levelBar} ${skill.currentLevel.toFixed(0)}/100`);
  lines.push('');
  if (weaknesses.length > 0) {
    lines.push('Weaknesses to work on:');
    for (const w of weaknesses) {
      lines.push(`- ${w.pattern} (x${w.frequency})`);
      lines.push(`  ↳ ${w.recommendation}`);
    }
    lines.push('');
  }
  lines.push(`Next: Aim for ${Math.min(100, Math.round(skill.currentLevel + 10))}/100 difficulty tasks (≈10% harder).`);
  return lines.join('\n');
}

