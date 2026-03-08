import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  REY_TEST, calculateReyResults, isAgeValidForRey, getReyAgeGroup,
  type ReyScores, type ReyResults 
} from '@/data/neuroTests/rey';
import { AlertCircle, Info } from 'lucide-react';

interface NeuroTestReyFormProps {
  patientAge: number;
  onResultsChange: (results: ReyResults | null) => void;
}

const NeuroTestReyForm: React.FC<NeuroTestReyFormProps> = ({ patientAge, onResultsChange }) => {
  const [scores, setScores] = useState<ReyScores>({ copia: 0, memoria: 0 });
  const [results, setResults] = useState<ReyResults | null>(null);
  const isValidAge = isAgeValidForRey(patientAge);

  useEffect(() => {
    if (isValidAge && scores.copia > 0) {
      const calc = calculateReyResults(scores, patientAge);
      setResults(calc);
      onResultsChange(calc);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [scores, patientAge, isValidAge, onResultsChange]);

  const handleChange = (field: keyof ReyScores, value: string) => {
    const num = Math.min(Math.max(parseFloat(value) || 0, 0), 36);
    setScores(prev => ({ ...prev, [field]: num }));
  };

  const getBadgeColor = (cls: string) => {
    switch (cls) {
      case 'Superior': return 'bg-green-600 text-white';
      case 'Média Superior': return 'bg-green-500 text-white';
      case 'Média': return 'bg-blue-500 text-white';
      case 'Média Inferior': return 'bg-yellow-500 text-white';
      case 'Inferior': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!isValidAge) {
    return (
      <Card className="border-destructive">
        <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />{REY_TEST.name} - Idade Inválida</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Este teste é aplicável para pacientes de {REY_TEST.minAge} a {REY_TEST.maxAge} anos. Idade atual: {patientAge} anos.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {REY_TEST.name}
          <Badge variant="outline" className="ml-2">{REY_TEST.minAge}-{REY_TEST.maxAge} anos</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{REY_TEST.fullName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">Faixa etária:</span>{' '}
            <span className="text-muted-foreground">{getReyAgeGroup(patientAge) || '-'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rey-copia">Cópia (0-36 pontos)</Label>
            <Input id="rey-copia" type="number" step="0.5" min="0" max="36"
              value={scores.copia || ''} onChange={e => handleChange('copia', e.target.value)}
              placeholder="Pontos na cópia" />
            <p className="text-xs text-muted-foreground">18 elementos × 2 pontos = máx. 36</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rey-memoria">Memória (0-36 pontos)</Label>
            <Input id="rey-memoria" type="number" step="0.5" min="0" max="36"
              value={scores.memoria || ''} onChange={e => handleChange('memoria', e.target.value)}
              placeholder="Pontos na reprodução de memória" />
            <p className="text-xs text-muted-foreground">Evocação tardia (3 minutos)</p>
          </div>
        </div>

        {results && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Resultados</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Variável</th>
                  <th className="text-center py-2 px-3 font-medium">Bruto</th>
                  <th className="text-center py-2 px-3 font-medium">Percentil</th>
                  <th className="text-center py-2 px-3 font-medium">Classificação</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">Cópia</td>
                    <td className="text-center py-2 px-3">{results.rawScores.copia}</td>
                    <td className="text-center py-2 px-3">P{results.percentiles.copia}</td>
                    <td className="text-center py-2 px-3"><Badge className={getBadgeColor(results.classifications.copia)}>{results.classifications.copia}</Badge></td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">Memória</td>
                    <td className="text-center py-2 px-3">{results.rawScores.memoria}</td>
                    <td className="text-center py-2 px-3">P{results.percentiles.memoria}</td>
                    <td className="text-center py-2 px-3"><Badge className={getBadgeColor(results.classifications.memoria)}>{results.classifications.memoria}</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">Classificação:</p>
              <p>≤5 = Inferior | 6-25 = Média Inferior | 26-74 = Média | 75-94 = Média Superior | ≥95 = Superior</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroTestReyForm;
