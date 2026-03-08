import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateACE3Results, type ACE3Results } from '@/data/neuroTests/ace3';

interface Props {
  patientAge: number;
  onResultsChange: (results: ACE3Results | null) => void;
}

const domains = [
  { key: 'atencao', label: 'Atenção (0-18)', max: 18 },
  { key: 'memoria', label: 'Memória (0-26)', max: 26 },
  { key: 'fluencia', label: 'Fluência (0-14)', max: 14 },
  { key: 'linguagem', label: 'Linguagem (0-26)', max: 26 },
  { key: 'visuoespacial', label: 'Visuoespacial (0-16)', max: 16 },
];

export default function NeuroTestACE3Form({ patientAge, onResultsChange }: Props) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [educationYears, setEducationYears] = useState<string>('');

  useEffect(() => {
    const edu = parseInt(educationYears);
    if (isNaN(edu) || edu < 0) { onResultsChange(null); return; }
    const parsed: Record<string, number> = { educationYears: edu };
    for (const d of domains) {
      const v = parseInt(scores[d.key] || '');
      if (isNaN(v) || v < 0 || v > d.max) { onResultsChange(null); return; }
      parsed[d.key] = v;
    }
    onResultsChange(calculateACE3Results(parsed as any));
  }, [scores, educationYears]);

  const total = domains.reduce((s, d) => s + (parseInt(scores[d.key] || '0') || 0), 0);

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Possível')) return 'bg-yellow-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          ACE-III - Addenbrooke's Cognitive Examination
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Anos de Escolaridade</Label>
          <Input type="number" min="0" max="30" value={educationYears} onChange={(e) => setEducationYears(e.target.value)} placeholder="Ex: 8" className="h-9 max-w-[200px]" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {domains.map(d => (
            <div key={d.key}>
              <Label className="text-xs">{d.label}</Label>
              <Input type="number" min="0" max={d.max} value={scores[d.key] || ''} onChange={(e) => setScores(prev => ({ ...prev, [d.key]: e.target.value }))} className="h-9" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Total: {total}/100</Badge>
          {!isNaN(parseInt(educationYears)) && parseInt(educationYears) >= 0 && (
            <Badge className={getColor(calculateACE3Results({ ...Object.fromEntries(domains.map(d => [d.key, parseInt(scores[d.key] || '0') || 0])), educationYears: parseInt(educationYears) } as any)?.severity || '')}>
              {calculateACE3Results({ ...Object.fromEntries(domains.map(d => [d.key, parseInt(scores[d.key] || '0') || 0])), educationYears: parseInt(educationYears) } as any)?.severity}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
