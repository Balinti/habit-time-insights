import { LocalStorageData, Experiment, DailyCheckin, DailyMetric } from './types';

const STORAGE_KEY = 'hti:v1';

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getLocalData(): LocalStorageData {
  if (typeof window === 'undefined') {
    return getDefaultData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }

  return getDefaultData();
}

export function saveLocalData(data: LocalStorageData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

function getDefaultData(): LocalStorageData {
  return {
    version: '1',
    experiments: [],
    dailyCheckins: [],
    dailyMetrics: [],
  };
}

export function addExperiment(experiment: Experiment): void {
  const data = getLocalData();
  data.experiments.push(experiment);
  data.currentExperimentId = experiment.id;
  saveLocalData(data);
}

export function updateExperiment(experimentId: string, updates: Partial<Experiment>): void {
  const data = getLocalData();
  const idx = data.experiments.findIndex(e => e.id === experimentId);
  if (idx !== -1) {
    data.experiments[idx] = { ...data.experiments[idx], ...updates };
    saveLocalData(data);
  }
}

export function getActiveExperiment(): Experiment | undefined {
  const data = getLocalData();
  return data.experiments.find(e => e.status === 'running');
}

export function getAllExperiments(): Experiment[] {
  const data = getLocalData();
  return data.experiments;
}

export function addCheckin(checkin: DailyCheckin): void {
  const data = getLocalData();
  // Remove existing checkin for same date if exists
  data.dailyCheckins = data.dailyCheckins.filter(
    c => !(c.experimentId === checkin.experimentId && c.date === checkin.date)
  );
  data.dailyCheckins.push(checkin);
  saveLocalData(data);
}

export function getCheckinsByExperiment(experimentId: string): DailyCheckin[] {
  const data = getLocalData();
  return data.dailyCheckins.filter(c => c.experimentId === experimentId);
}

export function addDailyMetric(metric: DailyMetric): void {
  const data = getLocalData();
  // Remove existing metric for same date if exists
  data.dailyMetrics = data.dailyMetrics.filter(m => m.date !== metric.date);
  data.dailyMetrics.push(metric);
  saveLocalData(data);
}

export function getDailyMetrics(): DailyMetric[] {
  const data = getLocalData();
  return data.dailyMetrics;
}

export function getDailyMetricByDate(date: string): DailyMetric | undefined {
  const data = getLocalData();
  return data.dailyMetrics.find(m => m.date === date);
}

export function getBaselineMetrics(beforeDate: string): DailyMetric[] {
  const data = getLocalData();
  const before = new Date(beforeDate);
  const sevenDaysAgo = new Date(before);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return data.dailyMetrics.filter(m => {
    const d = new Date(m.date);
    return d >= sevenDaysAgo && d < before;
  });
}

export function generateSampleBaseline(): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const today = new Date();

  for (let i = 7; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();

    // Simulate realistic focus blocks: fewer on Mon (meeting heavy) and Fri (wind down)
    let baseBlocks = 3;
    if (dayOfWeek === 1) baseBlocks = 2; // Monday
    if (dayOfWeek === 5) baseBlocks = 2; // Friday
    if (dayOfWeek === 0 || dayOfWeek === 6) baseBlocks = 1; // Weekend

    // Add some variance
    const variance = Math.floor(Math.random() * 2) - 1;
    const focusBlocks = Math.max(0, baseBlocks + variance);

    metrics.push({
      id: generateId(),
      date: date.toISOString().split('T')[0],
      focusBlocks,
      source: 'sample',
      createdAt: new Date().toISOString(),
    });
  }

  return metrics;
}

export function importSampleBaseline(): void {
  const samples = generateSampleBaseline();
  const data = getLocalData();

  // Only add samples that don't conflict with existing data
  samples.forEach(sample => {
    if (!data.dailyMetrics.find(m => m.date === sample.date)) {
      data.dailyMetrics.push(sample);
    }
  });

  saveLocalData(data);
}

export function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function markMigrated(): void {
  const data = getLocalData();
  data.migratedAt = new Date().toISOString();
  saveLocalData(data);
}

export function isMigrated(): boolean {
  const data = getLocalData();
  return !!data.migratedAt;
}

export function getCompletedExperimentsCount(): number {
  const data = getLocalData();
  return data.experiments.filter(e => e.status === 'completed').length;
}

export function getTotalExperimentsCount(): number {
  const data = getLocalData();
  return data.experiments.length;
}
