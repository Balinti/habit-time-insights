'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { getLocalData, clearLocalData } from '@/lib/storage';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);

  useEffect(() => {
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

  async function handleBillingPortal() {
    if (!user) return;

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (e) {
      console.error('Portal error:', e);
      alert('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const data = getLocalData();
    const json = JSON.stringify(data, null, 2);
    setExportData(json);

    // Also trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-time-insights-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDeleteData() {
    if (confirm('Are you sure you want to delete all local data? This cannot be undone.')) {
      clearLocalData();
      alert('Local data deleted.');
      window.location.reload();
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Account</h1>
            <p className="text-gray-600 mb-6">
              Sign in to access your account settings, manage your subscription, and sync your data.
            </p>
            <p className="text-sm text-gray-500">
              Use the Sign In button in the header to continue.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>

        {/* Profile */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-gray-500">Email:</span>{' '}
              <span className="text-gray-900">{user.email}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">User ID:</span>{' '}
              <span className="text-gray-900 font-mono text-xs">{user.id}</span>
            </p>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Subscription</h2>
          <p className="text-sm text-gray-600 mb-4">
            Manage your subscription, update payment method, or cancel.
          </p>
          <button
            onClick={handleBillingPortal}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Open Billing Portal'}
          </button>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Data Management</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Export Data</h3>
              <p className="text-sm text-gray-600 mb-2">
                Download all your experiment data as a JSON file.
              </p>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Export to JSON
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-2">
                Delete all local data. This will not affect cloud data if you're synced.
              </p>
              <button
                onClick={handleDeleteData}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Delete Local Data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
