'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { PLAYBOOKS } from '@/lib/playbooks';
import {
  getActiveExperiment,
  getAllExperiments,
  getDailyMetrics,
  importSampleBaseline,
  getBaselineMetrics,
  getTotalExperimentsCount,
} from '@/lib/storage';
import { Experiment, Playbook, DailyMetric } from '@/lib/types';
import { calculateMean } from '@/lib/analysis';

type Step = 'playbooks' | 'preregister' | 'active';

export default function AppPage() {
  const [step, setStep] = useState<Step>('playbooks');
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();

    // Listen for auth changes
    const handleAuthChange = (e: CustomEvent) => {
      setUser(e.detail);
    };

    window.addEventListener('auth:user', handleAuthChange as EventListener);
    if (typeof window !== 'undefined' && (window as any).AUTH_USER) {
      setUser((window as any).AUTH_USER);
    }

    return () => {
      window.removeEventListener('auth:user', handleAuthChange as EventListener);
    };
  }, []);

  function loadData() {
    const active = getActiveExperiment();
    const allExps = getAllExperiments();
    const allMetrics = getDailyMetrics();

    setActiveExperiment(active || null);
    setExperiments(allExps);
    setMetrics(allMetrics);

    if (active) {
      setStep('active');
    }

    // Show save prompt after some engagement (has metrics or experiment)
    if (!user && (allMetrics.length > 3 || allExps.length > 0)) {
      setShowSavePrompt(true);
    }
  }

  function handleSelectPlaybook(playbook: Playbook) {
    // Check experiment limit for anonymous users
    const totalExps = getTotalExperimentsCount();
    if (!user && totalExps >= 1) {
      setShowSavePrompt(true);
      return;
    }

    setSelectedPlaybook(playbook);
    setStep('preregister');
  }

  function handleImportSample() {
    importSampleBaseline();
    loadData();
  }

  // Calculate baseline stats
  const today = new Date().toISOString().split('T')[0];
  const baselineMetrics = getBaselineMetrics(today);
  const baselineMean = calculateMean(baselineMetrics.map(m => m.focusBlocks));
  const todayMetric = metrics.find(m => m.date === today);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Save Progress Prompt */}
        {showSavePrompt && !user && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium text-indigo-900">Save your progress</p>
              <p className="text-sm text-indigo-700">Sign in with Google to sync across devices and unlock more experiments.</p>
            </div>
            <button
              onClick={() => setShowSavePrompt(false)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Insight Card */}
        <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Insight</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Baseline (last 7 days)</p>
              <p className="text-3xl font-bold text-gray-900">
                {baselineMetrics.length > 0 ? baselineMean.toFixed(1) : '—'}
                <span className="text-lg font-normal text-gray-500 ml-1">blocks/day</span>
              </p>
              {baselineMetrics.length === 0 && (
                <button
                  onClick={handleImportSample}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Import sample baseline
                </button>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Today</p>
              <p className="text-3xl font-bold text-gray-900">
                {todayMetric ? todayMetric.focusBlocks : '—'}
                <span className="text-lg font-normal text-gray-500 ml-1">blocks</span>
              </p>
              {todayMetric && baselineMetrics.length > 0 && (
                <p className={`text-sm mt-1 ${todayMetric.focusBlocks >= baselineMean ? 'text-green-600' : 'text-red-600'}`}>
                  {todayMetric.focusBlocks >= baselineMean ? '+' : ''}
                  {(todayMetric.focusBlocks - baselineMean).toFixed(1)} vs baseline
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step: Active Experiment */}
        {step === 'active' && activeExperiment && (
          <ActiveExperimentView
            experiment={activeExperiment}
            onComplete={() => {
              loadData();
              setStep('playbooks');
            }}
          />
        )}

        {/* Step: Playbook Selection */}
        {step === 'playbooks' && !activeExperiment && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Choose a Playbook</h1>
              {experiments.length > 0 && (
                <Link href="/app/report" className="text-sm text-indigo-600 hover:text-indigo-700">
                  View past experiments
                </Link>
              )}
            </div>
            <div className="grid gap-4">
              {PLAYBOOKS.map((playbook) => (
                <button
                  key={playbook.id}
                  onClick={() => handleSelectPlaybook(playbook)}
                  className="w-full p-5 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 text-left transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {playbook.category}
                      </span>
                      <h3 className="font-semibold text-gray-900 mt-2">{playbook.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{playbook.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Pre-registration */}
        {step === 'preregister' && selectedPlaybook && (
          <PreregisterView
            playbook={selectedPlaybook}
            onBack={() => setStep('playbooks')}
            onStart={() => {
              loadData();
              setStep('active');
            }}
          />
        )}
      </main>
    </div>
  );
}

function ActiveExperimentView({
  experiment,
  onComplete,
}: {
  experiment: Experiment;
  onComplete: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Active Experiment</h1>
        <Link
          href="/app/experiment"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Go to experiment
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
            Running
          </span>
          <span className="text-sm text-gray-500">
            Day {getDayNumber(experiment.startDate)} of 14
          </span>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {experiment.preregistration.hypothesis.split(',')[0]}
        </h2>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Constraint:</span> {experiment.preregistration.constraint}
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/app/experiment"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            Log today's check-in and focus blocks →
          </Link>
        </div>
      </div>
    </div>
  );
}

function PreregisterView({
  playbook,
  onBack,
  onStart,
}: {
  playbook: Playbook;
  onBack: () => void;
  onStart: () => void;
}) {
  const [constraint, setConstraint] = useState(playbook.defaultConstraint);
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    setStarting(true);

    const { addExperiment, generateId } = await import('@/lib/storage');

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);

    const experiment: Experiment = {
      id: generateId(),
      playbookId: playbook.id,
      status: 'running',
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      preregistration: {
        hypothesis: playbook.hypothesis,
        metric: playbook.metric,
        constraint,
        playbookId: playbook.id,
      },
      createdAt: new Date().toISOString(),
    };

    addExperiment(experiment);
    onStart();
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to playbooks
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pre-register Your Experiment</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Playbook</label>
          <p className="text-gray-900">{playbook.title}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hypothesis</label>
          <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{playbook.hypothesis}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
          <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{playbook.metric}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Constraint
            <span className="font-normal text-gray-500 ml-1">(customize if needed)</span>
          </label>
          <input
            type="text"
            value={constraint}
            onChange={(e) => setConstraint(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            By starting, you commit to running this experiment for 14 days with daily check-ins.
          </p>
          <button
            onClick={handleStart}
            disabled={starting || !constraint.trim()}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? 'Starting...' : 'Start 14-Day Experiment'}
          </button>
        </div>
      </div>
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
