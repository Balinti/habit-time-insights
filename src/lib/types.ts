// Types for Habit Time Insights

export interface Playbook {
  id: string;
  title: string;
  description: string;
  hypothesis: string;
  metric: string;
  defaultConstraint: string;
  category: string;
}

export interface Preregistration {
  hypothesis: string;
  metric: string;
  constraint: string;
  playbookId: string;
}

export interface Experiment {
  id: string;
  playbookId: string;
  status: 'draft' | 'running' | 'completed';
  startDate: string;
  endDate: string;
  preregistration: Preregistration;
  decision?: string;
  analysis?: ExperimentAnalysis;
  createdAt: string;
}

export interface DailyCheckin {
  id: string;
  experimentId: string;
  date: string;
  adherence: 'yes' | 'partial' | 'no';
  energy: number;
  note?: string;
  createdAt: string;
}

export interface DailyMetric {
  id: string;
  date: string;
  focusBlocks: number;
  source: 'manual' | 'sample';
  createdAt: string;
}

export interface ExperimentAnalysis {
  baselineMean: number;
  experimentMean: number;
  lift: number;
  ciLower: number;
  ciUpper: number;
  adherenceRate: number;
  decision: 'keep' | 'drop' | 'retest';
  dayOfWeekPattern: Record<string, number>;
}

export interface LocalStorageData {
  version: string;
  experiments: Experiment[];
  dailyCheckins: DailyCheckin[];
  dailyMetrics: DailyMetric[];
  currentExperimentId?: string;
  migratedAt?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Subscription {
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: 'free' | 'plus' | 'pro';
  status: string;
  currentPeriodEnd?: string;
}
