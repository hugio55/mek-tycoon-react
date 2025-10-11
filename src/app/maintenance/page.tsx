export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Industrial Frame */}
        <div className="relative border-2 border-yellow-500/50 bg-black/80 backdrop-blur-sm p-8 md:p-12">
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-yellow-500"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-yellow-500"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-500"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-yellow-500"></div>

          {/* Content */}
          <div className="text-center space-y-6">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 border-4 border-yellow-500 rounded-full flex items-center justify-center bg-yellow-500/10">
                <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-yellow-500 tracking-wider uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              System Maintenance
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-300 tracking-wide">
              Upgrading Mek Infrastructure
            </p>

            {/* Hazard Stripe */}
            <div className="h-2 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent my-8"></div>

            {/* Message */}
            <div className="space-y-4 text-gray-400">
              <p className="text-lg">
                We&apos;re currently performing system upgrades to improve your Mek Tycoon experience.
              </p>
              <p className="text-sm">
                Expected downtime: <span className="text-yellow-500 font-semibold">30-60 minutes</span>
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-3 pt-6">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-sm text-gray-500 uppercase tracking-widest">In Progress</span>
            </div>
          </div>

          {/* Bottom stripe effect */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0"></div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Follow updates on{' '}
            <a
              href="https://twitter.com/MekTycoon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-500 hover:text-yellow-400 underline"
            >
              Twitter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
