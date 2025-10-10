import { TimeClock } from '@/components/TimeClock';

export default function Timesheet() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ponto Eletrônico</h1>
      <TimeClock />
    </div>
  );
}