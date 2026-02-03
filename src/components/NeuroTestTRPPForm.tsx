import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  TRPPResults,
  calculateTRPPResults,
  isAgeValidForTRPP,
  getTRPPClassificationColor
} from '@/data/neuroTests/trpp';

interface NeuroTestTRPPFormProps {
  patientAge: number;
  onResultsChange: (results: TRPPResults | null) => void;
}

export default function NeuroTestTRPPForm({ patientAge, onResultsChange }: NeuroTestTRPPFormProps) {
  const [palavras, setPalavras] = useState<string>('');
  const [pseudopalavras, setPseudopalavras] = useState<string>('');
  const [results, setResults] = useState<TRPPResults | null>(null);

  const isValidAge = isAgeValidForTRPP(patientAge);

  useEffect(() => {
    const palavrasNum = parseInt(palavras) || 0;
    const pseudopalavrasNum = parseInt(pseudopalavras) || 0;

    if (palavras !== '' && pseudopalavras !== '' && isValidAge) {
      const calculatedResults = calculateTRPPResults(palavrasNum, pseudopalavrasNum, patientAge);
      setResults(calculatedResults);
      onResultsChange(calculatedResults);
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [palavras, pseudopalavras, patientAge, isValidAge, onResultsChange]);

  if (!isValidAge) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="pt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O teste TRPP é aplicável apenas para pacientes de 3 a 14 anos. 
              Idade do paciente: {patientAge} anos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getClassificationBadge = (classification: string) => {
    const colorClass = getTRPPClassificationColor(classification);
    return (
      <Badge variant="outline" className={colorClass}>
        {classification}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          TRPP - Teste de Repetição de Palavras e Pseudopalavras
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Idade do paciente: {patientAge} anos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entrada de dados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="palavras">Repetição de Palavras (0-10)</Label>
            <Input
              id="palavras"
              type="number"
              min="0"
              max="10"
              value={palavras}
              onChange={(e) => setPalavras(e.target.value)}
              placeholder="Total de acertos"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pseudopalavras">Repetição de Pseudopalavras (0-10)</Label>
            <Input
              id="pseudopalavras"
              type="number"
              min="0"
              max="10"
              value={pseudopalavras}
              onChange={(e) => setPseudopalavras(e.target.value)}
              placeholder="Total de acertos"
            />
          </div>
        </div>

        {/* Tabela de Resultados */}
        {results && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm">Resultados Calculados</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medida</TableHead>
                  <TableHead className="text-center">Pontuação</TableHead>
                  <TableHead className="text-center">Escore Padrão</TableHead>
                  <TableHead className="text-center">Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Repetição de Palavras</TableCell>
                  <TableCell className="text-center">{results.rawScores.palavras}</TableCell>
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Repetição de Pseudopalavras</TableCell>
                  <TableCell className="text-center">{results.rawScores.pseudopalavras}</TableCell>
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                  <TableCell className="text-center text-muted-foreground">-</TableCell>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">Total (Palavras + Pseudopalavras)</TableCell>
                  <TableCell className="text-center font-bold">{results.calculatedScores.total}</TableCell>
                  <TableCell className="text-center font-bold">
                    {results.calculatedScores.escorePadrao !== null 
                      ? results.calculatedScores.escorePadrao 
                      : 'N/D'}
                  </TableCell>
                  <TableCell className="text-center">
                    {getClassificationBadge(results.classifications.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {results.calculatedScores.escorePadrao === null && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Não há norma disponível para esta combinação de pontuação ({results.calculatedScores.total}) 
                  e idade ({patientAge} anos).
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground space-y-1 pt-2">
              <p><strong>Escala de Classificação:</strong></p>
              <p>• Escore Padrão &lt; 70: Muito Baixa</p>
              <p>• Escore Padrão 70-84: Baixa</p>
              <p>• Escore Padrão 85-114: Média</p>
              <p>• Escore Padrão 115-129: Alta</p>
              <p>• Escore Padrão ≥ 130: Muito Alta</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
