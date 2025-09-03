"use client";

export default function ContractTestPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Contract Layout Selector</h1>
        <p className="text-center text-gray-400 mb-12">Choose a layout option to preview</p>
        
        <div className="grid grid-cols-2 gap-6">
          {[1,2,3,4,5,6,7,8,9,10,11].map(n => (
            <a
              key={n}
              href={`/contracts/layout-option-${n}`}
              className="block bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 p-8 rounded-xl border-2 border-gray-700 hover:border-yellow-500/50 transition-all transform hover:scale-[1.02] shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-yellow-400">Option {n}</h2>
                {n >= 6 && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                    {n >= 9 ? "SCALED" : "NEW"}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-lg">
                {n === 1 && "Garrison-inspired with detailed mission info panels"}
                {n === 2 && "Horizontal flow with compact stat bars"}
                {n === 3 && "Two-column layout with epic socket design"}
                {n === 4 && "Centered design with info pills"}
                {n === 5 && "WoW Garrison style with detailed stats"}
                {n === 6 && "✨ Based on Option 2 - Full-width graphs, bigger fonts, 7 essences"}
                {n === 7 && "✨ Based on Option 3 - Full-width rewards, massive sizes"}
                {n === 8 && "✨ Hybrid design - Everything maximized for readability"}
                {n === 9 && "📐 Option 7 with 30% reduced scaling - Cleaner, less bulky"}
                {n === 10 && "📐 Side-by-side compact layout - Efficient space usage"}
                {n === 11 && "📐 Stacked layout with integrated header - Streamlined"}
              </p>
              {n >= 6 && n <= 8 && (
                <div className="mt-4 text-sm text-green-400">
                  • Full-width graphs • Bigger fonts • 7 essence types
                </div>
              )}
              {n >= 9 && (
                <div className="mt-4 text-sm text-blue-400">
                  • 30% reduced scaling • Maintains full-width • Less visual bulk
                </div>
              )}
            </a>
          ))}
        </div>
        
        <div className="mt-12 bg-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-3">Navigation Tips</h3>
          <ul className="text-gray-400 space-y-2">
            <li>• Direct links work: <code className="bg-black px-2 py-1 rounded text-yellow-400">/contracts/layout-option-7</code></li>
            <li>• Options 6-8 are the new iterations with improvements</li>
            <li>• Options 9-11 are scaled-down versions of Option 7 (30% smaller)</li>
            <li>• All layouts have 7 essence types and full-width graphs</li>
            <li>• The Acid badge varies in size across layouts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}