'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  getAllExperiments,
  getCheckinsByExperiment,
  getDailyMetrics,
  getBaselineMetrics,
} from '@/lib/storage';
import { getPlaybookById } from '@/lib/playbooks';
import { Experiment, ExperimentAnalysis } from '@/lib/types';
import { analyzeExperiment, getDecisionExplanation, getDayOfWeekInsight } from '@/lib/analysis';

export default function ReportPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  useEffect(() => {
    const exps = getAllExperiments().filter(e => e.status === 'completed');
    setExperiments(exps);

    if (exps.length > 0) {
      setSelectedExperiment(exps[0]);
    }

    // Check auth
    if (typeof window !== 'undefined' && (window as any).AUTH_USER) {
      setUser((window as any).AUTH_USER);
    }

    const handleAuthChange = (e: CustomEvent) => {
      setUser(e.detail);
    };
    window.addEventListener('auth:user', handleAuthChange as EventListener);
    return () => {
      window.removeEventListener('auth:user', handleAuthChange as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Experiment Reports</h1>
          <Link href="/app" className="text-sm text-indigo-600 hover:text-indigo-700">
            ← Back to dashboard
          </Link>
        </div>

        {experiments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <h2 className="font-semibold text-gray-900 mb-2">No completed experiments yet</h2>
            <p className="text-gray-600 mb-4">Start an experiment and complete it to see your report.</p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start an experiment
            </Link>
          </div>
        ) : (
          <>
            {/* Experiment Selector */}
            {experiments.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select experiment</label>
                <select
                  value={selectedExperiment?.id || ''}
                  onChange={(e) => {
                    const exp = experiments.find(ex => ex.id === e.target.value);
                    setSelectedExperiment(exp || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {experiments.map(exp => {
                    const pb = getPlaybookById(exp.playbookId);
                    return (
                      <option key={exp.id} value={exp.id}>
                        {pb?.title || exp.playbookId} ({exp.startDate})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Report */}
            {selectedExperiment && (
              <ExperimentReport experiment={selectedExperiment} user={user} />
            )}

            {/* Save Prompt for Anonymous */}
            {!user && (
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="font-medium text-indigo-900">Save your experiment history</p>
                <p className="text-sm text-indigo-700 mt-1">
                  Sign in with Google to sync your data across devices and keep your experiment history safe.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ExperimentReport({ experiment, user }: { experiment: Experiment; user: any }) {
  const playbook = getPlaybookById(experiment.playbookId);
  const analysis = experiment.analysis;

  if (!analysis) {
    // Compute analysis if missing
    const checkins = getCheckinsByExperiment(experiment.id);
    const metrics = getDailyMetrics();
    const baselineMetrics = getBaselineMetrics(experiment.startDate);
    const experimentMetrics = metrics.filter(m => {
      const date = new Date(m.date);
      return date >= new Date(experiment.startDate) && date <= new Date(experiment.endDate);
    });

    const computedAnalysis = analyzeExperiment(baselineMetrics, experimentMetrics, checkins);
    return <ReportContent analysis={computedAnalysis} playbook={playbook} experiment={experiment} user={user} />;
  }

  return <ReportContent analysis={analysis} playbook={playbook} experiment={experiment} user={user} />;
}

function ReportContent({
  analysis,
  playbook,
  experiment,
  user,
}: {
  analysis: ExperimentAnalysis;
  playbook: any;
  experiment: Experiment;
  user: any;
}) {
  const decisionColors = {
    keep: 'bg-green-100 text-green-800 border-green-200',
    drop: 'bg-red-100 text-red-800 border-red-200',
    retest: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const decisionIcons = {
    keep: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    drop: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    retest: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Decision Card */}
      <div className={`rounded-lg border p-6 ${decisionColors[analysis.decision]}`}>
        <div className="flex items-center gap-3 mb-3">
          {decisionIcons[analysis.decision]}
          <span className="text-xl font-bold capitalize">{analysis.decision}</span>
        </div>
        <p className="text-sm">
          {getDecisionExplanation(analysis)}
        </p>
      </div>

      {/* Experiment Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">{playbook?.title || 'Experiment'}</h2>
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Constraint:</span> {experiment.preregistration.constraint}
        </p>
        <p className="text-sm text-gray-500">
          {experiment.startDate} to {experiment.endDate}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Key Metrics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Baseline</p>
            <p className="text-2xl font-bold text-gray-900">{analysis.baselineMean}</p>
            <p className="text-xs text-gray-500">blocks/day</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Experiment</p>
            <p className="text-2xl font-bold text-gray-900">{analysis.experimentMean}</p>
            <p className="text-xs text-gray-500">blocks/day</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Change</p>
            <p className={`text-2xl font-bold ${analysis.lift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.lift >= 0 ? '+' : ''}{analysis.lift}
            </p>
            <p className="text-xs text-gray-500">blocks/day</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Adherence</p>
            <p className="text-2xl font-bold text-gray-900">{analysis.adherenceRate}%</p>
            <p className="text-xs text-gray-500">of days</p>
          </div>
        </div>
      </div>

      {/* Confidence Interval */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Statistical Confidence</h2>
        <p className="text-sm text-gray-600 mb-4">
          95% confidence interval for the change in focus blocks/day:
        </p>

        <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
          {/* Zero line */}
          <div className="absolute top-0 bottom-0 w-px bg-gray-400" style={{ left: '50%' }} />

          {/* CI bar */}
          <div
            className={`absolute top-3 bottom-3 rounded ${
              analysis.ciLower > 0 ? 'bg-green-400' : analysis.ciUpper < 0 ? 'bg-red-400' : 'bg-yellow-400'
            }`}
            style={{
              left: `${Math.max(0, 50 + analysis.ciLower * 10)}%`,
              right: `${Math.max(0, 50 - analysis.ciUpper * 10)}%`,
            }}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{analysis.ciLower}</span>
          <span>0</span>
          <span>+{analysis.ciUpper}</span>
        </div>
      </div>

      {/* Day of Week Pattern */}
      {analysis.dayOfWeekPattern && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Day of Week Pattern</h2>
          <p className="text-sm text-gray-600 mb-4">
            {getDayOfWeekInsight(analysis.dayOfWeekPattern)}
          </p>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
              const fullDay = {
                Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
                Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday'
              }[day]!;
              const value = analysis.dayOfWeekPattern[fullDay] || 0;
              const maxValue = Math.max(...Object.values(analysis.dayOfWeekPattern), 1);

              return (
                <div key={day} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{day}</div>
                  <div className="h-20 bg-gray-100 rounded relative">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-indigo-400 rounded-b"
                      style={{ height: `${(value / maxValue) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium text-gray-700 mt-1">
                    {value.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/app"
          className="flex-1 py-3 text-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Start New Experiment
        </Link>
      </div>
    </div>
  );
}
