import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateGDSResults, type GDSResults } from '@/data/neuroTests/gds';

interface Props {
  patientAge: number;
  onResultsChange: (results: GDSResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestGDSForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [totalScore, setTotalScore] = useState<string>('');
  const [version, setVersion] = useState<'15' | '30'>('15');
  const [showInstructions, setShowInstructions] = useState(false);

  const maxScore = version === '15' ? 15 : 30;

  useEffect(() => {
    const score = parseInt(totalScore);
    if (!isNaN(score) && score >= 0 && score <= maxScore) {
      onResultsChange(calculateGDSResults(score, version));
    } else {
      onResultsChange(null);
    }
  }, [totalScore, version]);

  const score = parseInt(totalScore);
  const isValid = !isNaN(score) && score >= 0 && score <= maxScore;

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Leve')) return 'bg-yellow-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            GDS - Escala de Depressão Geriátrica
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Rastreamento de depressão em idosos • Versões de 15 ou 30 itens</p>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline w-full">
              <Info className="h-3 w-3" />
              <span>Instruções de aplicação</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showInstructions ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-2.5 bg-muted/40 rounded-lg text-xs text-muted-foreground space-y-1">
              <p>• Aplicação individual, 5-10 minutos.</p>
              <p>• Resposta: Sim/Não. Cada resposta indicativa de depressão = 1 ponto.</p>
              <p>• <strong>GDS-15:</strong> 0-5: Normal | 6-10: Leve | 11-15: Grave.</p>
              <p>• <strong>GDS-30:</strong> 0-10: Normal | 11-20: Leve | 21-30: Grave.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Versão</Label>
              <Select value={version} onValueChange={(v) => { setVersion(v as '15' | '30'); setTotalScore(''); }}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">GDS-15 (15 itens)</SelectItem>
                  <SelectItem value="30">GDS-30 (30 itens)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Escore Total (0-{maxScore})</Label>
              <Input type="number" min="0" max={maxScore} value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder={`0-${maxScore}`} className="h-9 mt-1" />
            </div>
          </div>
        </div>

        {isValid && (() => {
          const results = calculateGDSResults(score, version);
          return (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{score}/{maxScore}</Badge>
                <Badge className={getColor(results.severity)}>{results.severity}</Badge>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
