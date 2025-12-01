'use client';

import { useState, useEffect } from 'react';

interface PortInfo {
  protocol: string;
  localAddress: string;
  port: string;
  state: string;
  pid: string;
}

export default function PortMonitor() {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchPorts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/port-info');
      const data = await response.json();

      if (data.success) {
        setPorts(data.ports);
        setLastUpdate(data.timestamp);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const killProcess = async (pid: string, port: string) => {
    if (!confirm(`Kill process ${pid} using port ${port}?`)) return;

    try {
      const response = await fetch('/api/port-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Process ${pid} terminated`);
        fetchPorts(); // Refresh the list
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err}`);
    }
  };

  // Auto-refresh every 5 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPorts, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Port Monitor
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Monitor dev server ports (3000-3300 range)
            {lastUpdate && <> • Last updated: {new Date(lastUpdate).toLocaleTimeString()}</>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-refresh (5s)
          </label>

          <button
            onClick={fetchPorts}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 border border-yellow-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? '🔄 Checking...' : '🔍 Check Ports'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border-2 border-red-500/50 rounded-lg">
          <p className="text-red-400">❌ Error: {error}</p>
        </div>
      )}

      {ports.length === 0 && !loading && !error && (
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center text-gray-400">
          Click "Check Ports" to scan for active dev server ports
        </div>
      )}

      {ports.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full bg-gray-900/50 rounded-lg border border-gray-700">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Port</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Protocol</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Address</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">State</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">PID</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ports.map((port, idx) => {
                const isDevPort = port.port === '3200' || port.port === '3000';
                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-700 ${isDevPort ? 'bg-yellow-900/10' : ''}`}
                  >
                    <td className="px-4 py-2">
                      <span className={`font-mono font-bold ${isDevPort ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {port.port}
                        {port.port === '3200' && ' 🎯'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400">{port.protocol}</td>
                    <td className="px-4 py-2 text-gray-400 font-mono text-sm">{port.localAddress}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-green-900/30 border border-green-700 rounded text-green-400 text-xs">
                        {port.state}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-300 font-mono">{port.pid}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => killProcess(port.pid, port.port)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 border border-red-500 rounded text-white text-xs font-semibold transition-colors"
                      >
                        Kill PID
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
        <h4 className="text-sm font-bold text-blue-400 mb-2">💡 Quick Guide:</h4>
        <ul className="text-xs text-blue-300 space-y-1">
          <li>• <strong>Port 3200</strong> = Next.js dev server (your main app)</li>
          <li>• <strong>Port 3000-3010</strong> = Alternative dev servers or Convex</li>
          <li>• If "EADDRINUSE" error: Click "Kill PID" for that port, then restart dev server</li>
          <li>• Auto-refresh helps monitor real-time port status</li>
        </ul>
      </div>
    </div>
  );
}
