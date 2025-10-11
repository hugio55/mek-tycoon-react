import { WalletInfo } from '@/hooks/useAvailableWallets';

interface WalletSelectorProps {
  availableWallets: WalletInfo[];
  onWalletSelect: (wallet: WalletInfo) => void;
  isConnecting: boolean;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export default function WalletSelector({
  availableWallets,
  onWalletSelect,
  isConnecting,
  onCancel,
  title = "Select Wallet",
  description = "Choose which wallet extension to connect"
}: WalletSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-yellow-400 text-lg font-bold uppercase tracking-wider mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-400 text-xs">
            {description}
          </p>
        )}
      </div>

      {availableWallets.length > 0 ? (
        <div className={availableWallets.length === 1 ? "flex justify-center" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
          {availableWallets.map(wallet => (
            <button
              key={wallet.name}
              onClick={() => onWalletSelect(wallet)}
              disabled={isConnecting}
              className={`group relative bg-black/30 border border-yellow-500/20 text-yellow-500 px-4 py-3 sm:px-6 sm:py-4 transition-all hover:bg-yellow-500/5 hover:border-yellow-500/40 active:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider sm:tracking-widest font-['Orbitron'] font-bold backdrop-blur-sm overflow-hidden min-h-[48px] touch-manipulation ${availableWallets.length === 1 ? 'w-64' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-yellow-500/40" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-yellow-500/40" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-yellow-500/40" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-yellow-500/40" />
              <span className="relative z-10">{wallet.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-black/30 border border-gray-700 rounded p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">No wallet extensions detected</p>
          <p className="text-gray-500 text-xs">
            Please install a Cardano wallet extension and refresh the page
          </p>
        </div>
      )}

      {onCancel && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onCancel}
            disabled={isConnecting}
            className="bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-500 text-white text-xs font-semibold uppercase tracking-wider rounded px-6 py-2 hover:from-gray-700 hover:to-gray-800 transition-all disabled:opacity-50"
          >
            ← Back
          </button>
        </div>
      )}

      {isConnecting && (
        <div className="text-center">
          <p className="text-yellow-400 text-sm animate-pulse">
            Connecting to wallet...
          </p>
        </div>
      )}
    </div>
  );
}
