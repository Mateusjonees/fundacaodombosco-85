import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, ClipboardCopy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { BPA2Results } from './NeuroTestBPA2Form';

interface NeuroTestResultsProps {
  testCode: string;
  testName: string;
  patientName: string;
  patientAge: number;
  results: BPA2Results;
  appliedAt?: string;
  appliedBy?: string;
}

export default function NeuroTestResults({
  testCode,
  testName,
  patientName,
  patientAge,
  results,
  appliedAt,
  appliedBy
}: NeuroTestResultsProps) {
  const { toast } = useToast();

  const subtests = [
    { code: 'AC', name: 'Atenção Concentrada' },
    { code: 'AD', name: 'Atenção Dividida' },
    { code: 'AA', name: 'Atenção Alternada' },
    { code: 'AG', name: 'Atenção Geral' }
  ];

  const copyToClipboard = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto formatado copiado para a área de transferência."
    });
  };

  const generateReportText = () => {
    const lines = [
      `TESTE: ${testName}`,
      `Paciente: ${patientName} (${patientAge} anos)`,
      appliedAt ? `Data: ${new Date(appliedAt).toLocaleDateString('pt-BR')}` : '',
      appliedBy ? `Aplicador: ${appliedBy}` : '',
      '',
      'RESULTADOS:',
      '-------------------------------------------',
      'Subteste           | Escore | Percentil | Classificação',
      '-------------------------------------------'
    ];

    subtests.forEach(({ code, name }) => {
      const score = results.calculatedScores[code as keyof typeof results.calculatedScores];
      const percentile = results.percentiles[code as keyof typeof results.percentiles];
      const classification = results.classifications[code as keyof typeof results.classifications];
      lines.push(
        `${name.padEnd(18)} | ${String(score).padStart(6)} | ${String(percentile).padStart(9)} | ${classification}`
      );
    });

    lines.push('-------------------------------------------');

    if (results.notes) {
      lines.push('', 'OBSERVAÇÕES:', results.notes);
    }

    return lines.filter(l => l !== undefined).join('\n');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Resultado: {testName}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-1"
          >
            <ClipboardCopy className="h-4 w-4" />
            Copiar para Laudo
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{patientName}</span>
          <span>•</span>
          <Badge variant="secondary">{patientAge} anos</Badge>
          {appliedAt && (
            <>
              <span>•</span>
              <span>{new Date(appliedAt).toLocaleDateString('pt-BR')}</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subteste</TableHead>
              <TableHead className="text-center">Escore</TableHead>
              <TableHead className="text-center">Percentil</TableHead>
              <TableHead className="text-right">Classificação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subtests.map(({ code, name }) => {
              const score = results.calculatedScores[code as keyof typeof results.calculatedScores];
              const percentile = results.percentiles[code as keyof typeof results.percentiles];
              const classification = results.classifications[code as keyof typeof results.classifications];
              const isAG = code === 'AG';
              
              return (
                <TableRow key={code} className={isAG ? 'bg-primary/5 font-medium' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isAG && <Brain className="h-4 w-4 text-primary" />}
                      <span>{name}</span>
                      <Badge variant="outline" className="text-xs">{code}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">{score}</TableCell>
                  <TableCell className="text-center font-mono">{percentile}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getClassificationVariant(classification)}>
                      {classification}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {results.notes && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Observações:</p>
            <p className="text-sm text-muted-foreground">{results.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getClassificationVariant(classification: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (classification.includes('Inferior')) return 'destructive';
  if (classification.includes('Superior')) return 'default';
  return 'secondary';
}
