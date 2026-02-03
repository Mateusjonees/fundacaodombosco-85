import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
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

  // Recalcular resultados quando os valores mudarem
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
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{FPT_INFANTIL_TEST.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{FPT_INFANTIL_TEST.fullName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
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

        {/* Tabela de Resultados */}
        {results && results.percentile !== null && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Resultados Calculados</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medida</TableHead>
                  <TableHead className="text-center">Pontuação</TableHead>
                  <TableHead className="text-center">Percentil</TableHead>
                  <TableHead className="text-center">Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Desenhos Únicos</TableCell>
                  <TableCell className="text-center">{results.rawScore}</TableCell>
                  <TableCell className="text-center">{results.percentile}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getClassificationBadgeVariant(results.classification)}>
                      {results.classification}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Alerta se percentil não disponível */}
        {results && results.percentile === null && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não há normas disponíveis para esta combinação de pontuação ({results.rawScore}) 
              e ano escolar ({schoolYear}).
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export type { FPTInfantilResults };
