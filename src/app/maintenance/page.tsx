import GeneratingLoader from '@/components/loaders/GeneratingLoader';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Content floating against background */}
      <div className="text-center space-y-8">
        {/* Generating Loader - 2x scale */}
        <div className="flex items-center justify-center" style={{ transform: 'scale(2)' }}>
          <GeneratingLoader
            text="Mek Tycoon is being built."
            colorScheme={{
              primary: '#00d9ff',
              secondary: '#0284c7',
              tertiary: '#38bdf8',
              accent: '#7dd3fc'
            }}
          />
        </div>
      </div>
    </div>
  );
}
