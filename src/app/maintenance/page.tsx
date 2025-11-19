import GeneratingLoader from '@/components/loaders/GeneratingLoader';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Clean Modal Card */}
        <div className="relative bg-gray-900/60 backdrop-blur-md rounded-2xl p-8 md:p-10 border border-gray-700/50 shadow-2xl">
          {/* Content */}
          <div className="text-center space-y-6">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Under Construction
            </h1>

            {/* Divider */}
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent mx-auto my-6"></div>

            {/* Generating Loader */}
            <div className="flex items-center justify-center py-4">
              <GeneratingLoader text="Under Construction" />
            </div>

            {/* Message */}
            <div className="text-gray-400 text-sm leading-relaxed">
              <p>
                Mek Tycoon is being built.
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">In Progress</span>
            </div>

            {/* Footer Link */}
            <div className="pt-6 border-t border-gray-700/50">
              <p className="text-gray-500 text-xs">
                Follow updates on{' '}
                <a
                  href="https://discord.gg/mektycoon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-500 hover:text-yellow-400 underline font-medium transition-colors"
                >
                  Discord
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
