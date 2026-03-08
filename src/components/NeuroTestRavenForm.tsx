import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateRavenResults, type RavenResults } from '@/data/neuroTests/raven';

interface Props {
  patientAge: number;
  onResultsChange: (results: RavenResults | null) => void;
  onRemove?: () => void;
}

export default function NeuroTestRavenForm({ patientAge, onResultsChange, onRemove }: Props) {
  const isColorida = patientAge <= 11;
  const [serieA, setSerieA] = useState<string>('');
  const [serieAb, setSerieAb] = useState<string>('');
  const [serieB, setSerieB] = useState<string>('');
  const [serieC, setSerieC] = useState<string>('');
  const [serieD, setSerieD] = useState<string>('');
  const [serieE, setSerieE] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const a = parseInt(serieA) || 0;
    const ab = parseInt(serieAb) || 0;
    const b = parseInt(serieB) || 0;
    const c = parseInt(serieC) || 0;
    const d = parseInt(serieD) || 0;
    const e = parseInt(serieE) || 0;

    const total = isColorida ? a + ab + b : a + b + c + d + e;

    if (total > 0) {
      const results = calculateRavenResults(total, patientAge, {
        serieA: a, serieAb: isColorida ? ab : undefined, serieB: b,
        serieC: !isColorida ? c : undefined, serieD: !isColorida ? d : undefined, serieE: !isColorida ? e : undefined,
        total
      });
      onResultsChange(results);
    } else {
      onResultsChange(null);
    }
  }, [serieA, serieAb, serieB, serieC, serieD, serieE, patientAge]);

  const getTotal = () => {
    const a = parseInt(serieA) || 0;
    const ab = parseInt(serieAb) || 0;
    const b = parseInt(serieB) || 0;
    const c = parseInt(serieC) || 0;
    const d = parseInt(serieD) || 0;
    const e = parseInt(serieE) || 0;
    return isColorida ? a + ab + b : a + b + c + d + e;
  };

  const total = getTotal();
  const results = total > 0 ? calculateRavenResults(total, patientAge, { serieA: parseInt(serieA) || 0, serieB: parseInt(serieB) || 0, total }) : null;

  const getClassColor = (percentile: number) => {
    if (percentile <= 10) return 'bg-destructive text-destructive-foreground';
    if (percentile <= 25) return 'bg-orange-500 text-white';
    if (percentile >= 75) return 'bg-green-600 text-white';
    return 'bg-primary text-primary-foreground';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Matrizes de Raven ({isColorida ? 'Colorida' : 'Geral'})
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isColorida ? 'Avalia inteligência não-verbal • 5-11 anos' : 'Avalia inteligência geral não-verbal • 12+ anos'} • {patientAge} anos
        </p>
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
              {isColorida ? (
                <>
                  <p>• Versão Colorida (CPM): 3 séries (A, Ab, B) com 12 itens cada = 36 itens.</p>
                  <p>• Apresentar o caderno aberto, apontar o padrão incompleto e pedir para escolher a peça que completa.</p>
                  <p>• Sem limite de tempo. Aplicação individual.</p>
                </>
              ) : (
                <>
                  <p>• Versão Geral (SPM): 5 séries (A, B, C, D, E) com 12 itens cada = 60 itens.</p>
                  <p>• O paciente deve identificar a peça que completa o padrão em cada item.</p>
                  <p>• Duração: 40-60 minutos. Aplicação individual ou coletiva.</p>
                </>
              )}
              <p>• Cada série aumenta em dificuldade progressivamente.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Pontuação por Série */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação por Série (0-12 cada)</Label>
          <div className={`grid gap-3 ${isColorida ? 'grid-cols-3' : 'grid-cols-5'}`}>
            <div>
              <Label className="text-xs sm:text-sm">Série A</Label>
              <Input type="number" min="0" max="12" value={serieA} onChange={(e) => setSerieA(e.target.value)} placeholder="0-12" className="h-9 mt-1" />
            </div>
            {isColorida && (
              <div>
                <Label className="text-xs sm:text-sm">Série Ab</Label>
                <Input type="number" min="0" max="12" value={serieAb} onChange={(e) => setSerieAb(e.target.value)} placeholder="0-12" className="h-9 mt-1" />
              </div>
            )}
            <div>
              <Label className="text-xs sm:text-sm">Série B</Label>
              <Input type="number" min="0" max="12" value={serieB} onChange={(e) => setSerieB(e.target.value)} placeholder="0-12" className="h-9 mt-1" />
            </div>
            {!isColorida && (
              <>
                <div>
                  <Label className="text-xs sm:text-sm">Série C</Label>
                  <Input type="number" min="0" max="12" value={serieC} onChange={(e) => setSerieC(e.target.value)} placeholder="0-12" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Série D</Label>
                  <Input type="number" min="0" max="12" value={serieD} onChange={(e) => setSerieD(e.target.value)} placeholder="0-12" className="h-9 mt-1" />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Série E</Label>
                  <Input type="number" min="0" max="12" value={serieE} onChange={(e) => setSerieE(e.target.value)} placeholder="0-12" className="h-9 mt-1" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resultado */}
        {results && (
          <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resultado</Label>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-xs">Total: {total}/{isColorida ? 36 : 60}</Badge>
              <Badge variant="outline" className="text-xs">P{results.percentiles.total}</Badge>
              <Badge className={`${getClassColor(results.percentiles.total)} text-xs`}>
                {results.classifications.total}
              </Badge>
            </div>
          </div>
        )}

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
