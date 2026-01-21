import Link from 'next/link';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Run Personal Productivity Experiments
            <span className="text-indigo-600"> That Actually Work</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A privacy-first lab for remote workers. Run one 14-day experiment at a time to
            improve your uninterrupted focus blocks. No guesswork — just data-driven habits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/app"
              className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-lg"
            >
              Try it now — No signup required
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Your data stays on your device. Sign in later to sync across devices.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Choose a Playbook</h3>
            <p className="text-gray-600">
              Pick from proven productivity experiments like "Morning Focus Block" or
              "Notification Fast". Each includes a pre-registered hypothesis.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-indigo-600">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Run for 14 Days</h3>
            <p className="text-gray-600">
              Track your daily adherence and focus blocks. Quick 30-second check-ins
              keep you accountable without adding overhead.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-indigo-600">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Get an Honest Verdict</h3>
            <p className="text-gray-600">
              Our analysis compares your experiment to your baseline. Keep what works,
              drop what doesn't. No productivity theater.
            </p>
          </div>
        </div>
      </section>

      {/* Focus Metric */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              One Metric That Matters
            </h2>
            <p className="text-lg text-indigo-100 mb-6">
              We track <strong>uninterrupted focus blocks</strong> — periods of 25+ minutes
              where you're doing deep work without interruption. This single metric captures
              what most productivity advice fails to measure.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Manual logging</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Sample data to explore</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Playbooks Preview */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Starter Playbooks
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Each playbook is a structured 14-day experiment with a clear hypothesis,
          constraint, and success criteria.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Morning Focus Block', category: 'Schedule', desc: 'Start with deep work before email' },
            { title: 'Notification Fast', category: 'Environment', desc: 'Eliminate distractions during work' },
            { title: 'Meeting Batching', category: 'Schedule', desc: 'Protect contiguous focus time' },
            { title: 'Energy-Aligned Work', category: 'Energy', desc: 'Work with your natural rhythm' },
            { title: 'Focus Workspace Ritual', category: 'Environment', desc: 'Build consistent deep work triggers' },
          ].map((playbook, idx) => (
            <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {playbook.category}
              </span>
              <h3 className="font-semibold text-gray-900 mt-3">{playbook.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{playbook.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
          >
            Start your first experiment
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Privacy */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Privacy-First by Design
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Your experiment data is stored locally in your browser. No tracking, no
            selling your data. Sign in only when you want to sync across devices
            or unlock premium features.
          </p>
          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <span>Local-first storage</span>
            <span>No third-party tracking</span>
            <span>Export your data anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              Habit Time Insights — Run experiments, not productivity theater.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/pricing" className="hover:text-gray-700">Pricing</Link>
              <Link href="/account" className="hover:text-gray-700">Account</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
