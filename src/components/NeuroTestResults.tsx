import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, ClipboardCopy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TestConfig {
  subtests: string[];
  names: Record<string, string>;
  mainSubtest: string;
  useRawScores?: string[];
}

// Configuração de subtestes por tipo de teste
const getTestConfig = (testCode: string): TestConfig | null => {
  switch (testCode) {
    case 'BPA2':
      return {
        subtests: ['AC', 'AD', 'AA', 'AG'],
        names: {
          AC: 'Atenção Concentrada',
          AD: 'Atenção Dividida',
          AA: 'Atenção Alternada',
          AG: 'Atenção Geral'
        },
        mainSubtest: 'AG'
      };
    case 'RAVLT':
      return {
        subtests: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7', 'escoreTotal', 'reconhecimento'],
        names: {
          a1: 'A1 (1ª tentativa)',
          a2: 'A2 (2ª tentativa)',
          a3: 'A3 (3ª tentativa)',
          a4: 'A4 (4ª tentativa)',
          a5: 'A5 (5ª tentativa)',
          b1: 'B1 (Lista B)',
          a6: 'A6 (Evocação imediata)',
          a7: 'A7 (Evocação tardia)',
          escoreTotal: 'Escore Total (A1-A5)',
          reconhecimento: 'Reconhecimento'
        },
        mainSubtest: 'escoreTotal',
        useRawScores: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7']
      };
    case 'FDT':
      return {
        subtests: ['inibicao', 'flexibilidade'],
        names: {
          inibicao: 'Inibição',
          flexibilidade: 'Flexibilidade'
        },
        mainSubtest: 'inibicao'
      };
    default:
      return null;
  }
};

interface GenericTestResults {
  rawScores?: Record<string, number>;
  calculatedScores: Record<string, number>;
  percentiles: Record<string, number>;
  classifications: Record<string, string>;
  notes?: string;
}

interface NeuroTestResultsProps {
  testCode: string;
  testName: string;
  patientName: string;
  patientAge: number;
  results: GenericTestResults;
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
  
  const config = getTestConfig(testCode);
  
  if (!config) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Tipo de teste não reconhecido: {testCode}
        </CardContent>
      </Card>
    );
  }

  // Obtém o escore correto (raw ou calculated) para cada subteste
  const getScoreValue = (subtestCode: string): number | string => {
    if (config.useRawScores?.includes(subtestCode) && results.rawScores) {
      return results.rawScores[subtestCode] ?? '-';
    }
    return results.calculatedScores[subtestCode] ?? '-';
  };

  const copyToClipboard = () => {
    const lines = [
      `TESTE: ${testName}`,
      `Paciente: ${patientName} (${patientAge} anos)`,
      appliedAt ? `Data: ${new Date(appliedAt).toLocaleDateString('pt-BR')}` : '',
      appliedBy ? `Aplicador: ${appliedBy}` : '',
      '',
      'RESULTADOS:',
      '-------------------------------------------',
      'Variável                | Bruto | Percentil | Classificação',
      '-------------------------------------------'
    ];

    config.subtests.forEach(code => {
      const name = config.names[code] || code;
      const score = getScoreValue(code);
      const percentile = results.percentiles[code] ?? '-';
      const classification = results.classifications[code] ?? '-';
      
      lines.push(
        `${name.padEnd(23)} | ${String(score).padStart(5)} | ${String(percentile).padStart(9)} | ${classification}`
      );
    });

    lines.push('-------------------------------------------');

    if (results.notes) {
      lines.push('', 'OBSERVAÇÕES:', results.notes);
    }

    navigator.clipboard.writeText(lines.filter(l => l !== undefined && l !== '').join('\n'));
    toast({
      title: "Copiado!",
      description: "Texto formatado copiado para a área de transferência."
    });
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
              <TableHead>Variável</TableHead>
              <TableHead className="text-center">Bruto</TableHead>
              <TableHead className="text-center">Percentil</TableHead>
              <TableHead className="text-right">Classificação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.subtests.map(code => {
              const score = getScoreValue(code);
              const percentile = results.percentiles[code] ?? '-';
              const classification = results.classifications[code] ?? '-';
              const isMain = code === config.mainSubtest;
              
              return (
                <TableRow key={code} className={isMain ? 'bg-primary/5 font-medium' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isMain && <Brain className="h-4 w-4 text-primary" />}
                      <span>{config.names[code] || code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">{score}</TableCell>
                  <TableCell className="text-center font-mono">{percentile}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getClassificationVariant(String(classification))}>
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
