import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateMoCAResults, type MoCAResults } from '@/data/neuroTests/moca';

interface Props {
  patientAge: number;
  onResultsChange: (results: MoCAResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestMoCAForm({ patientAge, onResultsChange, onRemove }: Props) {
  const [totalScore, setTotalScore] = useState<string>('');
  const [educationYears, setEducationYears] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const score = parseInt(totalScore);
    const edu = parseInt(educationYears);
    if (!isNaN(score) && score >= 0 && score <= 30 && !isNaN(edu) && edu >= 0) {
      onResultsChange(calculateMoCAResults(score, edu));
    } else {
      onResultsChange(null);
    }
  }, [totalScore, educationYears]);

  const score = parseInt(totalScore);
  const edu = parseInt(educationYears);
  const isValid = !isNaN(score) && score >= 0 && score <= 30 && !isNaN(edu) && edu >= 0;

  const getColor = (c: string) => {
    if (c === 'Normal') return 'bg-green-600 text-white';
    if (c.includes('Leve')) return 'bg-yellow-500 text-white';
    if (c.includes('Moderado')) return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            MoCA - Montreal Cognitive Assessment
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Rastreio cognitivo breve • 55-85+ anos • Duração: ~10 min</p>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Instruções */}
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
              <p>• Avalia 8 domínios: visuoespacial, nomeação, memória, atenção, linguagem, abstração, evocação e orientação.</p>
              <p>• Aplicação individual. O examinador segue o protocolo oficial MoCA.</p>
              <p>• Adicionar 1 ponto se escolaridade ≤12 anos (máximo 30).</p>
              <p>• Ponto de corte sugerido: ≥26 = normal.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Dados do Paciente */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dados de Entrada</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Escore Total (0-30)</Label>
              <Input type="number" min="0" max="30" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} placeholder="0-30" className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Anos de Escolaridade</Label>
              <Input type="number" min="0" max="30" value={educationYears} onChange={(e) => setEducationYears(e.target.value)} placeholder="Ex: 12" className="h-9 mt-1" />
            </div>
          </div>
        </div>

        {/* Resultado */}
        {isValid && (() => {
          const results = calculateMoCAResults(score, edu);
          return (
            <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-xs">{score}/30</Badge>
                {edu <= 12 && <Badge variant="outline" className="text-xs">Ajustado: {results.calculatedScores.adjustedScore}/30</Badge>}
                <Badge className={`${getColor(results.severity)} text-xs`}>{results.severity}</Badge>
              </div>
            </div>
          );
        })()}

        {/* Referência */}
        <div className="grid grid-cols-4 gap-1.5 text-[10px]">
          <div className="p-1.5 bg-green-600/10 rounded text-center">
            <span className="font-medium text-green-700">≥26</span>
            <p className="text-muted-foreground">Normal</p>
          </div>
          <div className="p-1.5 bg-yellow-500/10 rounded text-center">
            <span className="font-medium text-yellow-700">22-25</span>
            <p className="text-muted-foreground">DCL</p>
          </div>
          <div className="p-1.5 bg-orange-500/10 rounded text-center">
            <span className="font-medium text-orange-700">17-21</span>
            <p className="text-muted-foreground">Moderado</p>
          </div>
          <div className="p-1.5 bg-red-500/10 rounded text-center">
            <span className="font-medium text-red-700">&lt;17</span>
            <p className="text-muted-foreground">Grave</p>
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-1">
          <Label className="text-xs">Obs. do Teste</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comportamento durante a aplicação, dificuldades observadas..."
            className="min-h-[50px] resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
