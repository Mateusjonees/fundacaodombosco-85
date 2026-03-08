import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  WECHSLER_TEST, calculateWechslerResults, isAgeValidForWechsler, getWechslerVersion,
  type WechslerScores, type WechslerResults 
} from '@/data/neuroTests/wais';
import { AlertCircle, Info } from 'lucide-react';

interface NeuroTestWechslerFormProps {
  patientAge: number;
  onResultsChange: (results: WechslerResults | null) => void;
}

const NeuroTestWechslerForm: React.FC<NeuroTestWechslerFormProps> = ({ patientAge, onResultsChange }) => {
  const [scores, setScores] = useState<WechslerScores>({
    qiTotal: 0, icv: 0, iop: 0, imo: 0, ivp: 0, irf: 0
  });
  const [results, setResults] = useState<WechslerResults | null>(null);
  const isValidAge = isAgeValidForWechsler(patientAge);
  const testVersion = getWechslerVersion(patientAge);

  useEffect(() => {
    if (isValidAge && scores.qiTotal > 0) {
      const calc = calculateWechslerResults(scores, patientAge);
      setResults(calc);
      onResultsChange(calc);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [scores, patientAge, isValidAge, onResultsChange]);

  const handleChange = (field: keyof WechslerScores, value: string) => {
    const num = Math.max(parseInt(value) || 0, 0);
    setScores(prev => ({ ...prev, [field]: num }));
  };

  const getBadgeColor = (cls: string) => {
    switch (cls) {
      case 'Muito Superior': return 'bg-purple-600 text-white';
      case 'Superior': return 'bg-green-600 text-white';
      case 'Média Superior': return 'bg-green-500 text-white';
      case 'Média': return 'bg-blue-500 text-white';
      case 'Média Inferior': return 'bg-yellow-500 text-white';
      case 'Limítrofe': return 'bg-orange-500 text-white';
      case 'Extremamente Baixo': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!isValidAge) {
    return (
      <Card className="border-destructive">
        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />{WECHSLER_TEST.name} - Idade Inválida</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Este teste é aplicável para pacientes de {WECHSLER_TEST.minAge} a {WECHSLER_TEST.maxAge} anos. Idade atual: {patientAge} anos.</p></CardContent>
      </Card>
    );
  }

  const indexRows = [
    { label: 'QI Total (Escala Completa)', key: 'qiTotal' as const, value: scores.qiTotal, required: true },
    { label: 'Compreensão Verbal (ICV)', key: 'icv' as const, value: scores.icv || 0, required: false },
    { label: testVersion === 'WISC-V' ? 'Visuoespacial (IVE)' : 'Organização Perceptual (IOP)', key: 'iop' as const, value: scores.iop || 0, required: false },
    { label: 'Memória Operacional (IMO)', key: 'imo' as const, value: scores.imo || 0, required: false },
    { label: 'Velocidade de Processamento (IVP)', key: 'ivp' as const, value: scores.ivp || 0, required: false },
  ];

  // WISC-V has IRF
  if (testVersion === 'WISC-V') {
    indexRows.push({ label: 'Raciocínio Fluido (IRF)', key: 'irf' as const, value: scores.irf || 0, required: false });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {testVersion}
          <Badge variant="outline" className="ml-2">{WECHSLER_TEST.minAge}-{WECHSLER_TEST.maxAge} anos</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{WECHSLER_TEST.fullName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">Versão:</span>{' '}
            <span className="text-muted-foreground">{testVersion} (M=100, DP=15)</span>
            <br />
            <span className="text-xs text-muted-foreground">Insira os índices compostos já calculados a partir dos subtestes do manual.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indexRows.map(row => (
            <div key={row.key} className="space-y-2">
              <Label htmlFor={`wechsler-${row.key}`}>
                {row.label} {row.required && <span className="text-destructive">*</span>}
              </Label>
              <Input id={`wechsler-${row.key}`} type="number" min="40" max="160"
                value={row.value || ''} onChange={e => handleChange(row.key, e.target.value)}
                placeholder="40-160" />
            </div>
          ))}
        </div>

        {results && (
          <div className="mt-6 space-y-4">
            <Separator />
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Resultados - {results.testVersion}</h4>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Índice</th>
                  <th className="text-center py-2 px-3 font-medium">Pontuação</th>
                  <th className="text-center py-2 px-3 font-medium">Percentil</th>
                  <th className="text-center py-2 px-3 font-medium">Classificação</th>
                </tr></thead>
                <tbody>
                  {indexRows.filter(r => r.value > 0).map(row => (
                    <tr key={row.key} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{row.label}</td>
                      <td className="text-center py-2 px-3">{row.value}</td>
                      <td className="text-center py-2 px-3">
                        P{results.percentiles[row.key] ?? '-'}
                      </td>
                      <td className="text-center py-2 px-3">
                        <Badge className={getBadgeColor(results.classifications[row.key] || '')}>
                          {results.classifications[row.key] || '-'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">Classificação Wechsler:</p>
              <p>≥130 = Muito Superior | 120-129 = Superior | 110-119 = Média Superior | 90-109 = Média | 80-89 = Média Inferior | 70-79 = Limítrofe | ≤69 = Extremamente Baixo</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroTestWechslerForm;
