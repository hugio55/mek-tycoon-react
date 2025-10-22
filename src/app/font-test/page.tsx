import Link from 'next/link';

export default function FontTestPage() {
  const fonts = [
    { name: 'Orbitron', className: 'font-orbitron' },
    { name: 'Rajdhani', className: 'font-rajdhani' },
    { name: 'Saira Condensed', className: 'font-saira' },
    { name: 'Teko', className: 'font-teko' },
    { name: 'Michroma', className: 'font-michroma' },
    { name: 'Audiowide', className: 'font-audiowide' },
    { name: 'Quantico', className: 'font-quantico' },
    { name: 'Electrolize', className: 'font-electrolize' },
    { name: 'Russo One', className: 'font-russo' },
    { name: 'Exo 2', className: 'font-exo' }
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <Link href="/" className="text-yellow-500 hover:text-yellow-400 mb-8 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-4xl font-bold text-yellow-500 mb-8 text-center">
        Essence Label Font Comparison
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {fonts.map((font, index) => (
          <div key={index} className="bg-gray-900/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-800 rounded-full mb-4 flex items-center justify-center">
              <div className="w-16 h-20 bg-gradient-to-b from-amber-600/30 to-amber-900/30 rounded-lg"></div>
            </div>

            <div className={`${font.className} text-2xl font-bold text-yellow-500 mb-2 tracking-wider`}>
              PLASTIK
            </div>

            <div className="text-xs text-gray-500 mb-4">{font.name}</div>

            <div className="w-full bg-black/50 border border-cyan-500/30 rounded p-2 text-center">
              <div className="text-xs text-cyan-400 uppercase">Stock</div>
              <div className="text-xl font-bold text-cyan-400">1.1</div>
              <div className="text-xs text-gray-500">ESSENCE</div>
            </div>

            <div className="w-full bg-black/50 border border-yellow-500/30 rounded p-2 text-center mt-2">
              <div className="text-xs text-yellow-600 uppercase">Price</div>
              <div className="text-xl font-bold text-yellow-500">150g</div>
              <div className="text-xs text-gray-500">EACH</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
