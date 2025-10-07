'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function AdminRateLimitPage() {
  const [stakeAddress, setStakeAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const resetRateLimit = useMutation(api.walletAuthentication.resetWalletRateLimit);

  const handleReset = async () => {
    if (!stakeAddress.trim()) {
      setError('Please enter a stake address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await resetRateLimit({ stakeAddress: stakeAddress.trim() });
      setResult(res);
      console.log('Rate limit reset successful:', res);
    } catch (err: any) {
      setError(err.message || 'Failed to reset rate limit');
      console.error('Rate limit reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCurrent = async () => {
    // Try to get stake address from localStorage
    const savedSession = localStorage.getItem('wallet_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.stakeAddress) {
          setStakeAddress(session.stakeAddress);
          setError('');
          console.log('Found stake address in session:', session.stakeAddress);
        } else {
          setError('No stake address found in saved session');
        }
      } catch (err) {
        setError('Could not parse saved session');
      }
    } else {
      setError('No wallet session found');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-500">Rate Limit Admin</h1>

        <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Reset Wallet Rate Limit</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Stake Address (stake1...)
            </label>
            <input
              type="text"
              value={stakeAddress}
              onChange={(e) => setStakeAddress(e.target.value)}
              placeholder="stake1u..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
            />
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={handleReset}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Rate Limit'}
            </button>

            <button
              onClick={handleResetCurrent}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-2 rounded"
            >
              Use Current Wallet
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 rounded p-4 mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-900/30 border border-green-500 rounded p-4">
              <p className="text-green-400 font-bold mb-2">Success!</p>
              <p className="text-sm text-gray-300">
                Reset {result.resetCount} rate limit record(s) for wallet:{' '}
                <span className="text-yellow-500">{result.stakeAddress.substring(0, 20)}...</span>
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2 text-gray-300">About Rate Limits</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Nonce generation: 50 attempts per hour</li>
            <li>• Signature verification: 50 attempts per hour</li>
            <li>• Failed attempts: 3 consecutive fails = 1 hour lockout</li>
            <li>• Rate limits reset automatically after 1 hour</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
