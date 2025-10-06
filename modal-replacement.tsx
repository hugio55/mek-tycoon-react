/* REPLACE the single "Wallet Instructions Modal" section (around line 2380) with these THREE modals: */

                {/* Connection Status Modal - Dismissible */}
                {showConnectionStatus && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={cancelConnection}
                  >
                    {/* Modal content */}
                    <div
                      className="relative bg-gray-900 border-2 border-yellow-500/50 p-6 max-w-md w-full shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-yellow-500" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-yellow-500" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-yellow-500" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-500" />

                      {/* Close button */}
                      <button
                        onClick={cancelConnection}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors border border-yellow-500/30 hover:border-yellow-500/60"
                        aria-label="Cancel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Header */}
                      <div className="mb-4 pr-8">
                        <h3 className="text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-lg font-bold">
                          Connecting Wallet
                        </h3>
                        <div className="h-px bg-gradient-to-r from-yellow-500/50 to-transparent mt-2" />
                      </div>

                      {/* Status with spinner */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                        <div className="text-gray-300 text-sm leading-relaxed font-mono">
                          {connectionStatus}
                        </div>
                      </div>

                      {/* Cancel button */}
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={cancelConnection}
                          className="px-6 py-2 border-2 border-gray-600 text-gray-400 hover:bg-gray-600/10 font-['Orbitron'] uppercase tracking-wider text-sm transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Instructions Modal - Full screen overlay */}
                {walletInstructions && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setWalletInstructions(null)}
                  >
                    {/* Modal content */}
                    <div
                      className="relative bg-gray-900 border-2 border-yellow-500/50 p-6 max-w-md w-full shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-yellow-500" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-yellow-500" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-yellow-500" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-500" />

                      {/* Close button */}
                      <button
                        onClick={() => setWalletInstructions(null)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors border border-yellow-500/30 hover:border-yellow-500/60"
                        aria-label="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Header */}
                      <div className="mb-4 pr-8">
                        <h3 className="text-yellow-500 font-['Orbitron'] uppercase tracking-wider text-lg font-bold">
                          Connection Instructions
                        </h3>
                        <div className="h-px bg-gradient-to-r from-yellow-500/50 to-transparent mt-2" />
                      </div>

                      {/* Instructions */}
                      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line font-mono">
                        {walletInstructions}
                      </div>

                      {/* Bottom close button */}
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={() => setWalletInstructions(null)}
                          className="px-6 py-2 border-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 font-['Orbitron'] uppercase tracking-wider text-sm transition-all"
                        >
                          Got It
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Error Modal - For actual errors (red) */}
                {walletError && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setWalletError(null)}
                  >
                    {/* Modal content */}
                    <div
                      className="relative bg-gray-900 border-2 border-red-500/50 p-6 max-w-md w-full shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-red-500" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-red-500" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-red-500" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-red-500" />

                      {/* Close button */}
                      <button
                        onClick={() => setWalletError(null)}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/30 hover:border-red-500/60"
                        aria-label="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Header */}
                      <div className="mb-4 pr-8">
                        <h3 className="text-red-500 font-['Orbitron'] uppercase tracking-wider text-lg font-bold">
                          Connection Error
                        </h3>
                        <div className="h-px bg-gradient-to-r from-red-500/50 to-transparent mt-2" />
                      </div>

                      {/* Error message */}
                      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line font-mono">
                        {walletError}
                      </div>

                      {/* Bottom close button */}
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={() => setWalletError(null)}
                          className="px-6 py-2 border-2 border-red-500/50 text-red-500 hover:bg-red-500/10 font-['Orbitron'] uppercase tracking-wider text-sm transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
