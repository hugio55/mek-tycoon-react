import ClaudeMdSummary from '@/components/ClaudeMdSummary';

export const metadata = {
  title: 'CLAUDE.md Viewer - Mek Tycoon',
  description: 'View and analyze CLAUDE.md project instructions',
};

export default function ClaudeMdViewerPage() {
  return (
    <div className="min-h-screen bg-black">
      <ClaudeMdSummary />
    </div>
  );
}
