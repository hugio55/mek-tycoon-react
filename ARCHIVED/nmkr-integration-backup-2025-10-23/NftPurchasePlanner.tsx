"use client";

import { useState, useMemo } from "react";

interface NodeConfig {
  easy: number;
  medium: number;
  hard: number;
}

interface PriceConfig {
  easy: number;
  medium: number;
  hard: number;
}

export default function NftPurchasePlanner() {
  const [node1Quantities, setNode1Quantities] = useState<NodeConfig>({
    easy: 10,
    medium: 5,
    hard: 2
  });

  const [node20Quantities, setNode20Quantities] = useState<NodeConfig>({
    easy: 2,
    medium: 1,
    hard: 1
  });

  const [node1Prices, setNode1Prices] = useState<PriceConfig>({
    easy: 50,
    medium: 100,
    hard: 200
  });

  const [node20Prices, setNode20Prices] = useState<PriceConfig>({
    easy: 100,
    medium: 200,
    hard: 400
  });

  const interpolatedData = useMemo(() => {
    const nodes = [];

    for (let nodeNumber = 1; nodeNumber <= 20; nodeNumber++) {
      const t = (nodeNumber - 1) / 19;

      const quantities = {
        easy: Math.round(node1Quantities.easy + (node20Quantities.easy - node1Quantities.easy) * t),
        medium: Math.round(node1Quantities.medium + (node20Quantities.medium - node1Quantities.medium) * t),
        hard: Math.round(node1Quantities.hard + (node20Quantities.hard - node1Quantities.hard) * t)
      };

      const prices = {
        easy: Number((node1Prices.easy + (node20Prices.easy - node1Prices.easy) * t).toFixed(2)),
        medium: Number((node1Prices.medium + (node20Prices.medium - node1Prices.medium) * t).toFixed(2)),
        hard: Number((node1Prices.hard + (node20Prices.hard - node1Prices.hard) * t).toFixed(2))
      };

      const revenue = {
        easy: quantities.easy * prices.easy,
        medium: quantities.medium * prices.medium,
        hard: quantities.hard * prices.hard,
        total: (quantities.easy * prices.easy) + (quantities.medium * prices.medium) + (quantities.hard * prices.hard)
      };

      nodes.push({
        nodeNumber,
        quantities,
        prices,
        revenue
      });
    }

    return nodes;
  }, [node1Quantities, node20Quantities, node1Prices, node20Prices]);

  const totalRevenue = useMemo(() => {
    return interpolatedData.reduce((sum, node) => sum + node.revenue.total, 0);
  }, [interpolatedData]);

  const totalNFTs = useMemo(() => {
    return interpolatedData.reduce((sum, node) =>
      sum + node.quantities.easy + node.quantities.medium + node.quantities.hard, 0
    );
  }, [interpolatedData]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border-2 border-purple-500/50">
        <h3 className="text-2xl font-bold text-purple-300 mb-2">NFT Purchase Planning Calculator</h3>
        <p className="text-gray-400 text-sm">
          Plan event node NFT sales by setting quantities and prices for nodes #1 and #20.
          The system will interpolate values for nodes 2-19.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/50 backdrop-blur border-2 border-green-500/30 rounded-lg p-6">
          <h4 className="text-xl font-bold text-green-400 mb-4">🟢 Event Node #1 (Starting)</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Quantities</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Easy</label>
                  <input
                    type="number"
                    min="0"
                    value={node1Quantities.easy}
                    onChange={(e) => setNode1Quantities({...node1Quantities, easy: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-green-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Medium</label>
                  <input
                    type="number"
                    min="0"
                    value={node1Quantities.medium}
                    onChange={(e) => setNode1Quantities({...node1Quantities, medium: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-yellow-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Hard</label>
                  <input
                    type="number"
                    min="0"
                    value={node1Quantities.hard}
                    onChange={(e) => setNode1Quantities({...node1Quantities, hard: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-red-500/30 rounded text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">ADA Prices</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Easy</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={node1Prices.easy}
                    onChange={(e) => setNode1Prices({...node1Prices, easy: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-green-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Medium</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={node1Prices.medium}
                    onChange={(e) => setNode1Prices({...node1Prices, medium: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-yellow-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Hard</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={node1Prices.hard}
                    onChange={(e) => setNode1Prices({...node1Prices, hard: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-red-500/30 rounded text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur border-2 border-red-500/30 rounded-lg p-6">
          <h4 className="text-xl font-bold text-red-400 mb-4">🔴 Event Node #20 (Ending)</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Quantities</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Easy</label>
                  <input
                    type="number"
                    min="0"
                    value={node20Quantities.easy}
                    onChange={(e) => setNode20Quantities({...node20Quantities, easy: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-green-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Medium</label>
                  <input
                    type="number"
                    min="0"
                    value={node20Quantities.medium}
                    onChange={(e) => setNode20Quantities({...node20Quantities, medium: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-yellow-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Hard</label>
                  <input
                    type="number"
                    min="0"
                    value={node20Quantities.hard}
                    onChange={(e) => setNode20Quantities({...node20Quantities, hard: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-red-500/30 rounded text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">ADA Prices</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Easy</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={node20Prices.easy}
                    onChange={(e) => setNode20Prices({...node20Prices, easy: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-green-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Medium</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={node20Prices.medium}
                    onChange={(e) => setNode20Prices({...node20Prices, medium: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-yellow-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Hard</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={node20Prices.hard}
                    onChange={(e) => setNode20Prices({...node20Prices, hard: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-900 border border-red-500/30 rounded text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-6 border-2 border-yellow-500/50">
        <h4 className="text-2xl font-bold text-yellow-400 mb-4">💰 Revenue Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-black/50 rounded p-4">
            <div className="text-sm text-gray-400">Total NFTs</div>
            <div className="text-3xl font-bold text-white">{totalNFTs}</div>
          </div>
          <div className="bg-black/50 rounded p-4">
            <div className="text-sm text-gray-400">Total Revenue</div>
            <div className="text-3xl font-bold text-yellow-400">{totalRevenue.toFixed(2)} ₳</div>
          </div>
          <div className="bg-black/50 rounded p-4">
            <div className="text-sm text-gray-400">Average Price</div>
            <div className="text-3xl font-bold text-blue-400">{(totalRevenue / totalNFTs).toFixed(2)} ₳</div>
          </div>
        </div>
      </div>

      <div className="bg-black/50 backdrop-blur border-2 border-gray-700/50 rounded-lg p-6">
        <h4 className="text-xl font-bold text-gray-300 mb-4">📊 Interpolated Data (All 20 Event Nodes)</h4>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-gray-400">Node</th>
                <th className="px-3 py-2 text-center text-green-400">Easy Qty</th>
                <th className="px-3 py-2 text-center text-green-400">Easy Price</th>
                <th className="px-3 py-2 text-center text-yellow-400">Med Qty</th>
                <th className="px-3 py-2 text-center text-yellow-400">Med Price</th>
                <th className="px-3 py-2 text-center text-red-400">Hard Qty</th>
                <th className="px-3 py-2 text-center text-red-400">Hard Price</th>
                <th className="px-3 py-2 text-right text-yellow-300 font-bold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {interpolatedData.map((node, idx) => (
                <tr
                  key={node.nodeNumber}
                  className={`border-b border-gray-800 ${
                    node.nodeNumber === 1 || node.nodeNumber === 20
                      ? 'bg-purple-900/20'
                      : idx % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-900/10'
                  }`}
                >
                  <td className="px-3 py-2 font-bold text-gray-300">
                    {node.nodeNumber === 1 || node.nodeNumber === 20 ? '⭐' : ''} #{node.nodeNumber}
                  </td>
                  <td className="px-3 py-2 text-center text-green-300">{node.quantities.easy}</td>
                  <td className="px-3 py-2 text-center text-green-300">{node.prices.easy.toFixed(2)} ₳</td>
                  <td className="px-3 py-2 text-center text-yellow-300">{node.quantities.medium}</td>
                  <td className="px-3 py-2 text-center text-yellow-300">{node.prices.medium.toFixed(2)} ₳</td>
                  <td className="px-3 py-2 text-center text-red-300">{node.quantities.hard}</td>
                  <td className="px-3 py-2 text-center text-red-300">{node.prices.hard.toFixed(2)} ₳</td>
                  <td className="px-3 py-2 text-right font-bold text-yellow-400">{node.revenue.total.toFixed(2)} ₳</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-t-2 border-yellow-500/50">
              <tr>
                <td colSpan={7} className="px-3 py-3 text-right font-bold text-yellow-300">
                  TOTAL POTENTIAL REVENUE:
                </td>
                <td className="px-3 py-3 text-right font-bold text-2xl text-yellow-400">
                  {totalRevenue.toFixed(2)} ₳
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
