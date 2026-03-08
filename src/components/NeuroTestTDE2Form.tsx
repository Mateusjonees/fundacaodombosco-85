import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Info, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type TDE2Results } from '@/data/neuroTests/tde2';

interface Props {
  patientAge: number;
  onResultsChange: (results: TDE2Results | null) => void;
  onRemove?: () => void;
}

const classOptions = ['Superior', 'Médio', 'Inferior', 'Muito Inferior'];

export default function NeuroTestTDE2Form({ patientAge, onResultsChange, onRemove }: Props) {
  const [escrita, setEscrita] = useState<string>('');
  const [aritmetica, setAritmetica] = useState<string>('');
  const [leitura, setLeitura] = useState<string>('');
  const [classEscrita, setClassEscrita] = useState<string>('');
  const [classAritmetica, setClassAritmetica] = useState<string>('');
  const [classLeitura, setClassLeitura] = useState<string>('');
  const [classTotal, setClassTotal] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const e = parseInt(escrita);
    const a = parseInt(aritmetica);
    const l = parseInt(leitura);
    if (!isNaN(e) && !isNaN(a) && !isNaN(l) && classEscrita && classAritmetica && classLeitura && classTotal) {
      const total = e + a + l;
      onResultsChange({
        rawScores: { escrita: e, aritmetica: a, leitura: l, totalScore: total },
        classifications: { escrita: classEscrita, aritmetica: classAritmetica, leitura: classLeitura, totalScore: classTotal },
        notes: `Total: ${total} | Escrita: ${classEscrita} | Aritmética: ${classAritmetica} | Leitura: ${classLeitura}`
      });
    } else {
      onResultsChange(null);
    }
  }, [escrita, aritmetica, leitura, classEscrita, classAritmetica, classLeitura, classTotal]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            TDE-II - Teste de Desempenho Escolar
          </CardTitle>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Avalia desempenho em escrita, aritmética e leitura • 1º-9º ano</p>
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
              <p>• Aplicação individual ou coletiva (exceto Leitura).</p>
              <p>• Subteste Escrita: ditado de palavras. Subteste Aritmética: cálculos escritos.</p>
              <p>• Subteste Leitura: leitura de palavras isoladas (aplicação individual).</p>
              <p>• A classificação deve ser consultada nas tabelas normativas do manual por ano escolar.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pontuação e Classificação</Label>
          {[
            { label: 'Escrita', value: escrita, setValue: setEscrita, classValue: classEscrita, setClass: setClassEscrita },
            { label: 'Aritmética', value: aritmetica, setValue: setAritmetica, classValue: classAritmetica, setClass: setClassAritmetica },
            { label: 'Leitura', value: leitura, setValue: setLeitura, classValue: classLeitura, setClass: setClassLeitura },
          ].map(item => (
            <div key={item.label} className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{item.label} (Escore Bruto)</Label>
                <Input type="number" min="0" value={item.value} onChange={(e) => item.setValue(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Classificação {item.label}</Label>
                <Select value={item.classValue} onValueChange={item.setClass}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Total</Label>
              <Badge variant="outline" className="mt-1">{(parseInt(escrita) || 0) + (parseInt(aritmetica) || 0) + (parseInt(leitura) || 0)}</Badge>
            </div>
            <div>
              <Label className="text-xs">Classificação Total</Label>
              <Select value={classTotal} onValueChange={setClassTotal}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
