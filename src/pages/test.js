import dynamic from 'next/dynamic';

const AzureSpeechChat = dynamic(() => import('@/components/AzureSpeechChat'), {
  ssr: false,
});

export default function TestPage() {
  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Speech Chat Test</h1>
      <AzureSpeechChat />
    </div>
  );
}

