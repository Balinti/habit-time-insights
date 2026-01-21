'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  getActiveExperiment,
  getCheckinsByExperiment,
  getDailyMetrics,
  getBaselineMetrics,
  addCheckin,
  addDailyMetric,
  updateExperiment,
  generateId,
} from '@/lib/storage';
import { getPlaybookById } from '@/lib/playbooks';
import { Experiment, DailyCheckin, DailyMetric, Playbook } from '@/lib/types';
import { analyzeExperiment, getDecisionExplanation, getDayOfWeekInsight } from '@/lib/analysis';

export default function ExperimentPage() {
  const router = useRouter();
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [adherence, setAdherence] = useState<'yes' | 'partial' | 'no'>('yes');
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const [focusBlocks, setFocusBlocks] = useState(0);
  const [checkinSaved, setCheckinSaved] = useState(false);
  const [metricSaved, setMetricSaved] = useState(false);

  useEffect(() => {
    const exp = getActiveExperiment();
    if (!exp) {
      router.push('/app');
      return;
    }

    const pb = getPlaybookById(exp.playbookId);
    const chks = getCheckinsByExperiment(exp.id);
    const allMetrics = getDailyMetrics();

    setExperiment(exp);
    setPlaybook(pb || null);
    setCheckins(chks);
    setMetrics(allMetrics);

    // Check if already checked in today
    const todayCheckin = chks.find(c => c.date === today);
    if (todayCheckin) {
      setAdherence(todayCheckin.adherence);
      setEnergy(todayCheckin.energy);
      setNote(todayCheckin.note || '');
      setCheckinSaved(true);
    }

    // Check if already logged focus blocks today
    const todayMetric = allMetrics.find(m => m.date === today);
    if (todayMetric) {
      setFocusBlocks(todayMetric.focusBlocks);
      setMetricSaved(true);
    }

    setLoading(false);
  }, [router, today]);

  function handleSaveCheckin() {
    if (!experiment) return;

    const checkin: DailyCheckin = {
      id: generateId(),
      experimentId: experiment.id,
      date: today,
      adherence,
      energy,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addCheckin(checkin);
    setCheckins(getCheckinsByExperiment(experiment.id));
    setCheckinSaved(true);
  }

  function handleSaveMetric() {
    const metric: DailyMetric = {
      id: generateId(),
      date: today,
      focusBlocks,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    addDailyMetric(metric);
    setMetrics(getDailyMetrics());
    setMetricSaved(true);
  }

  function handleCompleteExperiment() {
    if (!experiment) return;

    // Get baseline and experiment metrics
    const baselineMetrics = getBaselineMetrics(experiment.startDate);
    const experimentMetrics = metrics.filter(m => {
      const date = new Date(m.date);
      return date >= new Date(experiment.startDate) && date <= new Date(experiment.endDate);
    });

    const analysis = analyzeExperiment(baselineMetrics, experimentMetrics, checkins);

    updateExperiment(experiment.id, {
      status: 'completed',
      decision: analysis.decision,
      analysis,
    });

    router.push('/app/report');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg h-64"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!experiment || !playbook) {
    return null;
  }

  const dayNumber = getDayNumber(experiment.startDate);
  const isLastDay = dayNumber >= 14;
  const baselineMetrics = getBaselineMetrics(experiment.startDate);
  const experimentMetrics = metrics.filter(m => {
    const date = new Date(m.date);
    return date >= new Date(experiment.startDate) && date <= new Date(experiment.endDate);
  });

  // Preview analysis
  const previewAnalysis = experimentMetrics.length > 0
    ? analyzeExperiment(baselineMetrics, experimentMetrics, checkins)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/app" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>

        {/* Experiment Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                Running
              </span>
              <span className="text-sm text-gray-500">
                Day {dayNumber} of 14
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {experiment.startDate} → {experiment.endDate}
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">{playbook.title}</h1>
          <p className="text-gray-600 text-sm mb-4">{experiment.preregistration.constraint}</p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${(dayNumber / 14) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Check-in */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Daily Check-in</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Did you follow the constraint today?
                </label>
                <div className="flex gap-2">
                  {(['yes', 'partial', 'no'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setAdherence(opt); setCheckinSaved(false); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        adherence === opt
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {opt === 'yes' ? 'Yes' : opt === 'partial' ? 'Partial' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energy level (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => { setEnergy(level); setCheckinSaved(false); }}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        energy === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => { setNote(e.target.value); setCheckinSaved(false); }}
                  placeholder="Any observations today?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>

              <button
                onClick={handleSaveCheckin}
                disabled={checkinSaved}
                className={`w-full py-2 rounded-lg font-medium transition-colors ${
                  checkinSaved
                    ? 'bg-green-100 text-green-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {checkinSaved ? 'Saved' : 'Save Check-in'}
              </button>
            </div>
          </div>

          {/* Focus Blocks */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Today's Focus Blocks</h2>

            <p className="text-sm text-gray-600 mb-4">
              A focus block is 25+ minutes of uninterrupted deep work.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many focus blocks today?
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setFocusBlocks(Math.max(0, focusBlocks - 1)); setMetricSaved(false); }}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-gray-900 w-16 text-center">
                  {focusBlocks}
                </span>
                <button
                  onClick={() => { setFocusBlocks(focusBlocks + 1); setMetricSaved(false); }}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveMetric}
              disabled={metricSaved}
              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                metricSaved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {metricSaved ? 'Saved' : 'Save Focus Blocks'}
            </button>

            {/* Quick Stats */}
            {previewAnalysis && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Progress so far</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Baseline avg:</span>
                  <span className="font-medium">{previewAnalysis.baselineMean} blocks/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Experiment avg:</span>
                  <span className="font-medium">{previewAnalysis.experimentMean} blocks/day</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Adherence:</span>
                  <span className="font-medium">{previewAnalysis.adherenceRate}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Check-in History */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Check-in History</h2>

          {checkins.length === 0 ? (
            <p className="text-sm text-gray-500">No check-ins yet. Start logging today!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: dayNumber }).map((_, idx) => {
                const date = new Date(experiment.startDate);
                date.setDate(date.getDate() + idx);
                const dateStr = date.toISOString().split('T')[0];
                const checkin = checkins.find(c => c.date === dateStr);

                return (
                  <div
                    key={idx}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                      checkin
                        ? checkin.adherence === 'yes'
                          ? 'bg-green-100 text-green-700'
                          : checkin.adherence === 'partial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title={`Day ${idx + 1}: ${checkin ? checkin.adherence : 'No check-in'}`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Complete Experiment */}
        {(isLastDay || dayNumber >= 7) && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-2">
              {isLastDay ? 'Complete Your Experiment' : 'Preview Results (Early)'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {isLastDay
                ? 'You\'ve reached the end of your 14-day experiment. View your analysis and verdict.'
                : 'You can preview results early, but a full 14 days gives more reliable data.'}
            </p>
            <button
              onClick={handleCompleteExperiment}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {isLastDay ? 'View Results' : 'Preview Results'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function getDayNumber(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), 14);
}
