import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, ClipboardCopy, Download, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface NeuroTestResult {
  id: string;
  client_id: string;
  schedule_id: string | null;
  test_code: string;
  test_name: string;
  patient_age: number;
  raw_scores: Json;
  calculated_scores: Json;
  percentiles: Json;
  classifications: Json;
  applied_by: string | null;
  applied_at: string;
  notes: string | null;
  created_at: string;
}

interface SummaryRow {
  instrument: string;
  subtestName: string;
  score: string | number;
  percentile: string | number;
  classification: string;
  testCode: string;
}

interface TestConfig {
  subtests: string[];
  names: Record<string, string>;
  mainSubtest: string;
  useRawScores?: string[];
}

// Testes que usam Escore Padrão
const EP_TESTS = ['TIN', 'PCFO', 'TSBC', 'TRILHAS', 'TRILHAS_PRE_ESCOLAR', 'TRPP'];

const getTestConfig = (testCode: string): TestConfig | null => {
  switch (testCode) {
    case 'BPA2':
      return { subtests: ['AC', 'AD', 'AA', 'AG'], names: { AC: 'Atenção Concentrada', AD: 'Atenção Dividida', AA: 'Atenção Alternada', AG: 'Atenção Geral' }, mainSubtest: 'AG' };
    case 'RAVLT':
      return { subtests: ['escoreTotal', 'reconhecimento', 'alt', 'velocidadeEsquecimento', 'interferenciaProativa', 'interferenciaRetroativa'], names: { escoreTotal: 'Escore Total (A1-A5)', reconhecimento: 'Reconhecimento', alt: 'ALT (Aprendizagem)', velocidadeEsquecimento: 'Vel. Esquecimento', interferenciaProativa: 'Int. Proativa', interferenciaRetroativa: 'Int. Retroativa' }, mainSubtest: 'escoreTotal' };
    case 'FDT':
      return { subtests: ['leitura', 'contagem', 'escolha', 'alternancia', 'inibicao', 'flexibilidade'], names: { leitura: 'Tempo - Leitura', contagem: 'Tempo - Contagem', escolha: 'Tempo - Escolha', alternancia: 'Tempo - Alternância', inibicao: 'Inibição', flexibilidade: 'Flexibilidade' }, mainSubtest: 'inibicao' };
    case 'TIN':
      return { subtests: ['escorePadrao'], names: { escorePadrao: 'Nomeação' }, mainSubtest: 'escorePadrao' };
    case 'PCFO':
      return { subtests: ['escorePadrao'], names: { escorePadrao: 'Consciência Fonológica' }, mainSubtest: 'escorePadrao' };
    case 'TSBC':
      return { subtests: ['escorePadraoOD', 'escorePadraoOI'], names: { escorePadraoOD: 'Ordem Direta', escorePadraoOI: 'Ordem Inversa' }, mainSubtest: 'escorePadraoOD' };
    case 'FVA':
      return { subtests: ['percentilAnimais', 'percentilFrutas', 'percentilPares'], names: { percentilAnimais: 'Animais', percentilFrutas: 'Frutas', percentilPares: 'Pares (Alternada)' }, mainSubtest: 'percentilAnimais' };
    case 'BNTBR':
      return { subtests: ['percentil'], names: { percentil: 'Nomeação' }, mainSubtest: 'percentil' };
    case 'FAS':
      return { subtests: ['percentilTotal'], names: { percentilTotal: 'Total' }, mainSubtest: 'percentilTotal' };
    case 'WECHSLER':
      return { subtests: ['cubos', 'semelhanças', 'digitosOD', 'digitosOI', 'matrizesRaciocinio', 'vocabulario', 'aritmetica', 'procurarSimbolos', 'quebracabecas', 'codificacao', 'compreensao', 'cancelamento', 'informacao', 'sequenciaNumeroLetra', 'raciocionioPesos', 'completarFiguras', 'spanFiguras', 'ICV', 'IOP', 'IMO', 'IVP', 'QIT'], names: { cubos: 'Cubos', semelhanças: 'Semelhanças', digitosOD: 'Dígitos OD', digitosOI: 'Dígitos OI', matrizesRaciocinio: 'Matrizes', vocabulario: 'Vocabulário', aritmetica: 'Aritmética', procurarSimbolos: 'Proc. Símbolos', quebracabecas: 'Quebra-cabeças', codificacao: 'Codificação', compreensao: 'Compreensão', cancelamento: 'Cancelamento', informacao: 'Informação', sequenciaNumeroLetra: 'Seq. Nº-Letra', raciocionioPesos: 'Rac. Pesos', completarFiguras: 'Compl. Figuras', spanFiguras: 'Span Figuras', ICV: 'ICV', IOP: 'IOP', IMO: 'IMO', IVP: 'IVP', QIT: 'QIT' }, mainSubtest: 'QIT' };
    case 'CORSI':
      return { subtests: ['escorePadraoOD', 'escorePadraoOI'], names: { escorePadraoOD: 'Ordem Direta', escorePadraoOI: 'Ordem Inversa' }, mainSubtest: 'escorePadraoOD' };
    case 'RAVEN':
      return { subtests: ['percentil'], names: { percentil: 'Raciocínio Abstrato' }, mainSubtest: 'percentil' };
    case 'D2':
      return { subtests: ['RL', 'E_PERCENT', 'RL_E'], names: { RL: 'Resultado Líquido', E_PERCENT: '% Erros', RL_E: 'RL-E' }, mainSubtest: 'RL' };
    case 'STROOP':
      return { subtests: ['palavras', 'cores', 'palavrasCores', 'interferencia'], names: { palavras: 'Palavras', cores: 'Cores', palavrasCores: 'Palavras-Cores', interferencia: 'Interferência' }, mainSubtest: 'interferencia' };
    case 'WCST':
      return { subtests: ['categorias', 'errosPerseverativos', 'respostasConceituais'], names: { categorias: 'Categorias', errosPerseverativos: 'Erros Perseverativos', respostasConceituais: 'Resp. Conceituais' }, mainSubtest: 'categorias' };
    case 'REY':
      return { subtests: ['copia', 'memoria'], names: { copia: 'Cópia', memoria: 'Memória' }, mainSubtest: 'copia' };
    case 'TAYLOR':
      return { subtests: ['copia', 'memoria'], names: { copia: 'Cópia', memoria: 'Memória' }, mainSubtest: 'copia' };
    case 'TOM':
      return { subtests: ['totalScore'], names: { totalScore: 'Total' }, mainSubtest: 'totalScore' };
    case 'TRPP':
      return { subtests: ['escorePadrao'], names: { escorePadrao: 'Reconhecimento' }, mainSubtest: 'escorePadrao' };
    case 'TRILHAS':
      return { subtests: ['escorePadraoA', 'escorePadraoB'], names: { escorePadraoA: 'Parte A', escorePadraoB: 'Parte B' }, mainSubtest: 'escorePadraoA' };
    case 'TRILHAS_PRE_ESCOLAR':
      return { subtests: ['escorePadraoA', 'escorePadraoB'], names: { escorePadraoA: 'Parte A', escorePadraoB: 'Parte B' }, mainSubtest: 'escorePadraoA' };
    case 'TMT_ADULTO':
      return { subtests: ['percentilA', 'percentilB'], names: { percentilA: 'Parte A', percentilB: 'Parte B' }, mainSubtest: 'percentilA' };
    case 'HAYLING_ADULTO':
      return { subtests: ['tempoB', 'errosB'], names: { tempoB: 'Tempo Parte B', errosB: 'Erros Parte B' }, mainSubtest: 'errosB' };
    case 'HAYLING_INFANTIL':
      return { subtests: ['parteATempo', 'parteBTempo', 'parteBErros', 'inibicaoBA'], names: { parteATempo: 'Parte A (Tempo)', parteBTempo: 'Parte B (Tempo)', parteBErros: 'Parte B (Erros)', inibicaoBA: 'Inibição (B-A)' }, mainSubtest: 'inibicaoBA', useRawScores: ['parteATempo', 'parteBTempo', 'parteBErros'] };
    case 'TFV':
      return { subtests: ['percentilFonemica', 'percentilSemantica'], names: { percentilFonemica: 'Fonêmica', percentilSemantica: 'Semântica' }, mainSubtest: 'percentilFonemica' };
    case 'CANCELAMENTO':
      return { subtests: ['totalLiquido'], names: { totalLiquido: 'Total Líquido' }, mainSubtest: 'totalLiquido' };
    case 'WMS':
      return { subtests: ['percentil'], names: { percentil: 'Memória' }, mainSubtest: 'percentil' };
    case 'TDE2':
      return { subtests: ['escrita', 'aritmetica', 'leitura', 'totalScore'], names: { escrita: 'Escrita', aritmetica: 'Aritmética', leitura: 'Leitura', totalScore: 'Total' }, mainSubtest: 'totalScore' };
    case 'NEUPSILIN':
      return { subtests: ['orientacao', 'atencao', 'percepcao', 'memoria', 'aritmetica', 'linguagem', 'praxias', 'funcoesExecutivas'], names: { orientacao: 'Orientação', atencao: 'Atenção', percepcao: 'Percepção', memoria: 'Memória', aritmetica: 'Aritmética', linguagem: 'Linguagem', praxias: 'Praxias', funcoesExecutivas: 'Funções Exec.' }, mainSubtest: 'memoria' };
    case 'FPT_INFANTIL':
      return { subtests: ['desenhosUnicos'], names: { desenhosUnicos: 'desenhosUnicos' }, mainSubtest: 'desenhosUnicos' };
    case 'FPT_ADULTO':
      return { subtests: ['desenhosUnicos'], names: { desenhosUnicos: 'desenhosUnicos' }, mainSubtest: 'desenhosUnicos' };
    default:
      return null;
  }
};

// Cor da classificação para a tabela
const getClassificationColor = (classification: string): string => {
  if (classification.includes('Muito Alta') || classification.includes('Superior')) return 'text-green-600 dark:text-green-400';
  if (classification.includes('Alta') || classification === 'Adequado') return 'text-blue-600 dark:text-blue-400';
  if (classification.includes('Média') || classification === 'Médio') return 'text-foreground';
  if (classification.includes('Baixa') || classification.includes('Inferior')) return 'text-orange-600 dark:text-orange-400';
  if (classification.includes('Muito Baixa') || classification === 'Prejuízo' || classification.includes('Déficit') || classification.includes('Grave')) return 'text-red-600 dark:text-red-400';
  return 'text-foreground';
};

interface NeuroTestSummaryTableProps {
  tests: NeuroTestResult[];
  clientName: string;
}

export default function NeuroTestSummaryTable({ tests, clientName }: NeuroTestSummaryTableProps) {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);

  if (tests.length === 0) return null;

  // Gerar linhas da tabela resumo
  const summaryRows: SummaryRow[] = [];

  tests.forEach(test => {
    const config = getTestConfig(test.test_code);
    const calculatedScores = test.calculated_scores as Record<string, number>;
    const rawScores = test.raw_scores as Record<string, number>;
    const percentiles = test.percentiles as Record<string, number | string>;
    const classifications = test.classifications as Record<string, string>;

    if (config) {
      config.subtests.forEach(code => {
        const score = config.useRawScores?.includes(code)
          ? (rawScores[code] ?? '-')
          : (calculatedScores[code] ?? '-');
        const percentile = percentiles[code] ?? '-';
        const classification = classifications[code] ?? '-';

        summaryRows.push({
          instrument: test.test_name,
          subtestName: config.names[code] || code,
          score,
          percentile,
          classification: String(classification),
          testCode: test.test_code,
        });
      });
    } else {
      // Fallback genérico
      const keys = Object.keys(percentiles).length > 0 ? Object.keys(percentiles) : Object.keys(classifications);
      keys.forEach(code => {
        summaryRows.push({
          instrument: test.test_name,
          subtestName: code,
          score: calculatedScores[code] ?? rawScores[code] ?? '-',
          percentile: percentiles[code] ?? '-',
          classification: String(classifications[code] ?? '-'),
          testCode: test.test_code,
        });
      });
    }
  });

  // Agrupar por instrumento para rowspan
  const instrumentGroups: { instrument: string; rows: SummaryRow[] }[] = [];
  let currentInstrument = '';
  summaryRows.forEach(row => {
    if (row.instrument !== currentInstrument) {
      instrumentGroups.push({ instrument: row.instrument, rows: [row] });
      currentInstrument = row.instrument;
    } else {
      instrumentGroups[instrumentGroups.length - 1].rows.push(row);
    }
  });

  // Copiar tabela como texto
  const copyAsText = () => {
    const header = 'Instrumento\tSubteste\tPontuação\tPercentil\tInterpretação';
    const lines = summaryRows.map(r =>
      `${r.instrument}\t${r.subtestName}\t${r.score}\t${r.percentile}\t${r.classification}`
    );
    navigator.clipboard.writeText([header, ...lines].join('\n'));
    toast({ title: 'Tabela copiada!', description: 'Dados copiados para a área de transferência.' });
  };

  // Download como CSV
  const downloadCSV = () => {
    const header = 'Instrumento;Subteste;Pontuação;Percentil;Interpretação';
    const lines = summaryRows.map(r =>
      `${r.instrument};${r.subtestName};${r.score};${r.percentile};${r.classification}`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_neuro_${clientName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Download iniciado!', description: 'Arquivo CSV gerado com sucesso.' });
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Tabela Resumo dos Resultados
            <Badge variant="secondary" className="ml-1">{tests.length} instrumento(s)</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="gap-1.5 text-xs"
            >
              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {isVisible ? 'Ocultar' : 'Mostrar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyAsText}
              className="gap-1.5 text-xs"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSV}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      {isVisible && (
        <CardContent className="pt-0">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10 hover:bg-primary/10">
                  <TableHead className="font-bold text-primary text-xs">Instrumento</TableHead>
                  <TableHead className="font-bold text-primary text-xs">Subteste</TableHead>
                  <TableHead className="font-bold text-primary text-xs text-center">Pontuação</TableHead>
                  <TableHead className="font-bold text-primary text-xs text-center">Percentil</TableHead>
                  <TableHead className="font-bold text-primary text-xs">Interpretação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instrumentGroups.map((group, gi) => (
                  group.rows.map((row, ri) => (
                    <TableRow
                      key={`${gi}-${ri}`}
                      className={gi % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    >
                      {ri === 0 && (
                        <TableCell
                          rowSpan={group.rows.length}
                          className="font-semibold text-sm align-top border-r"
                        >
                          {group.instrument}
                        </TableCell>
                      )}
                      <TableCell className="text-sm">{row.subtestName}</TableCell>
                      <TableCell className="text-center font-mono text-sm font-medium">
                        {row.score}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm font-medium">
                        {row.percentile}
                      </TableCell>
                      <TableCell className={`text-sm font-medium ${getClassificationColor(row.classification)}`}>
                        {row.classification}
                      </TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
