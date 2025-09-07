'use client';

export default function RecipeRequirements() {
  const requirements = [
    {
      icon: '📦',
      name: 'Clean Essence',
      current: 5,
      required: 5,
      hasEnough: true,
      percentFilled: 100
    },
    {
      icon: '💎',
      name: 'Accordion Essence',
      current: 1.5,
      required: 3,
      hasEnough: false,
      percentFilled: 50
    },
    {
      icon: '✨',
      name: 'Mixed Essence',
      current: 15,
      required: 1,
      hasEnough: true,
      percentFilled: 100
    }
  ];

  return (
    <div 
      className="p-6 rounded-lg mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(42, 42, 42, 0.6) 100%)',
        border: '2px solid #6b7280',
        boxShadow: '0 4px 20px rgba(107, 114, 128, 0.3)',
      }}
    >
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Recipe Requirements</h3>
      <div className="space-y-4">
        {requirements.map((req, index) => (
          <div key={index} className="relative">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{req.icon}</span>
              </div>
              <div className="flex-1 max-w-[calc(100%-120px)]">
                <div className="text-sm font-medium text-white mb-2">{req.name}</div>
                <div className="relative h-6 bg-gray-900 rounded-full overflow-hidden">
                  {req.hasEnough ? (
                    <div 
                      className="h-full bg-green-500 relative overflow-hidden"
                      style={{ 
                        width: `${req.percentFilled}%`,
                        boxShadow: '0 0 15px rgba(0, 255, 68, 0.6)',
                      }}
                    >
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        style={{
                          animation: 'shimmer 2s linear infinite',
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Green portion */}
                      <div 
                        className="absolute left-0 h-full bg-green-500 overflow-hidden"
                        style={{ 
                          width: `${(req.current / req.required) * 100}%`,
                          boxShadow: '0 0 15px rgba(0, 255, 68, 0.6)',
                        }}
                      >
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          style={{
                            animation: 'shimmer 2s linear infinite',
                          }}
                        />
                      </div>
                      {/* Red portion */}
                      <div 
                        className="absolute h-full overflow-hidden"
                        style={{
                          left: `${(req.current / req.required) * 100}%`,
                          width: `${((req.required - req.current) / req.required) * 100}%`,
                          background: 'linear-gradient(90deg, rgba(255, 68, 0, 0.9) 0%, rgba(255, 100, 0, 1) 50%, rgba(255, 68, 0, 0.9) 100%)',
                          boxShadow: '0 0 25px rgba(255, 68, 0, 0.8), inset 0 0 10px rgba(255, 150, 0, 0.5)',
                          animation: 'pulsateStrong 1.2s ease-in-out infinite',
                        }}
                      >
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent"
                          style={{
                            animation: 'redPulse 1.5s linear infinite',
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Current: {req.current}</span>
                  <span className="text-xs font-semibold text-white">Required: {req.required}</span>
                </div>
              </div>
              {req.hasEnough ? (
                <div className="text-green-500 text-xl">✓</div>
              ) : (
                <button className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-black text-xs font-bold rounded-lg transition-all hover:shadow-lg">
                  BUY
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}