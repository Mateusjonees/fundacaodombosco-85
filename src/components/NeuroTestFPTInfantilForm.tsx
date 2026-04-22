import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Info, AlertCircle } from 'lucide-react';
import {
  FPT_INFANTIL_TEST,
  SCHOOL_YEAR_OPTIONS,
  calculateFPTInfantilResults,
  isAgeValidForFPTInfantil,
  type SchoolYear,
  type FPTInfantilResults
} from '@/data/neuroTests/fptInfantil';

interface NeuroTestFPTInfantilFormProps {
  patientAge: number;
  onResultsChange: (results: FPTInfantilResults | null) => void;
}

export default function NeuroTestFPTInfantilForm({
  patientAge,
  onResultsChange
}: NeuroTestFPTInfantilFormProps) {
  const [schoolYear, setSchoolYear] = useState<SchoolYear | ''>('');
  const [rawScore, setRawScore] = useState<string>('');
  const [results, setResults] = useState<FPTInfantilResults | null>(null);

  const isValidAge = isAgeValidForFPTInfantil(patientAge);

  useEffect(() => {
    if (!schoolYear || rawScore === '') {
      setResults(null);
      onResultsChange(null);
      return;
    }

    const score = parseInt(rawScore);
    if (isNaN(score) || score < 0) {
      setResults(null);
      onResultsChange(null);
      return;
    }

    const calculatedResults = calculateFPTInfantilResults(score, schoolYear);
    setResults(calculatedResults);
    onResultsChange(calculatedResults);
  }, [schoolYear, rawScore, onResultsChange]);

  const getClassificationBadgeVariant = (classification: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (classification) {
      case 'Superior':
      case 'Média Superior':
        return 'default';
      case 'Média':
        return 'secondary';
      case 'Média Inferior':
        return 'outline';
      case 'Inferior':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (!isValidAge) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {FPT_INFANTIL_TEST.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este teste é indicado para crianças de 8 a 15 anos. 
              Idade do paciente: {patientAge} anos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {FPT_INFANTIL_TEST.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{FPT_INFANTIL_TEST.fullName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs">
            <strong>Importante:</strong> Este teste é estratificado por <strong>ano escolar</strong>, 
            não por idade. Selecione o ano escolar correspondente ao paciente.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="schoolYear">Ano Escolar *</Label>
            <Select value={schoolYear} onValueChange={(value) => setSchoolYear(value as SchoolYear)}>
              <SelectTrigger id="schoolYear">
                <SelectValue placeholder="Selecione o ano escolar" />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_YEAR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rawScore">Desenhos Únicos *</Label>
            <Input
              id="rawScore"
              type="number"
              min="0"
              max="100"
              placeholder="Total de desenhos não repetidos"
              value={rawScore}
              onChange={(e) => setRawScore(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Período de 2 minutos
            </p>
          </div>
        </div>

        {/* Tabela de Resultados - sempre mostra quando há results */}
        {results && (
          <div className="mt-4 p-4 bg-card border border-border rounded-lg">
            <h4 className="text-sm font-semibold mb-3 text-card-foreground">Resultados</h4>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Medida</TableHead>
                  <TableHead className="text-center text-muted-foreground">Pontuação</TableHead>
                  <TableHead className="text-center text-muted-foreground">Percentil</TableHead>
                  <TableHead className="text-center text-muted-foreground">Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-border">
                  <TableCell className="font-medium text-foreground">Desenhos Únicos</TableCell>
                  <TableCell className="text-center text-foreground">{results.rawScore}</TableCell>
                  <TableCell className="text-center text-foreground">
                    {results.percentile !== null ? results.percentile : 'N/D'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getClassificationBadgeVariant(results.classification)}>
                      {results.classification}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3">
              <strong className="text-foreground">Ano escolar:</strong> {SCHOOL_YEAR_OPTIONS.find(o => o.value === results.schoolYear)?.label || results.schoolYear}
            </p>
            {/* Explicação do cálculo do percentil */}
            <div className={`mt-3 p-3 rounded-md border text-xs ${
              results.lookupInfo.method === 'exact'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : results.lookupInfo.method === 'adjacent'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'bg-primary/5 border-primary/20 text-muted-foreground'
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <strong className="text-foreground">Como o percentil foi calculado:</strong>
              </div>
              <p>{results.lookupInfo.description}</p>
              <p className="mt-1 opacity-75">
                Método: <Badge variant="outline" className="text-[10px] px-1.5 py-0">{results.lookupInfo.method}</Badge>
                {results.lookupInfo.matchedScore !== null && <> · Pontuação ref.: {results.lookupInfo.matchedScore}</>}
                {results.lookupInfo.matchedGroup && <> · Grupo ref.: {results.lookupInfo.matchedGroup}</>}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export type { FPTInfantilResults };
