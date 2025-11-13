'use client';

import { getMediaUrl } from '@/lib/media-url';

export default function MediaTestPage() {
  const videoUrl = getMediaUrl('/random-images/Everydays_00000.webm');
  const audioUrl = getMediaUrl('/audio/giggliest-girl-1.mp3');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Media Test Page</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl mb-4">Video Test</h2>
          <p className="mb-2">URL: {videoUrl}</p>
          <video
            src={videoUrl}
            controls
            className="w-full max-w-2xl border border-gray-600"
            onError={(e) => console.error('Video error:', e)}
            onLoadStart={() => console.log('Video load started')}
            onLoadedData={() => console.log('Video loaded')}
          />
          <a
            href={videoUrl}
            target="_blank"
            className="block mt-2 text-blue-400 hover:underline"
          >
            Direct video link (test in new tab)
          </a>
        </section>

        <section>
          <h2 className="text-2xl mb-4">Audio Test</h2>
          <p className="mb-2">URL: {audioUrl}</p>
          <audio
            src={audioUrl}
            controls
            className="w-full max-w-2xl"
            onError={(e) => console.error('Audio error:', e)}
            onLoadStart={() => console.log('Audio load started')}
            onLoadedData={() => console.log('Audio loaded')}
          />
          <a
            href={audioUrl}
            target="_blank"
            className="block mt-2 text-blue-400 hover:underline"
          >
            Direct audio link (test in new tab)
          </a>
        </section>

        <section>
          <h2 className="text-2xl mb-4">Debug Info</h2>
          <div className="bg-gray-800 p-4 rounded">
            <p>Video URL: <code className="text-green-400">{videoUrl}</code></p>
            <p>Audio URL: <code className="text-green-400">{audioUrl}</code></p>
            <p>Environment: <code className="text-yellow-400">{process.env.NEXT_PUBLIC_R2_URL ? 'R2 CDN' : 'Local Files'}</code></p>
          </div>
        </section>
      </div>
    </div>
  );
}
