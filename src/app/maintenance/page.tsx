import GeneratingLoader from '@/components/loaders/GeneratingLoader';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Content floating against background */}
      <div className="text-center space-y-8">
        {/* Generating Loader - 2x scale */}
        <div className="flex items-center justify-center" style={{ transform: 'scale(2)' }}>
          <GeneratingLoader text="Under Construction" />
        </div>

        {/* Message - floating */}
        <p className="text-gray-400 text-sm leading-relaxed mt-16">
          Mek Tycoon is being built.
        </p>
      </div>
    </div>
  );
}
