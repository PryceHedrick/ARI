/**
 * Transfer Learning Detection
 *
 * Suggests how a learned principle applies across domains.
 */

export interface TransferOpportunity {
  sourceConcept: string;
  sourceDomain: string;
  targetDomain: string;
  corePrinciple: string;
  application: string;
  confidence: number;
}

export function detectTransferOpportunities(concept: string): TransferOpportunity[] {
  const c = concept.toLowerCase();

  if (c.includes('test-driven') || c.includes('tdd')) {
    return [
      {
        sourceConcept: 'Test-Driven Development',
        sourceDomain: 'Software Engineering',
        targetDomain: 'Projects',
        corePrinciple: 'Define success criteria before execution',
        application: 'Write “done” criteria before starting the work; validate against it continuously.',
        confidence: 0.85,
      },
      {
        sourceConcept: 'Test-Driven Development',
        sourceDomain: 'Software Engineering',
        targetDomain: 'Health',
        corePrinciple: 'Define measurable outcomes before acting',
        application: 'Set metrics (steps, calories, weight) before changing routines; check daily/weekly.',
        confidence: 0.8,
      },
    ];
  }

  if (c.includes('bayes') || c.includes('bayesian')) {
    return [
      {
        sourceConcept: 'Bayesian Updating',
        sourceDomain: 'Reasoning',
        targetDomain: 'Investing',
        corePrinciple: 'Update beliefs incrementally as evidence arrives',
        application: 'Adjust conviction based on new evidence; avoid all-or-nothing belief flips.',
        confidence: 0.8,
      },
    ];
  }

  if (c.includes('kelly')) {
    return [
      {
        sourceConcept: 'Kelly Criterion',
        sourceDomain: 'Finance',
        targetDomain: 'Career',
        corePrinciple: 'Size bets based on edge and uncertainty',
        application: 'Invest more time in high-edge skills; cap downside with small experiments first.',
        confidence: 0.75,
      },
    ];
  }

  return [];
}

