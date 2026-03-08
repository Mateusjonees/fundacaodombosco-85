import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { calculateWMSResults, type WMSResults } from '@/data/neuroTests/wms';

interface Props {
  patientAge: number;
  onResultsChange: (results: WMSResults | null) => void;
}

export default function NeuroTestWMSForm({ patientAge, onResultsChange }: Props) {
  const [memoriaImediata, setMemoriaImediata] = useState<string>('');
  const [memoriaTargia, setMemoriaTargia] = useState<string>('');
  const [memoriaTrabalho, setMemoriaTrabalho] = useState<string>('');
  const [reconhecimentoVisual, setReconhecimentoVisual] = useState<string>('');

  useEffect(() => {
    const mi = parseInt(memoriaImediata);
    const mt = parseInt(memoriaTargia);
    const mtrab = parseInt(memoriaTrabalho);
    const rv = parseInt(reconhecimentoVisual);
    if ([mi, mt, mtrab, rv].some(v => !isNaN(v) && v > 0)) {
      onResultsChange(calculateWMSResults(mi || 0, mt || 0, mtrab || 0, rv || 0));
    } else {
      onResultsChange(null);
    }
  }, [memoriaImediata, memoriaTargia, memoriaTrabalho, reconhecimentoVisual]);

  const getClassColor = (classification: string) => {
    if (classification.includes('Extremamente') || classification === 'Limítrofe') return 'bg-destructive text-destructive-foreground';
    if (classification === 'Médio Inferior') return 'bg-orange-500 text-white';
    if (classification === 'Médio') return 'bg-primary text-primary-foreground';
    if (classification === 'Médio Superior' || classification === 'Superior') return 'bg-green-600 text-white';
    if (classification === 'Muito Superior') return 'bg-green-700 text-white';
    return 'bg-muted';
  };

  const mi = parseInt(memoriaImediata);
  const mt = parseInt(memoriaTargia);
  const mtrab = parseInt(memoriaTrabalho);
  const rv = parseInt(reconhecimentoVisual);
  const hasData = [mi, mt, mtrab, rv].some(v => !isNaN(v) && v > 0);
  const results = hasData ? calculateWMSResults(mi || 0, mt || 0, mtrab || 0, rv || 0) : null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          WMS-IV - Escala de Memória Wechsler - {patientAge} anos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Insira os índices padronizados (M=100, DP=15)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Memória Imediata</Label>
            <Input type="number" min="40" max="160" value={memoriaImediata} onChange={(e) => setMemoriaImediata(e.target.value)} placeholder="100" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Memória Tardia</Label>
            <Input type="number" min="40" max="160" value={memoriaTargia} onChange={(e) => setMemoriaTargia(e.target.value)} placeholder="100" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Memória de Trabalho</Label>
            <Input type="number" min="40" max="160" value={memoriaTrabalho} onChange={(e) => setMemoriaTrabalho(e.target.value)} placeholder="100" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Reconhecimento Visual</Label>
            <Input type="number" min="40" max="160" value={reconhecimentoVisual} onChange={(e) => setReconhecimentoVisual(e.target.value)} placeholder="100" className="h-9" />
          </div>
        </div>
        {results && (
          <div className="flex flex-wrap gap-2 mt-2">
            {mi > 0 && <Badge className={getClassColor(results.classifications.memoriaImediata)}>MI: {results.classifications.memoriaImediata}</Badge>}
            {mt > 0 && <Badge className={getClassColor(results.classifications.memoriaTargia)}>MT: {results.classifications.memoriaTargia}</Badge>}
            {mtrab > 0 && <Badge className={getClassColor(results.classifications.memoriaTrabalho)}>MTrab: {results.classifications.memoriaTrabalho}</Badge>}
            {rv > 0 && <Badge className={getClassColor(results.classifications.reconhecimentoVisual)}>RV: {results.classifications.reconhecimentoVisual}</Badge>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
