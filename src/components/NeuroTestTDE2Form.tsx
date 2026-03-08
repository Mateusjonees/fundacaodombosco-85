import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type TDE2Results } from '@/data/neuroTests/tde2';

interface Props {
  patientAge: number;
  onResultsChange: (results: TDE2Results | null) => void;
}

const classOptions = ['Superior', 'Médio', 'Inferior', 'Muito Inferior'];

export default function NeuroTestTDE2Form({ patientAge, onResultsChange }: Props) {
  const [escrita, setEscrita] = useState<string>('');
  const [aritmetica, setAritmetica] = useState<string>('');
  const [leitura, setLeitura] = useState<string>('');
  const [classEscrita, setClassEscrita] = useState<string>('');
  const [classAritmetica, setClassAritmetica] = useState<string>('');
  const [classLeitura, setClassLeitura] = useState<string>('');
  const [classTotal, setClassTotal] = useState<string>('');

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

  const getColor = (c: string) => {
    if (c === 'Superior') return 'bg-green-600 text-white';
    if (c === 'Médio') return 'bg-blue-600 text-white';
    if (c === 'Inferior') return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          TDE-II - Teste de Desempenho Escolar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          { label: 'Escrita', value: escrita, setValue: setEscrita, classValue: classEscrita, setClass: setClassEscrita },
          { label: 'Aritmética', value: aritmetica, setValue: setAritmetica, classValue: classAritmetica, setClass: setClassAritmetica },
          { label: 'Leitura', value: leitura, setValue: setLeitura, classValue: classLeitura, setClass: setClassLeitura },
        ].map(item => (
          <div key={item.label} className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{item.label} (Escore Bruto)</Label>
              <Input type="number" min="0" value={item.value} onChange={(e) => item.setValue(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Classificação {item.label}</Label>
              <Select value={item.classValue} onValueChange={item.setClass}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
            <Badge variant="outline">{(parseInt(escrita) || 0) + (parseInt(aritmetica) || 0) + (parseInt(leitura) || 0)}</Badge>
          </div>
          <div>
            <Label className="text-xs">Classificação Total</Label>
            <Select value={classTotal} onValueChange={setClassTotal}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
