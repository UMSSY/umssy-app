import { MatchScoreBar } from '@/components/match-score-bar';

export default function TestMatchingPage() {
  return (
    <div className="p-8 max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[#0B1F2E]">Prueba de Match Score Bar</h1>
      <MatchScoreBar score={85} size="md" />
      <MatchScoreBar score={45} size="sm" />
      <MatchScoreBar score={95} size="lg" />
    </div>
  );
}