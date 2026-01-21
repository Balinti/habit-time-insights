import { DailyMetric, DailyCheckin, ExperimentAnalysis } from './types';

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function bootstrapCI(values: number[], iterations: number = 1000): { lower: number; upper: number } {
  if (values.length === 0) return { lower: 0, upper: 0 };
  if (values.length === 1) return { lower: values[0], upper: values[0] };

  const means: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const sample: number[] = [];
    for (let j = 0; j < values.length; j++) {
      const idx = Math.floor(Math.random() * values.length);
      sample.push(values[idx]);
    }
    means.push(calculateMean(sample));
  }

  means.sort((a, b) => a - b);

  // 95% CI
  const lowerIdx = Math.floor(iterations * 0.025);
  const upperIdx = Math.floor(iterations * 0.975);

  return {
    lower: means[lowerIdx],
    upper: means[upperIdx],
  };
}

export function calculateAdherenceRate(checkins: DailyCheckin[]): number {
  if (checkins.length === 0) return 0;

  const adherentDays = checkins.filter(c => c.adherence === 'yes' || c.adherence === 'partial').length;
  return adherentDays / checkins.length;
}

export function getDayOfWeek(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

export function calculateDayOfWeekPattern(metrics: DailyMetric[]): Record<string, number> {
  const pattern: Record<string, { total: number; count: number }> = {
    Sunday: { total: 0, count: 0 },
    Monday: { total: 0, count: 0 },
    Tuesday: { total: 0, count: 0 },
    Wednesday: { total: 0, count: 0 },
    Thursday: { total: 0, count: 0 },
    Friday: { total: 0, count: 0 },
    Saturday: { total: 0, count: 0 },
  };

  metrics.forEach(m => {
    const day = getDayOfWeek(m.date);
    pattern[day].total += m.focusBlocks;
    pattern[day].count++;
  });

  const result: Record<string, number> = {};
  Object.entries(pattern).forEach(([day, { total, count }]) => {
    result[day] = count > 0 ? total / count : 0;
  });

  return result;
}

export function analyzeExperiment(
  baselineMetrics: DailyMetric[],
  experimentMetrics: DailyMetric[],
  checkins: DailyCheckin[]
): ExperimentAnalysis {
  const baselineValues = baselineMetrics.map(m => m.focusBlocks);
  const experimentValues = experimentMetrics.map(m => m.focusBlocks);

  const baselineMean = calculateMean(baselineValues);
  const experimentMean = calculateMean(experimentValues);
  const lift = experimentMean - baselineMean;

  // Bootstrap CI on the difference
  const diffs: number[] = [];
  for (let i = 0; i < 1000; i++) {
    const baselineSample = baselineValues.length > 0
      ? calculateMean(baselineValues.map(() => baselineValues[Math.floor(Math.random() * baselineValues.length)]))
      : 0;
    const expSample = experimentValues.length > 0
      ? calculateMean(experimentValues.map(() => experimentValues[Math.floor(Math.random() * experimentValues.length)]))
      : 0;
    diffs.push(expSample - baselineSample);
  }

  diffs.sort((a, b) => a - b);
  const ciLower = diffs[Math.floor(diffs.length * 0.025)];
  const ciUpper = diffs[Math.floor(diffs.length * 0.975)];

  const adherenceRate = calculateAdherenceRate(checkins);
  const dayOfWeekPattern = calculateDayOfWeekPattern([...baselineMetrics, ...experimentMetrics]);

  // Decision rules
  let decision: 'keep' | 'drop' | 'retest';
  if (lift >= 0.3 && ciLower > 0 && adherenceRate >= 0.7) {
    decision = 'keep';
  } else if (lift <= 0 || ciUpper < 0.1) {
    decision = 'drop';
  } else {
    decision = 'retest';
  }

  return {
    baselineMean: Math.round(baselineMean * 10) / 10,
    experimentMean: Math.round(experimentMean * 10) / 10,
    lift: Math.round(lift * 10) / 10,
    ciLower: Math.round(ciLower * 10) / 10,
    ciUpper: Math.round(ciUpper * 10) / 10,
    adherenceRate: Math.round(adherenceRate * 100),
    decision,
    dayOfWeekPattern,
  };
}

export function getDecisionExplanation(analysis: ExperimentAnalysis): string {
  const { decision, lift, adherenceRate, ciLower, ciUpper } = analysis;

  if (decision === 'keep') {
    return `This experiment shows a meaningful improvement of +${lift} focus blocks/day. Your adherence was strong at ${adherenceRate}%, and the confidence interval suggests this effect is likely real (95% CI: ${ciLower} to ${ciUpper}).`;
  } else if (decision === 'drop') {
    if (lift <= 0) {
      return `This experiment didn't improve your focus blocks (change: ${lift}). The data suggests this habit change isn't working for you in its current form.`;
    }
    return `While there was a small improvement, the effect is too small to be confident it's real (95% CI upper bound: ${ciUpper}). Consider trying a different approach.`;
  } else {
    if (adherenceRate < 70) {
      return `The results are inconclusive. Your adherence was ${adherenceRate}%, which makes it hard to evaluate the true effect. Consider running this experiment again with stricter adherence.`;
    }
    return `The results are promising but not conclusive (95% CI: ${ciLower} to ${ciUpper}). Consider running for another week to gather more data.`;
  }
}

export function getDayOfWeekInsight(pattern: Record<string, number>): string {
  const entries = Object.entries(pattern).filter(([_, avg]) => avg > 0);
  if (entries.length === 0) return '';

  entries.sort((a, b) => b[1] - a[1]);
  const best = entries[0];
  const worst = entries[entries.length - 1];

  if (best[1] === worst[1]) {
    return 'Your focus is consistent across days of the week.';
  }

  return `Your best focus day is ${best[0]} (avg ${best[1].toFixed(1)} blocks). ${worst[0]} tends to have fewer focus blocks (avg ${worst[1].toFixed(1)}).`;
}
