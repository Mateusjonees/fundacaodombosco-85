import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, AlertCircle, Info } from 'lucide-react';
import {
  FPT_ADULTO_TEST,
  AGE_GROUP_OPTIONS,
  calculateFPTAdultoResults,
  getAgeGroupForFPTAdulto,
  isAgeValidForFPTAdulto,
  type FPTAdultoAgeGroup,
  type FPTAdultoResults
} from '@/data/neuroTests/fptAdulto';

interface NeuroTestFPTAdultoFormProps {
  patientAge: number;
  onResultsChange: (results: FPTAdultoResults | null) => void;
}

export default function NeuroTestFPTAdultoForm({
  patientAge,
  onResultsChange
}: NeuroTestFPTAdultoFormProps) {
  const [uniqueDesigns, setUniqueDesigns] = useState<string>('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<FPTAdultoAgeGroup | ''>('');
  const [results, setResults] = useState<FPTAdultoResults | null>(null);

  // Determinar a faixa etária automaticamente
  useEffect(() => {
    if (patientAge && isAgeValidForFPTAdulto(patientAge)) {
      const autoAgeGroup = getAgeGroupForFPTAdulto(patientAge);
      if (autoAgeGroup) {
        setSelectedAgeGroup(autoAgeGroup);
      }
    }
  }, [patientAge]);

  // Calcular resultados quando o valor muda
  useEffect(() => {
    if (uniqueDesigns && selectedAgeGroup) {
      const rawScore = parseInt(uniqueDesigns, 10);
      if (!isNaN(rawScore) && rawScore >= 0) {
        const calculatedResults = calculateFPTAdultoResults(rawScore, selectedAgeGroup);
        setResults(calculatedResults);
        onResultsChange(calculatedResults);
      } else {
        setResults(null);
        onResultsChange(null);
      }
    } else {
      setResults(null);
      onResultsChange(null);
    }
  }, [uniqueDesigns, selectedAgeGroup, onResultsChange]);

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

  if (!isAgeValidForFPTAdulto(patientAge)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          O FPT Adulto é aplicável para pacientes entre 20 e 99 anos.
          Idade do paciente: {patientAge} anos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {FPT_ADULTO_TEST.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {FPT_ADULTO_TEST.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs">
            O teste utiliza o período de <strong>2 minutos</strong>.
            As normas são estratificadas por faixa etária.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Faixa Etária</Label>
            <Select
              value={selectedAgeGroup}
              onValueChange={(value) => setSelectedAgeGroup(value as FPTAdultoAgeGroup)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a faixa etária" />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Idade do paciente: {patientAge} anos
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Desenhos Únicos</Label>
            <Input
              type="number"
              min="0"
              max="80"
              value={uniqueDesigns}
              onChange={(e) => setUniqueDesigns(e.target.value)}
              placeholder="Total de desenhos não repetidos"
              className="text-center"
            />
            <p className="text-xs text-muted-foreground">
              Total de figuras únicas em 2 minutos
            </p>
          </div>
        </div>

        {/* Resultados */}
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
              <strong className="text-foreground">Faixa etária:</strong> {results.ageGroup} anos
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
        )}
      </CardContent>
    </Card>
  );
}
