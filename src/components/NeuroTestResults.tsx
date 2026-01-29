import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Calculator, ChevronDown, ClipboardCopy, FileInput, FileText } from 'lucide-react';
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
    case 'TIN':
      return {
        subtests: ['escorePadrao'],
        names: {
          escorePadrao: 'Escore Padrão'
        },
        mainSubtest: 'escorePadrao'
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

// Renderiza dados de entrada do RAVLT
const renderRAVLTInputs = (rawScores: Record<string, number>) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div className="p-3 bg-muted/30 rounded-lg border">
      <p className="text-xs font-medium text-muted-foreground mb-2">📝 Tentativas (Lista A)</p>
      <div className="flex flex-wrap gap-2 text-sm font-mono">
        <Badge variant="outline">A1={rawScores.a1 ?? '-'}</Badge>
        <Badge variant="outline">A2={rawScores.a2 ?? '-'}</Badge>
        <Badge variant="outline">A3={rawScores.a3 ?? '-'}</Badge>
        <Badge variant="outline">A4={rawScores.a4 ?? '-'}</Badge>
        <Badge variant="outline">A5={rawScores.a5 ?? '-'}</Badge>
      </div>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border">
      <p className="text-xs font-medium text-muted-foreground mb-2">📝 Lista B e Evocações</p>
      <div className="flex flex-wrap gap-2 text-sm font-mono">
        <Badge variant="outline">B1={rawScores.b1 ?? '-'}</Badge>
        <Badge variant="outline">A6={rawScores.a6 ?? '-'}</Badge>
        <Badge variant="outline">A7={rawScores.a7 ?? '-'}</Badge>
      </div>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border col-span-1 md:col-span-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">📝 Reconhecimento (antes da correção -35)</p>
      <Badge variant="outline" className="font-mono">REC={rawScores.rec ?? '-'}</Badge>
    </div>
  </div>
);

// Renderiza cálculos do RAVLT
const renderRAVLTCalculations = (raw: Record<string, number>, calc: Record<string, number>) => {
  const a1 = raw.a1 ?? 0;
  const a2 = raw.a2 ?? 0;
  const a3 = raw.a3 ?? 0;
  const a4 = raw.a4 ?? 0;
  const a5 = raw.a5 ?? 0;
  const a6 = raw.a6 ?? 0;
  const a7 = raw.a7 ?? 0;
  const b1 = raw.b1 ?? 0;
  const rec = raw.rec ?? 0;
  const escoreTotal = calc.escoreTotal ?? 0;
  const reconhecimento = calc.reconhecimento ?? 0;
  const alt = calc.alt ?? 0;
  const velEsq = calc.velocidadeEsquecimento ?? 0;
  const intProativa = calc.interferenciaProativa ?? 0;
  const intRetroativa = calc.interferenciaRetroativa ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Escore Total</span>
        <span className="font-mono text-xs">{a1}+{a2}+{a3}+{a4}+{a5} = <strong>{escoreTotal}</strong></span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Reconhecimento</span>
        <span className="font-mono text-xs">{rec} - 35 = <strong>{reconhecimento}</strong></span>
      </div>
      <div className="p-2 bg-muted/30 rounded-lg flex justify-between items-center">
        <span>ALT (Aprendizagem)</span>
        <span className="font-mono text-xs">{escoreTotal} - (5×{a1}) = <strong>{alt}</strong></span>
      </div>
      <div className="p-2 bg-muted/30 rounded-lg flex justify-between items-center">
        <span>Vel. Esquecimento</span>
        <span className="font-mono text-xs">{a7}/{a6} = <strong>{velEsq.toFixed(2)}</strong></span>
      </div>
      <div className="p-2 bg-muted/30 rounded-lg flex justify-between items-center">
        <span>Int. Proativa</span>
        <span className="font-mono text-xs">{b1}/{a1} = <strong>{intProativa.toFixed(2)}</strong></span>
      </div>
      <div className="p-2 bg-muted/30 rounded-lg flex justify-between items-center">
        <span>Int. Retroativa</span>
        <span className="font-mono text-xs">{a6}/{a5} = <strong>{intRetroativa.toFixed(2)}</strong></span>
      </div>
    </div>
  );
};

// Renderiza dados de entrada do FDT
const renderFDTInputs = (rawScores: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Leitura</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.leitura ?? '-'}s</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Contagem</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.contagem ?? '-'}s</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Escolha</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.escolha ?? '-'}s</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Alternância</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.alternancia ?? '-'}s</Badge>
    </div>
  </div>
);

// Renderiza cálculos do FDT
const renderFDTCalculations = (raw: Record<string, number>, calc: Record<string, number>) => {
  const leitura = raw.leitura ?? 0;
  const escolha = raw.escolha ?? 0;
  const alternancia = raw.alternancia ?? 0;
  const inibicao = calc.inibicao ?? 0;
  const flexibilidade = calc.flexibilidade ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Inibição</span>
        <span className="font-mono text-xs">{escolha} - {leitura} = <strong>{inibicao.toFixed(1)}</strong></span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Flexibilidade</span>
        <span className="font-mono text-xs">{alternancia} - {leitura} = <strong>{flexibilidade.toFixed(1)}</strong></span>
      </div>
    </div>
  );
};

// Renderiza dados de entrada do BPA-2
const renderBPA2Inputs = (rawScores: Record<string, number>, calc: Record<string, number>) => (
  <div className="space-y-2">
    {['AC', 'AD', 'AA'].map(subtest => {
      const acertos = rawScores[`${subtest}_acertos`] ?? '-';
      const erros = rawScores[`${subtest}_erros`] ?? '-';
      const omissoes = rawScores[`${subtest}_omissoes`] ?? '-';
      const score = calc[subtest] ?? '-';
      
      const subtestNames: Record<string, string> = {
        AC: 'Atenção Concentrada',
        AD: 'Atenção Dividida',
        AA: 'Atenção Alternada'
      };

      return (
        <div key={subtest} className="p-3 bg-muted/30 rounded-lg border">
          <p className="text-xs font-medium text-muted-foreground mb-2">{subtestNames[subtest]}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="font-mono">A={acertos}</Badge>
            <Badge variant="outline" className="font-mono">E={erros}</Badge>
            <Badge variant="outline" className="font-mono">O={omissoes}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="secondary" className="font-mono font-bold">Score: {score}</Badge>
          </div>
        </div>
      );
    })}
  </div>
);

// Renderiza cálculos do BPA-2
const renderBPA2Calculations = (calc: Record<string, number>) => {
  const ac = calc.AC ?? 0;
  const ad = calc.AD ?? 0;
  const aa = calc.AA ?? 0;
  const ag = calc.AG ?? 0;

  return (
    <div className="space-y-2 text-sm">
      <div className="p-2 bg-muted/30 rounded-lg">
        <span className="text-muted-foreground">Fórmula: </span>
        <span className="font-mono">Score = Acertos - Erros - Omissões</span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Atenção Geral (AG)</span>
        <span className="font-mono text-xs">{ac} + {ad} + {aa} = <strong>{ag}</strong></span>
      </div>
    </div>
  );
};

// Renderiza dados de entrada do TIN
const renderTINInputs = (rawScores: Record<string, number>) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Total de Acertos</p>
    <Badge variant="outline" className="font-mono text-lg">{rawScores.acertos ?? '-'}</Badge>
    <p className="text-xs text-muted-foreground mt-1">(máximo: 60)</p>
  </div>
);

// Renderiza cálculos do TIN
const renderTINCalculations = (calc: Record<string, number>) => {
  const escorePadrao = calc.escorePadrao ?? '-';

  return (
    <div className="space-y-2 text-sm">
      <div className="p-2 bg-muted/30 rounded-lg">
        <span className="text-muted-foreground">Fórmula: </span>
        <span className="font-mono">Escore Padrão = Consulta tabela normativa por idade</span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Escore Padrão</span>
        <span className="font-mono"><strong>{escorePadrao}</strong> (M=100, DP=15)</span>
      </div>
      <div className="p-2 bg-muted/30 rounded-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">Escala de Classificação:</p>
        <div className="flex flex-wrap gap-1 text-xs">
          <Badge variant="outline" className="text-red-600 dark:text-red-400">&lt;70: Muito Baixa</Badge>
          <Badge variant="outline" className="text-orange-600 dark:text-orange-400">70-84: Baixa</Badge>
          <Badge variant="outline" className="text-gray-600 dark:text-gray-400">85-114: Média</Badge>
          <Badge variant="outline" className="text-blue-600 dark:text-blue-400">115-129: Alta</Badge>
          <Badge variant="outline" className="text-green-600 dark:text-green-400">≥130: Muito Alta</Badge>
        </div>
      </div>
    </div>
  );
};

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

  // Renderiza seções de entrada e cálculos
  const renderInputAndCalculations = () => {
    const rawScores = results.rawScores || {};
    const calculatedScores = results.calculatedScores;

    let inputSection = null;
    let calculationsSection = null;

    switch (testCode) {
      case 'RAVLT':
        inputSection = renderRAVLTInputs(rawScores);
        calculationsSection = renderRAVLTCalculations(rawScores, calculatedScores);
        break;
      case 'FDT':
        inputSection = renderFDTInputs(rawScores);
        calculationsSection = renderFDTCalculations(rawScores, calculatedScores);
        break;
      case 'BPA2':
        inputSection = renderBPA2Inputs(rawScores, calculatedScores);
        calculationsSection = renderBPA2Calculations(calculatedScores);
        break;
      case 'TIN':
        inputSection = renderTINInputs(rawScores);
        calculationsSection = renderTINCalculations(calculatedScores);
        break;
    }

    return (
      <div className="space-y-3 mb-4">
        {inputSection && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full">
              <FileInput className="h-4 w-4" />
              Dados de Entrada
              <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {inputSection}
            </CollapsibleContent>
          </Collapsible>
        )}

        {calculationsSection && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full">
              <Calculator className="h-4 w-4" />
              Cálculos
              <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {calculationsSection}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  const copyToClipboard = () => {
    const rawScores = results.rawScores || {};
    const calculatedScores = results.calculatedScores;

    const lines = [
      '================================================================================',
      `TESTE: ${testName}`,
      `Paciente: ${patientName} (${patientAge} anos)`,
      appliedAt ? `Data: ${new Date(appliedAt).toLocaleDateString('pt-BR')}` : '',
      appliedBy ? `Aplicador: ${appliedBy}` : '',
      '================================================================================',
      ''
    ];

    // Adicionar dados de entrada específicos por teste
    lines.push('DADOS DE ENTRADA:');
    if (testCode === 'RAVLT') {
      lines.push(`- Tentativas: A1=${rawScores.a1}, A2=${rawScores.a2}, A3=${rawScores.a3}, A4=${rawScores.a4}, A5=${rawScores.a5}`);
      lines.push(`- Lista B: B1=${rawScores.b1}`);
      lines.push(`- Evocações: A6=${rawScores.a6}, A7=${rawScores.a7}`);
      lines.push(`- Reconhecimento (bruto): ${rawScores.rec}`);
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push(`- Escore Total: ${rawScores.a1}+${rawScores.a2}+${rawScores.a3}+${rawScores.a4}+${rawScores.a5} = ${calculatedScores.escoreTotal}`);
      lines.push(`- Reconhecimento: ${rawScores.rec}-35 = ${calculatedScores.reconhecimento}`);
      lines.push(`- ALT (Aprendizagem): ${calculatedScores.escoreTotal}-(5×${rawScores.a1}) = ${calculatedScores.alt}`);
      lines.push(`- Velocidade de Esquecimento: ${rawScores.a7}/${rawScores.a6} = ${(calculatedScores.velocidadeEsquecimento ?? 0).toFixed(2)}`);
      lines.push(`- Interferência Proativa: ${rawScores.b1}/${rawScores.a1} = ${(calculatedScores.interferenciaProativa ?? 0).toFixed(2)}`);
      lines.push(`- Interferência Retroativa: ${rawScores.a6}/${rawScores.a5} = ${(calculatedScores.interferenciaRetroativa ?? 0).toFixed(2)}`);
    } else if (testCode === 'FDT') {
      lines.push(`- Leitura: ${rawScores.leitura}s`);
      lines.push(`- Contagem: ${rawScores.contagem}s`);
      lines.push(`- Escolha: ${rawScores.escolha}s`);
      lines.push(`- Alternância: ${rawScores.alternancia}s`);
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push(`- Inibição: ${rawScores.escolha} - ${rawScores.leitura} = ${(calculatedScores.inibicao ?? 0).toFixed(1)}`);
      lines.push(`- Flexibilidade: ${rawScores.alternancia} - ${rawScores.leitura} = ${(calculatedScores.flexibilidade ?? 0).toFixed(1)}`);
    } else if (testCode === 'BPA2') {
      ['AC', 'AD', 'AA'].forEach(sub => {
        lines.push(`- ${sub}: Acertos=${rawScores[`${sub}_acertos`]}, Erros=${rawScores[`${sub}_erros`]}, Omissões=${rawScores[`${sub}_omissoes`]} → Score: ${calculatedScores[sub]}`);
      });
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push('- Fórmula: Score = Acertos - Erros - Omissões');
      lines.push(`- AG = ${calculatedScores.AC} + ${calculatedScores.AD} + ${calculatedScores.AA} = ${calculatedScores.AG}`);
    } else if (testCode === 'TIN') {
      lines.push(`- Total de Acertos: ${rawScores.acertos}`);
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push(`- Escore Padrão: ${calculatedScores.escorePadrao ?? '-'} (M=100, DP=15)`);
      lines.push('');
      lines.push('CLASSIFICAÇÃO:');
      lines.push('- <70: Muito Baixa | 70-84: Baixa | 85-114: Média | 115-129: Alta | ≥130: Muito Alta');
    }

    lines.push('');
    lines.push('RESULTADOS:');
    lines.push('-------------------------------------------');
    lines.push('Variável                | Bruto | Percentil | Classificação');
    lines.push('-------------------------------------------');

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
      lines.push('');
      lines.push('OBSERVAÇÕES:');
      lines.push(results.notes);
    }

    lines.push('');
    lines.push('================================================================================');

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
        {/* Seções de entrada e cálculos */}
        {renderInputAndCalculations()}

        {/* Tabela de resultados */}
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
