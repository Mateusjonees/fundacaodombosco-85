import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Calculator, ChevronDown, ClipboardCopy, FileInput, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { epToPercentile, tScoreToPercentile, getPercentileFormula } from '@/utils/neuroPercentile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TestConfig {
  subtests: string[];
  names: Record<string, string>;
  mainSubtest: string;
  useRawScores?: string[];
}

const getTestConfig = (testCode: string): TestConfig | null => {
  switch (testCode) {
    case 'BPA2':
      return {
        subtests: ['AC', 'AD', 'AA', 'AG'],
        names: { AC: 'Atenção Concentrada', AD: 'Atenção Dividida', AA: 'Atenção Alternada', AG: 'Atenção Geral' },
        mainSubtest: 'AG'
      };
    case 'RAVLT':
      return {
        subtests: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7', 'escoreTotal', 'reconhecimento', 'alt', 'velocidadeEsquecimento', 'interferenciaProativa', 'interferenciaRetroativa'],
        names: {
          a1: 'A1 (1ª tentativa)', a2: 'A2 (2ª tentativa)', a3: 'A3 (3ª tentativa)',
          a4: 'A4 (4ª tentativa)', a5: 'A5 (5ª tentativa)', b1: 'B1 (Lista B)',
          a6: 'A6 (Evocação imediata)', a7: 'A7 (Evocação tardia)',
          escoreTotal: 'Escore Total (A1-A5)', reconhecimento: 'Reconhecimento',
          alt: 'ALT (Aprendizagem)', velocidadeEsquecimento: 'Vel. Esquecimento',
          interferenciaProativa: 'Int. Proativa', interferenciaRetroativa: 'Int. Retroativa'
        },
        mainSubtest: 'escoreTotal',
        useRawScores: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7']
      };
    case 'FDT':
      return {
        subtests: ['leitura', 'contagem', 'escolha', 'alternancia', 'errosLeitura', 'errosContagem', 'errosEscolha', 'errosAlternancia', 'inibicao', 'flexibilidade'],
        names: {
          leitura: 'Tempo - Leitura', contagem: 'Tempo - Contagem', escolha: 'Tempo - Escolha',
          alternancia: 'Tempo - Alternância', errosLeitura: 'Erros - Leitura', errosContagem: 'Erros - Contagem',
          errosEscolha: 'Erros - Escolha', errosAlternancia: 'Erros - Alternância',
          inibicao: 'Inibição', flexibilidade: 'Flexibilidade'
        },
        mainSubtest: 'inibicao'
      };
    case 'TIN':
      return {
        subtests: ['acertos', 'escorePadrao'],
        names: { acertos: 'Escore Bruto (Acertos)', escorePadrao: 'Escore Padrão' },
        mainSubtest: 'escorePadrao',
        useRawScores: ['acertos']
      };
    case 'PCFO':
      return {
        subtests: ['acertos', 'pontuacao', 'escorePadrao'],
        names: { acertos: 'Escore Bruto (Acertos)', pontuacao: 'Pontuação', escorePadrao: 'Escore Padrão' },
        mainSubtest: 'escorePadrao',
        useRawScores: ['acertos']
      };
    case 'TSBC':
      return {
        subtests: ['escorePadraoOD', 'escorePadraoOI'],
        names: { escorePadraoOD: 'Ordem Direta', escorePadraoOI: 'Ordem Inversa' },
        mainSubtest: 'escorePadraoOD'
      };
    case 'FVA':
      return {
        subtests: ['percentilAnimais', 'percentilFrutas', 'percentilPares'],
        names: { percentilAnimais: 'Animais', percentilFrutas: 'Frutas', percentilPares: 'Pares (Alternada)' },
        mainSubtest: 'percentilAnimais'
      };
    case 'BNTBR':
      return {
        subtests: ['percentil'],
        names: { percentil: 'Nomeação' },
        mainSubtest: 'percentil'
      };
    case 'TRILHAS':
      return {
        subtests: ['sequenciasA', 'sequenciasB', 'trilhaA', 'trilhaB'],
        names: { sequenciasA: 'Sequências A (Bruto)', sequenciasB: 'Sequências B (Bruto)', trilhaA: 'Trilha A (EP)', trilhaB: 'Trilha B (EP)' },
        mainSubtest: 'trilhaA',
        useRawScores: ['sequenciasA', 'sequenciasB']
      };
    case 'TRILHAS_PRE_ESCOLAR':
      return {
        subtests: ['sequenciasA', 'sequenciasB', 'trilhaA', 'trilhaB'],
        names: { sequenciasA: 'Sequências A (Bruto)', sequenciasB: 'Sequências B (Bruto)', trilhaA: 'Trilha A (EP)', trilhaB: 'Trilha B (EP)' },
        mainSubtest: 'trilhaA',
        useRawScores: ['sequenciasA', 'sequenciasB']
      };
    case 'TMT_ADULTO':
      return {
        subtests: ['tempoA', 'tempoB', 'tempoBA'],
        names: { tempoA: 'TMT-A (Tempo)', tempoB: 'TMT-B (Tempo)', tempoBA: 'TMT B-A (Diferença)' },
        mainSubtest: 'tempoA'
      };
    case 'FAS':
      return {
        subtests: ['percentil'],
        names: { percentil: 'Total (F+A+S)' },
        mainSubtest: 'percentil'
      };
    case 'HAYLING_ADULTO':
      return {
        subtests: ['tempoA', 'tempoB', 'errosB', 'inibiçãoBA'],
        names: { tempoA: 'Parte A (Tempo)', tempoB: 'Parte B (Tempo)', errosB: 'Parte B (Erros)', 'inibiçãoBA': 'Inibição (B-A)' },
        mainSubtest: 'inibiçãoBA'
      };
    case 'HAYLING_INFANTIL':
      return {
        subtests: ['parteATempo', 'parteBTempo', 'parteBErros', 'inibicaoBA'],
        names: { parteATempo: 'Parte A (Tempo)', parteBTempo: 'Parte B (Tempo)', parteBErros: 'Parte B (Erros)', inibicaoBA: 'Inibição (B-A)' },
        mainSubtest: 'inibicaoBA'
      };
    case 'TFV':
      return {
        subtests: ['fluenciaLivre', 'fluenciaFonemica', 'fluenciaSemantica'],
        names: { fluenciaLivre: 'Fluência Livre', fluenciaFonemica: 'Fluência Fonêmica', fluenciaSemantica: 'Fluência Semântica' },
        mainSubtest: 'fluenciaLivre'
      };
    case 'TOM':
      return {
        subtests: ['percentil'],
        names: { percentil: 'Total' },
        mainSubtest: 'percentil'
      };
    case 'TAYLOR':
      return {
        subtests: ['copia', 'reproducaoMemoria'],
        names: { copia: 'Cópia', reproducaoMemoria: 'Memória' },
        mainSubtest: 'copia'
      };
    case 'TRPP':
      return {
        subtests: ['palavras', 'pseudopalavras', 'total', 'escorePadrao'],
        names: { palavras: 'Repetição de Palavras (Bruto)', pseudopalavras: 'Repetição de Pseudopalavras (Bruto)', total: 'Total (Palavras + Pseudopalavras)', escorePadrao: 'Escore Padrão' },
        mainSubtest: 'total',
        useRawScores: ['palavras', 'pseudopalavras']
      };
    case 'FPT_INFANTIL':
      return {
        subtests: ['desenhosUnicos'],
        names: { desenhosUnicos: 'Desenhos Únicos' },
        mainSubtest: 'desenhosUnicos'
      };
    case 'FPT_ADULTO':
      return {
        subtests: ['desenhosUnicos'],
        names: { desenhosUnicos: 'Desenhos Únicos' },
        mainSubtest: 'desenhosUnicos'
      };
    case 'REY':
      return {
        subtests: ['copia', 'memoria'],
        names: { copia: 'Cópia', memoria: 'Memória' },
        mainSubtest: 'copia'
      };
    case 'STROOP':
      return {
        subtests: ['cartao1Tempo', 'cartao2Tempo', 'cartao3Tempo', 'interferencia'],
        names: { cartao1Tempo: 'Cartão 1 (Cores)', cartao2Tempo: 'Cartão 2 (Palavras)', cartao3Tempo: 'Cartão 3 (Interferência)', interferencia: 'Efeito Interferência' },
        mainSubtest: 'interferencia'
      };
    case 'WCST':
      return {
        subtests: ['totalErrors', 'perseverativeResponses', 'perseverativeErrors', 'nonPerseverativeErrors', 'categoriesCompleted'],
        names: { totalErrors: 'Total de Erros', perseverativeResponses: 'Resp. Perseverativas', perseverativeErrors: 'Erros Perseverativos', nonPerseverativeErrors: 'Erros Não-Persev.', categoriesCompleted: 'Categorias' },
        mainSubtest: 'perseverativeErrors'
      };
    case 'WECHSLER':
      return {
        subtests: ['qiTotal', 'icv', 'iop', 'imo', 'ivp', 'irf'],
        names: { qiTotal: 'QI Total', icv: 'Compreensão Verbal', iop: 'Org. Perceptual', imo: 'Memória Operacional', ivp: 'Vel. Processamento', irf: 'Raciocínio Fluido' },
        mainSubtest: 'qiTotal'
      };
    case 'TOL':
      return {
        subtests: ['totalAcertos'],
        names: { totalAcertos: 'Total de Acertos' },
        mainSubtest: 'totalAcertos'
      };
    case 'D2':
      return {
        subtests: ['rl', 'ic'],
        names: { rl: 'Resultado Líquido', ic: 'Índice de Concentração' },
        mainSubtest: 'rl'
      };
    case 'BDI':
      return {
        subtests: ['totalScore'],
        names: { totalScore: 'Escore Total' },
        mainSubtest: 'totalScore'
      };
    case 'BAI':
      return {
        subtests: ['totalScore'],
        names: { totalScore: 'Escore Total' },
        mainSubtest: 'totalScore'
      };
    case 'SNAPIV':
      return {
        subtests: ['desatencao', 'hiperatividade', 'tod'],
        names: { desatencao: 'Desatenção', hiperatividade: 'Hiperatividade', tod: 'TOD' },
        mainSubtest: 'desatencao'
      };
    case 'MCHAT':
      return {
        subtests: ['totalScore'],
        names: { totalScore: 'Escore Total' },
        mainSubtest: 'totalScore'
      };
    case 'RAVEN':
      return {
        subtests: ['total'],
        names: { total: 'Total' },
        mainSubtest: 'total'
      };
    case 'WMS':
      return {
        subtests: ['memoriaImediata', 'memoriaTargia', 'memoriaTrabalho', 'reconhecimentoVisual'],
        names: { memoriaImediata: 'Memória Imediata', memoriaTargia: 'Memória Tardia', memoriaTrabalho: 'Memória de Trabalho', reconhecimentoVisual: 'Reconhecimento Visual' },
        mainSubtest: 'memoriaImediata'
      };
    case 'MOCA':
      return {
        subtests: ['totalScore'],
        names: { totalScore: 'Escore Total' },
        mainSubtest: 'totalScore'
      };
    case 'MEEM':
      return {
        subtests: ['totalScore'],
        names: { totalScore: 'Escore Total' },
        mainSubtest: 'totalScore'
      };
    case 'BRIEF2':
      return {
        subtests: ['gec', 'bri', 'eri', 'cri'],
        names: { gec: 'Índice Global (GEC)', bri: 'Reg. Comportamental', eri: 'Reg. Emocional', cri: 'Reg. Cognitiva' },
        mainSubtest: 'gec'
      };
    case 'CORSI':
      return {
        subtests: ['spanDireto', 'spanInverso'],
        names: { spanDireto: 'Span Direto (Bruto)', spanInverso: 'Span Inverso (Bruto)' },
        mainSubtest: 'spanDireto',
        useRawScores: ['spanDireto', 'spanInverso']
      };
    case 'CONNERS':
      return {
        subtests: ['desatencao', 'hiperatividade', 'indiceTDAH'],
        names: { desatencao: 'Desatenção', hiperatividade: 'Hiperatividade', indiceTDAH: 'Índice TDAH' },
        mainSubtest: 'indiceTDAH'
      };
    case 'VINELAND':
      return {
        subtests: ['compostoGeral', 'comunicacao', 'vidaDiaria', 'socializacao', 'habMotoras'],
        names: { compostoGeral: 'CAG', comunicacao: 'Comunicação', vidaDiaria: 'Vida Diária', socializacao: 'Socialização', habMotoras: 'Hab. Motoras' },
        mainSubtest: 'compostoGeral'
      };
    case 'ACE3':
      return {
        subtests: ['totalScore'],
        names: { totalScore: 'Escore Total' },
        mainSubtest: 'totalScore'
      };
    case 'CBCL':
      return {
        subtests: ['internalizacao', 'externalizacao', 'totalProblemas'],
        names: { internalizacao: 'Internalização', externalizacao: 'Externalização', totalProblemas: 'Total Problemas' },
        mainSubtest: 'totalProblemas'
      };
    case 'SDQ':
      return {
        subtests: ['totalDificuldades', 'proSocial'],
        names: { totalDificuldades: 'Total Dificuldades', proSocial: 'Pró-social' },
        mainSubtest: 'totalDificuldades'
      };
    case 'GDS':
      return {
        subtests: ['totalScore'],
        names: { totalScore: 'Escore Total' },
        mainSubtest: 'totalScore'
      };
    case 'TDE2':
      return {
        subtests: ['escrita', 'aritmetica', 'leitura', 'totalScore'],
        names: { escrita: 'Escrita', aritmetica: 'Aritmética', leitura: 'Leitura', totalScore: 'Total' },
        mainSubtest: 'totalScore'
      };
    case 'NEUPSILIN':
      return {
        subtests: ['orientacao', 'atencao', 'percepcao', 'memoria', 'aritmetica', 'linguagem', 'praxias', 'funcoesExecutivas'],
        names: { orientacao: 'Orientação', atencao: 'Atenção', percepcao: 'Percepção', memoria: 'Memória', aritmetica: 'Aritmética', linguagem: 'Linguagem', praxias: 'Praxias', funcoesExecutivas: 'Funções Exec.' },
        mainSubtest: 'memoria'
      };
    case 'CANCELAMENTO':
      return {
        subtests: ['totalLiquido'],
        names: { totalLiquido: 'Total Líquido' },
        mainSubtest: 'totalLiquido'
      };
    default:
      return null;
  }
};

interface GenericTestResults {
  rawScores?: Record<string, number>;
  calculatedScores: Record<string, number>;
  percentiles: Record<string, number | string>;
  percentileRanges?: Record<string, string>;
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

// Testes que usam Escore Padrão (M=100, DP=15) - percentil calculado via EP
const EP_TESTS = ['TIN', 'PCFO', 'TSBC', 'TRILHAS', 'TRILHAS_PRE_ESCOLAR', 'TRPP', 'WMS', 'VINELAND', 'WECHSLER'];

// Testes que usam Escore T (M=50, DP=10) - percentil calculado via T-score
const TSCORE_TESTS = ['CONNERS', 'CBCL', 'BRIEF2'];

// Testes de rastreamento - não usam percentil normativo
const SCREENING_TESTS = ['SNAPIV', 'MCHAT', 'MOCA', 'MEEM', 'GDS', 'ACE3', 'SDQ'];

/**
 * Calcula percentil automaticamente baseado no tipo de teste
 */
const getAutoPercentile = (testCode: string, scoreValue: number | string): number | null => {
  const val = typeof scoreValue === 'string' ? parseFloat(scoreValue) : scoreValue;
  if (isNaN(val)) return null;
  
  if (EP_TESTS.includes(testCode)) {
    return epToPercentile(val);
  }
  if (TSCORE_TESTS.includes(testCode)) {
    return tScoreToPercentile(val);
  }
  return null;
};

// ==================== RENDER INPUTS ====================

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

const renderRAVLTCalculations = (raw: Record<string, number>, calc: Record<string, number>) => {
  const a1 = raw.a1 ?? 0, a2 = raw.a2 ?? 0, a3 = raw.a3 ?? 0, a4 = raw.a4 ?? 0, a5 = raw.a5 ?? 0;
  const a6 = raw.a6 ?? 0, a7 = raw.a7 ?? 0, b1 = raw.b1 ?? 0, rec = raw.rec ?? 0;
  const escoreTotal = calc.escoreTotal ?? 0, reconhecimento = calc.reconhecimento ?? 0;
  const alt = calc.alt ?? 0, velEsq = calc.velocidadeEsquecimento ?? 0;
  const intProativa = calc.interferenciaProativa ?? 0, intRetroativa = calc.interferenciaRetroativa ?? 0;

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

const renderFDTInputs = (rawScores: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {['leitura', 'contagem', 'escolha', 'alternancia'].map(key => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
        <Badge variant="outline" className="font-mono text-lg">{rawScores[key] ?? '-'}s</Badge>
      </div>
    ))}
  </div>
);

const renderFDTCalculations = (raw: Record<string, number>, calc: Record<string, number>) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Inibição</span>
      <span className="font-mono text-xs">{raw.escolha ?? 0} - {raw.leitura ?? 0} = <strong>{(calc.inibicao ?? 0).toFixed(1)}</strong></span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Flexibilidade</span>
      <span className="font-mono text-xs">{raw.alternancia ?? 0} - {raw.leitura ?? 0} = <strong>{(calc.flexibilidade ?? 0).toFixed(1)}</strong></span>
    </div>
  </div>
);

const renderBPA2Inputs = (rawScores: Record<string, number>, calc: Record<string, number>) => (
  <div className="space-y-2">
    {['AC', 'AD', 'AA'].map(subtest => (
      <div key={subtest} className="p-3 bg-muted/30 rounded-lg border">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {subtest === 'AC' ? 'Atenção Concentrada' : subtest === 'AD' ? 'Atenção Dividida' : 'Atenção Alternada'}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="font-mono">A={rawScores[`${subtest}_acertos`] ?? '-'}</Badge>
          <Badge variant="outline" className="font-mono">E={rawScores[`${subtest}_erros`] ?? '-'}</Badge>
          <Badge variant="outline" className="font-mono">O={rawScores[`${subtest}_omissoes`] ?? '-'}</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="secondary" className="font-mono font-bold">Score: {calc[subtest] ?? '-'}</Badge>
        </div>
      </div>
    ))}
  </div>
);

const renderBPA2Calculations = (calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Score = Acertos - Erros - Omissões</span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Atenção Geral (AG)</span>
      <span className="font-mono text-xs">{calc.AC ?? 0} + {calc.AD ?? 0} + {calc.AA ?? 0} = <strong>{calc.AG ?? 0}</strong></span>
    </div>
  </div>
);

const renderTINInputs = (rawScores: Record<string, number>) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Total de Acertos</p>
    <Badge variant="outline" className="font-mono text-lg">{rawScores.acertos ?? '-'}</Badge>
    <p className="text-xs text-muted-foreground mt-1">(máximo: 60)</p>
  </div>
);

const renderEPCalculations = (testName: string, calc: Record<string, number>, epKeys: string[], labels: Record<string, string>) => {
  return (
    <div className="space-y-2 text-sm">
      <div className="p-2 bg-muted/30 rounded-lg">
        <span className="text-muted-foreground">Fórmula: </span>
        <span className="font-mono">EP via tabela normativa → Z = (EP - 100) / 15 → Percentil via CDF normal</span>
      </div>
      {epKeys.map(key => {
        const ep = calc[key];
        if (ep === undefined || ep === null) return null;
        const z = ((ep - 100) / 15).toFixed(2);
        const percentil = epToPercentile(ep);
        return (
          <div key={key} className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
            <span className="font-medium">{labels[key] || key}</span>
            <span className="font-mono text-xs">EP={ep} → Z=({ep}-100)/15={z} → <strong>Percentil {percentil}</strong></span>
          </div>
        );
      })}
      {renderEPClassificationScale()}
    </div>
  );
};

const renderEPClassificationScale = () => (
  <div className="p-2 bg-muted/30 rounded-lg">
    <p className="text-xs font-medium text-muted-foreground mb-2">Escala de Classificação (EP, M=100, DP=15):</p>
    <div className="flex flex-wrap gap-1 text-xs">
      <Badge variant="outline" className="text-red-600 dark:text-red-400">&lt;70: Muito Baixa</Badge>
      <Badge variant="outline" className="text-orange-600 dark:text-orange-400">70-84: Baixa</Badge>
      <Badge variant="outline" className="text-gray-600 dark:text-gray-400">85-114: Média</Badge>
      <Badge variant="outline" className="text-blue-600 dark:text-blue-400">115-129: Alta</Badge>
      <Badge variant="outline" className="text-green-600 dark:text-green-400">≥130: Muito Alta</Badge>
    </div>
  </div>
);

const renderTScoreCalculations = (calc: Record<string, number>, keys: string[], labels: Record<string, string>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Z = (T - 50) / 10 → Percentil via CDF normal</span>
    </div>
    {keys.map(key => {
      const t = calc[key];
      if (t === undefined || t === null) return null;
      const z = ((t - 50) / 10).toFixed(2);
      const percentil = tScoreToPercentile(t);
      return (
        <div key={key} className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
          <span className="font-medium">{labels[key] || key}</span>
          <span className="font-mono text-xs">T={t} → Z=({t}-50)/10={z} → <strong>Percentil {percentil}</strong></span>
        </div>
      );
    })}
  </div>
);

const renderScreeningNote = () => (
  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
      <Info className="h-3.5 w-3.5 flex-shrink-0" />
      <span>Teste de rastreamento — utiliza pontos de corte, não percentil normativo.</span>
    </div>
  </div>
);

const renderPCFOInputs = (rawScores: Record<string, number | string>) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Total de Acertos</p>
    <Badge variant="outline" className="font-mono text-lg">{rawScores.acertos ?? '-'}</Badge>
    <p className="text-xs text-muted-foreground mt-1">(máximo: 40)</p>
    {rawScores.schoolingLevel && (
      <p className="text-xs text-muted-foreground mt-1">
        Nível: {rawScores.schoolingLevel === 'infantil' ? 'Educação Infantil' : 'Ensino Fundamental'}
      </p>
    )}
  </div>
);

const renderTSBCInputs = (rawScores: Record<string, number | string>) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">Ordem Direta (acertos)</p>
        <Badge variant="outline" className="font-mono text-lg">{rawScores.ordemDireta ?? '-'}</Badge>
      </div>
      <div className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">Ordem Inversa (acertos)</p>
        <Badge variant="outline" className="font-mono text-lg">{rawScores.ordemInversa ?? '-'}</Badge>
      </div>
    </div>
    <div className="p-2 bg-muted/30 rounded-lg text-center">
      <p className="text-xs text-muted-foreground">
        Tipo de Escola: <strong>{rawScores.schoolType === 'publica' ? 'Pública' : 'Privada'}</strong>
      </p>
    </div>
  </div>
);

const renderFVAInputs = (rawScores: Record<string, number>) => (
  <div className="grid grid-cols-3 gap-3">
    {['animais', 'frutas', 'pares'].map(key => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
        <Badge variant="outline" className="font-mono text-lg">{rawScores[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

const renderFVACalculations = (calc: Record<string, string>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Percentil = Consulta tabela normativa por idade</span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {['percentilAnimais', 'percentilFrutas', 'percentilPares'].map(key => (
        <div key={key} className="p-2 bg-primary/10 rounded-lg text-center">
          <span className="font-medium block mb-1">{key.replace('percentil', '')}</span>
          <span className="font-mono text-sm">{calc[key] ?? '-'}</span>
        </div>
      ))}
    </div>
    <div className="p-2 bg-muted/30 rounded-lg">
      <p className="text-xs font-medium text-muted-foreground mb-2">Escala de Classificação:</p>
      <div className="flex flex-wrap gap-1 text-xs">
        <Badge variant="outline" className="text-red-600 dark:text-red-400">&lt;5 ou 5: Inferior</Badge>
        <Badge variant="outline" className="text-orange-600 dark:text-orange-400">5-25: Média Inferior</Badge>
        <Badge variant="outline" className="text-gray-600 dark:text-gray-400">25-75: Média</Badge>
        <Badge variant="outline" className="text-blue-600 dark:text-blue-400">75-95: Média Superior</Badge>
        <Badge variant="outline" className="text-green-600 dark:text-green-400">&gt;95: Superior</Badge>
      </div>
    </div>
  </div>
);

const renderBNTBRInputs = (rawScores: Record<string, number>) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Total de Acertos</p>
    <Badge variant="outline" className="font-mono text-lg">{rawScores.acertos ?? '-'}</Badge>
    <p className="text-xs text-muted-foreground mt-1">(máximo: 30)</p>
  </div>
);

const renderBNTBRCalculations = (calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Z = (Acertos - Média) / DP → Percentil</span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="p-2 bg-primary/10 rounded-lg text-center">
        <span className="font-medium block mb-1">Pontuação</span>
        <span className="font-mono text-sm">{calc.pontuacao ?? '-'}</span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg text-center">
        <span className="font-medium block mb-1">Z-Score</span>
        <span className="font-mono text-sm">{typeof calc.zScore === 'number' ? calc.zScore.toFixed(2) : '-'}</span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg text-center">
        <span className="font-medium block mb-1">Percentil</span>
        <span className="font-mono text-sm">{calc.percentil ?? '-'}</span>
      </div>
    </div>
  </div>
);

const renderTrilhasInputs = (rawScores: Record<string, number>) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Sequências A (Bruto)</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.sequenciasA ?? '-'}</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Sequências B (Bruto)</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.sequenciasB ?? '-'}</Badge>
    </div>
  </div>
);

const renderTRPPInputs = (rawScores: Record<string, number>) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Palavras (Bruto)</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.palavras ?? '-'}</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Pseudopalavras (Bruto)</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.pseudopalavras ?? '-'}</Badge>
    </div>
  </div>
);

const renderCorsiInputs = (rawScores: Record<string, number>) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Span Direto (Bruto)</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.spanDireto ?? '-'}</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Span Inverso (Bruto)</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.spanInverso ?? '-'}</Badge>
    </div>
  </div>
);

const renderCorsiCalculations = (percentiles: Record<string, number | string>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Referência: </span>
      <span className="font-mono">Span Direto (média ~5, DP ~1.1) | Span Inverso (média ~4.5, DP ~1.1)</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Percentil Direto</span>
        <span className="font-mono"><strong>{percentiles.spanDireto ?? '-'}</strong></span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Percentil Inverso</span>
        <span className="font-mono"><strong>{percentiles.spanInverso ?? '-'}</strong></span>
      </div>
    </div>
  </div>
);

// ==================== GENERIC INPUTS FOR REMAINING TESTS ====================

const renderGenericScoreInputs = (rawScores: Record<string, number>, labels: Record<string, string>) => {
  const entries = Object.entries(labels).filter(([key]) => rawScores[key] !== undefined);
  if (entries.length === 0) return null;

  return (
    <div className={`grid grid-cols-${Math.min(entries.length, 4)} gap-3`}>
      {entries.map(([key, label]) => (
        <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
          <Badge variant="outline" className="font-mono text-lg">{rawScores[key] ?? '-'}</Badge>
        </div>
      ))}
    </div>
  );
};

// TMT Adulto
const renderTMTAdultoInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Tempo A (segundos)</p>
      <Badge variant="outline" className="font-mono text-lg">{raw.tempoA ?? '-'}s</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Tempo B (segundos)</p>
      <Badge variant="outline" className="font-mono text-lg">{raw.tempoB ?? '-'}s</Badge>
    </div>
  </div>
);

const renderTMTAdultoCalculations = (raw: Record<string, number>, calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">B-A = Tempo B - Tempo A → Percentil via tabela normativa por idade</span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">TMT B-A</span>
      <span className="font-mono text-xs">{raw.tempoB ?? 0} - {raw.tempoA ?? 0} = <strong>{calc.tempoBA ?? (raw.tempoB ?? 0) - (raw.tempoA ?? 0)}</strong></span>
    </div>
  </div>
);

// FAS
const renderFASInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-3 gap-3">
    {['f', 'a', 's'].map(letter => (
      <div key={letter} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">Letra {letter.toUpperCase()}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[letter] ?? raw[`letra${letter.toUpperCase()}`] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

const renderFASCalculations = (raw: Record<string, number>, calc: Record<string, number>) => {
  const f = raw.f ?? raw.letraF ?? 0;
  const a = raw.a ?? raw.letraA ?? 0;
  const s = raw.s ?? raw.letraS ?? 0;
  const total = f + a + s;
  return (
    <div className="space-y-2 text-sm">
      <div className="p-2 bg-muted/30 rounded-lg">
        <span className="text-muted-foreground">Fórmula: </span>
        <span className="font-mono">Total = F + A + S → Percentil via tabela normativa por idade e escolaridade</span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Total FAS</span>
        <span className="font-mono text-xs">{f} + {a} + {s} = <strong>{total}</strong></span>
      </div>
    </div>
  );
};

// Hayling
const renderHaylingInputs = (raw: Record<string, number>, isAdulto: boolean) => {
  const tA = isAdulto ? 'tempoA' : 'parteATempo';
  const tB = isAdulto ? 'tempoB' : 'parteBTempo';
  const eB = isAdulto ? 'errosB' : 'parteBErros';
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">Parte A (Tempo)</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[tA] ?? '-'}s</Badge>
      </div>
      <div className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">Parte B (Tempo)</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[tB] ?? '-'}s</Badge>
      </div>
      <div className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">Parte B (Erros)</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[eB] ?? '-'}</Badge>
      </div>
    </div>
  );
};

const renderHaylingCalculations = (raw: Record<string, number>, calc: Record<string, number>, isAdulto: boolean) => {
  const tA = raw[isAdulto ? 'tempoA' : 'parteATempo'] ?? 0;
  const tB = raw[isAdulto ? 'tempoB' : 'parteBTempo'] ?? 0;
  const inhib = isAdulto ? calc['inibiçãoBA'] : calc.inibicaoBA;
  return (
    <div className="space-y-2 text-sm">
      <div className="p-2 bg-muted/30 rounded-lg">
        <span className="text-muted-foreground">Fórmula: </span>
        <span className="font-mono">Inibição (B-A) = Tempo B - Tempo A → Percentil via tabela normativa</span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">Inibição (B-A)</span>
        <span className="font-mono text-xs">{tB} - {tA} = <strong>{inhib ?? (tB - tA)}</strong></span>
      </div>
    </div>
  );
};

// TFV
const renderTFVInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-3 gap-3">
    {[['fluenciaLivre', 'Fluência Livre'], ['fluenciaFonemica', 'Fluência Fonêmica'], ['fluenciaSemantica', 'Fluência Semântica']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

const renderTFVCalculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Total de palavras em cada condição → Percentil via tabela normativa por idade</span>
    </div>
  </div>
);

// Taylor / Rey
const renderFiguraInputs = (raw: Record<string, number>, testName: string) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Cópia (Bruto)</p>
      <Badge variant="outline" className="font-mono text-lg">{raw.copia ?? raw.copiaRaw ?? '-'}</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Memória (Bruto)</p>
      <Badge variant="outline" className="font-mono text-lg">{raw.memoria ?? raw.reproducaoMemoria ?? raw.memoriaRaw ?? '-'}</Badge>
    </div>
  </div>
);

const renderFiguraCalculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Escore bruto → Percentil via tabela normativa por idade</span>
    </div>
  </div>
);

// Stroop
const renderStroopInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-3 gap-3">
    {[['cartao1Tempo', 'Cartão 1 (Cores)'], ['cartao2Tempo', 'Cartão 2 (Palavras)'], ['cartao3Tempo', 'Cartão 3 (Interferência)']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}s</Badge>
      </div>
    ))}
  </div>
);

const renderStroopCalculations = (raw: Record<string, number>, calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Interferência = Cartão 3 - Cartão 1 → Percentil via tabela normativa</span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Efeito Interferência</span>
      <span className="font-mono text-xs">{raw.cartao3Tempo ?? 0} - {raw.cartao1Tempo ?? 0} = <strong>{calc.interferencia ?? '-'}</strong></span>
    </div>
  </div>
);

// D2
const renderD2Inputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {[['totalProcessado', 'Total Processado'], ['acertosD2', 'Acertos'], ['erros1', 'E1 (Omissão)'], ['erros2', 'E2 (Comissão)']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

const renderD2Calculations = (raw: Record<string, number>, calc: Record<string, number>) => {
  const total = raw.totalProcessado ?? 0;
  const acertos = raw.acertosD2 ?? 0;
  const e1 = raw.erros1 ?? 0;
  const e2 = raw.erros2 ?? 0;
  return (
    <div className="space-y-2 text-sm">
      <div className="p-2 bg-muted/30 rounded-lg">
        <span className="text-muted-foreground">Fórmulas: </span>
        <span className="font-mono">RL = Total - (E1+E2) | IC = Acertos - E2</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
          <span className="font-medium">RL</span>
          <span className="font-mono text-xs">{total} - ({e1}+{e2}) = <strong>{calc.rl ?? total - (e1 + e2)}</strong></span>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
          <span className="font-medium">IC</span>
          <span className="font-mono text-xs">{acertos} - {e2} = <strong>{calc.ic ?? acertos - e2}</strong></span>
        </div>
      </div>
    </div>
  );
};

// BDI / BAI
const renderScaleInputs = (raw: Record<string, number>, testName: string, maxScore: number) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Escore Total</p>
    <Badge variant="outline" className="font-mono text-lg">{raw.totalScore ?? '-'}</Badge>
    <p className="text-xs text-muted-foreground mt-1">(máximo: {maxScore})</p>
  </div>
);

const renderBDICalculations = (calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Classificação por pontos de corte: </span>
      <span className="font-mono">0-13: Mínimo | 14-19: Leve | 20-28: Moderado | 29-63: Grave</span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Escore</span>
      <span className="font-mono"><strong>{calc.totalScore ?? '-'}</strong></span>
    </div>
  </div>
);

const renderBAICalculations = (calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Classificação por pontos de corte: </span>
      <span className="font-mono">0-10: Mínimo | 11-19: Leve | 20-30: Moderado | 31-63: Grave</span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Escore</span>
      <span className="font-mono"><strong>{calc.totalScore ?? '-'}</strong></span>
    </div>
  </div>
);

// WCST
const renderWCSTInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {[['totalErrors', 'Total Erros'], ['perseverativeResponses', 'Resp. Perseverativas'], ['perseverativeErrors', 'Erros Persev.'], ['nonPerseverativeErrors', 'Erros Não-Persev.'], ['categoriesCompleted', 'Categorias']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

const renderWCSTCalculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Escores brutos → Percentil via tabela normativa por idade e escolaridade</span>
    </div>
  </div>
);

// Wechsler (WAIS/WISC)
const renderWechslerInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {[['qiTotal', 'QI Total'], ['icv', 'Compreensão Verbal'], ['iop', 'Org. Perceptual'], ['imo', 'Memória Operacional'], ['ivp', 'Vel. Processamento'], ['irf', 'Raciocínio Fluido']].map(([key, label]) => {
      const val = raw[key];
      if (val === undefined || val === 0) return null;
      return (
        <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
          <Badge variant="outline" className="font-mono text-lg">{val}</Badge>
        </div>
      );
    })}
  </div>
);

// WMS
const renderWMSInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 gap-3">
    {[['memoriaImediata', 'Memória Imediata'], ['memoriaTargia', 'Memória Tardia'], ['memoriaTrabalho', 'Memória de Trabalho'], ['reconhecimentoVisual', 'Reconhecimento Visual']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

// Vineland
const renderVinelandInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {[['compostoGeral', 'CAG'], ['comunicacao', 'Comunicação'], ['vidaDiaria', 'Vida Diária'], ['socializacao', 'Socialização'], ['habMotoras', 'Hab. Motoras']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

// Conners
const renderConnersInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {[['desatencao', 'Desatenção'], ['hiperatividade', 'Hiperatividade'], ['indiceTDAH', 'Índice TDAH']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label} (T)</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

// CBCL
const renderCBCLInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-3 gap-3">
    {[['internalizacao', 'Internalização'], ['externalizacao', 'Externalização'], ['totalProblemas', 'Total Problemas']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label} (T)</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

// BRIEF2
const renderBRIEF2Inputs = (raw: Record<string, number>, calc: Record<string, number>) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[['gec', 'GEC'], ['bri', 'BRI'], ['eri', 'ERI'], ['cri', 'CRI']].map(([key, label]) => (
        <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">{label} (T)</p>
          <Badge variant="outline" className="font-mono text-lg">{calc[key] ?? raw[key] ?? '-'}</Badge>
        </div>
      ))}
    </div>
  </div>
);

// Raven
const renderRavenInputs = (raw: Record<string, number>) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Total de Acertos</p>
    <Badge variant="outline" className="font-mono text-lg">{raw.total ?? raw.totalRaw ?? '-'}</Badge>
  </div>
);

const renderRavenCalculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Total de acertos → Percentil via tabela normativa por idade</span>
    </div>
  </div>
);

// TOL
const renderTOLInputs = (raw: Record<string, number>) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Total de Acertos</p>
    <Badge variant="outline" className="font-mono text-lg">{raw.totalAcertos ?? '-'}</Badge>
  </div>
);

const renderTOLCalculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Total de acertos → Percentil via tabela normativa por idade</span>
    </div>
  </div>
);

// FPT
const renderFPTInputs = (raw: Record<string, number>) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Desenhos Únicos</p>
    <Badge variant="outline" className="font-mono text-lg">{raw.desenhosUnicos ?? '-'}</Badge>
  </div>
);

const renderFPTCalculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Desenhos únicos → Percentil via tabela normativa por idade</span>
    </div>
  </div>
);

// TOM
const renderTOMInputs = (raw: Record<string, number>) => (
  <div className="p-3 bg-muted/30 rounded-lg border text-center">
    <p className="text-xs font-medium text-muted-foreground mb-1">Escore Bruto</p>
    <Badge variant="outline" className="font-mono text-lg">{raw.total ?? raw.totalRaw ?? '-'}</Badge>
  </div>
);

const renderTOMCalculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Escore bruto → Percentil via tabela normativa por idade</span>
    </div>
  </div>
);

// Cancelamento
const renderCancelamentoInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-3 gap-3">
    {[['acertos', 'Acertos'], ['erros', 'Erros'], ['omissoes', 'Omissões']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

const renderCancelamentoCalculations = (raw: Record<string, number>, calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Total Líquido = Acertos - Erros → Percentil via tabela normativa</span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Total Líquido</span>
      <span className="font-mono text-xs">{raw.acertos ?? 0} - {raw.erros ?? 0} = <strong>{calc.totalLiquido ?? '-'}</strong></span>
    </div>
  </div>
);

// NEUPSILIN
const renderNEUPSILINInputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {[['orientacao', 'Orientação'], ['atencao', 'Atenção'], ['percepcao', 'Percepção'], ['memoria', 'Memória'], ['aritmetica', 'Aritmética'], ['linguagem', 'Linguagem'], ['praxias', 'Praxias'], ['funcoesExecutivas', 'Funções Exec.']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

const renderNEUPSILINCalculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Escores brutos por domínio → Percentil via tabela normativa por idade e escolaridade</span>
    </div>
  </div>
);

// TDE-II
const renderTDE2Inputs = (raw: Record<string, number>) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {[['escrita', 'Escrita'], ['aritmetica', 'Aritmética'], ['leitura', 'Leitura'], ['totalScore', 'Total']].map(([key, label]) => (
      <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <Badge variant="outline" className="font-mono text-lg">{raw[key] ?? '-'}</Badge>
      </div>
    ))}
  </div>
);

const renderTDE2Calculations = () => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Escores brutos → Classificação via tabela normativa por série escolar</span>
    </div>
  </div>
);

// Screening tests
const renderScreeningInputs = (raw: Record<string, number>, calc: Record<string, number>, testCode: string) => {
  switch (testCode) {
    case 'SNAPIV':
      return (
        <div className="grid grid-cols-3 gap-3">
          {[['desatencao', 'Desatenção'], ['hiperatividade', 'Hiperatividade'], ['tod', 'TOD']].map(([key, label]) => (
            <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
              <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
              <Badge variant="outline" className="font-mono text-lg">{calc[key] ?? raw[key] ?? '-'}</Badge>
            </div>
          ))}
        </div>
      );
    case 'MCHAT':
      return (
        <div className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Escore Total</p>
          <Badge variant="outline" className="font-mono text-lg">{calc.totalScore ?? raw.totalScore ?? '-'}</Badge>
          <p className="text-xs text-muted-foreground mt-1">(máximo: 20)</p>
        </div>
      );
    case 'MOCA':
      return (
        <div className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Escore Total</p>
          <Badge variant="outline" className="font-mono text-lg">{calc.totalScore ?? raw.totalScore ?? '-'}/30</Badge>
        </div>
      );
    case 'MEEM':
      return (
        <div className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Escore Total</p>
          <Badge variant="outline" className="font-mono text-lg">{calc.totalScore ?? raw.totalScore ?? '-'}/30</Badge>
        </div>
      );
    case 'GDS':
      return (
        <div className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Escore Total</p>
          <Badge variant="outline" className="font-mono text-lg">{calc.totalScore ?? raw.totalScore ?? '-'}/30</Badge>
        </div>
      );
    case 'ACE3':
      return (
        <div className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Escore Total</p>
          <Badge variant="outline" className="font-mono text-lg">{calc.totalScore ?? raw.totalScore ?? '-'}/100</Badge>
        </div>
      );
    case 'SDQ':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg border text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Dificuldades</p>
            <Badge variant="outline" className="font-mono text-lg">{calc.totalDificuldades ?? raw.totalDificuldades ?? '-'}/40</Badge>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg border text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Pró-social</p>
            <Badge variant="outline" className="font-mono text-lg">{calc.proSocial ?? raw.proSocial ?? '-'}/10</Badge>
          </div>
        </div>
      );
    default:
      return null;
  }
};

const renderScreeningCalculations = (calc: Record<string, number>, testCode: string) => {
  const getScreeningFormula = () => {
    switch (testCode) {
      case 'SNAPIV':
        return 'Média por escala ≥ 1.5 = indicativo clínico (ponto de corte)';
      case 'MCHAT':
        return '0-2: Baixo risco | 3-7: Risco moderado | 8-20: Alto risco';
      case 'MOCA':
        return 'Escore ≥ 26/30: Normal | < 26: Declínio cognitivo';
      case 'MEEM':
        return 'Pontos de corte por escolaridade: Analfabetos ≥20 | 1-4 anos ≥25 | 5-8 anos ≥26 | 9-11 anos ≥28 | ≥12 anos ≥29';
      case 'GDS':
        return '0-5: Normal | 6-10: Depressão leve | 11-15: Depressão grave';
      case 'ACE3':
        return 'Escore ≥ 82/100: Normal | < 82: Indicativo de declínio';
      case 'SDQ':
        return 'Total: 0-13 Normal | 14-16 Limítrofe | 17-40 Anormal | Pró-social: 6-10 Normal | 5 Limítrofe | 0-4 Anormal';
      default:
        return 'Classificação por pontos de corte';
    }
  };

  return (
    <div className="space-y-2 text-sm">
      <div className="p-2 bg-muted/30 rounded-lg">
        <span className="text-muted-foreground">Classificação: </span>
        <span className="font-mono">{getScreeningFormula()}</span>
      </div>
      {renderScreeningNote()}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

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

  const getScoreValue = (subtestCode: string): number | string => {
    if (config.useRawScores?.includes(subtestCode) && results.rawScores) {
      return results.rawScores[subtestCode] ?? '-';
    }
    return results.calculatedScores[subtestCode] ?? '-';
  };

  /**
   * Obtém o percentil para uma variável, calculando automaticamente se necessário
   */
  const getPercentileValue = (subtestCode: string): number | string => {
    // Primeiro verifica se já existe um percentil no resultado
    const existing = results.percentiles[subtestCode];
    if (existing !== undefined && existing !== null && existing !== '-') return existing;

    // Para testes EP, calcula automaticamente a partir do score
    const scoreVal = results.calculatedScores[subtestCode];
    if (scoreVal !== undefined && scoreVal !== null && !isNaN(Number(scoreVal))) {
      const auto = getAutoPercentile(testCode, scoreVal);
      if (auto !== null) return auto;
    }

    // Para testes de rastreamento
    if (SCREENING_TESTS.includes(testCode)) {
      return 'N/A';
    }

    return existing ?? '-';
  };

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
        calculationsSection = renderEPCalculations('TIN', calculatedScores, ['escorePadrao'], { escorePadrao: 'Escore Padrão' });
        break;
      case 'PCFO':
        inputSection = renderPCFOInputs(rawScores);
        calculationsSection = renderEPCalculations('PCFO', calculatedScores, ['escorePadrao'], { escorePadrao: 'Escore Padrão' });
        break;
      case 'TSBC':
        inputSection = renderTSBCInputs(rawScores);
        calculationsSection = renderEPCalculations('TSBC', calculatedScores, ['escorePadraoOD', 'escorePadraoOI'], { escorePadraoOD: 'EP Ordem Direta', escorePadraoOI: 'EP Ordem Inversa' });
        break;
      case 'FVA':
        inputSection = renderFVAInputs(rawScores);
        calculationsSection = renderFVACalculations(calculatedScores as unknown as Record<string, string>);
        break;
      case 'BNTBR':
        inputSection = renderBNTBRInputs(rawScores);
        calculationsSection = renderBNTBRCalculations(calculatedScores);
        break;
      case 'TRILHAS':
      case 'TRILHAS_PRE_ESCOLAR':
        inputSection = renderTrilhasInputs(rawScores);
        calculationsSection = renderEPCalculations('Trilhas', calculatedScores, 
          ['escorePadraoA', 'escorePadraoB', 'trilhaA', 'trilhaB'].filter(k => calculatedScores[k] !== undefined),
          { escorePadraoA: 'EP Trilha A', escorePadraoB: 'EP Trilha B', trilhaA: 'EP Trilha A', trilhaB: 'EP Trilha B' }
        );
        break;
      case 'TRPP':
        inputSection = renderTRPPInputs(rawScores);
        calculationsSection = (() => {
          const total = calculatedScores.total ?? '-';
          const ep = calculatedScores.escorePadrao;
          return (
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground">Fórmula: </span>
                <span className="font-mono">Total = Palavras + Pseudopalavras → EP via tabela → Z = (EP-100)/15 → Percentil</span>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="font-mono text-xs">{rawScores.palavras ?? 0} + {rawScores.pseudopalavras ?? 0} = <strong>{total}</strong></span>
              </div>
              {ep != null && !isNaN(Number(ep)) && (
                <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
                  <span className="font-medium">Escore Padrão → Percentil</span>
                  <span className="font-mono text-xs">{getPercentileFormula('ep', Number(ep))}</span>
                </div>
              )}
              {renderEPClassificationScale()}
            </div>
          );
        })();
        break;
      case 'CORSI':
        inputSection = renderCorsiInputs(rawScores);
        calculationsSection = renderCorsiCalculations(results.percentiles);
        break;
      case 'TMT_ADULTO':
        inputSection = renderTMTAdultoInputs(rawScores);
        calculationsSection = renderTMTAdultoCalculations(rawScores, calculatedScores);
        break;
      case 'FAS':
        inputSection = renderFASInputs(rawScores);
        calculationsSection = renderFASCalculations(rawScores, calculatedScores);
        break;
      case 'HAYLING_ADULTO':
        inputSection = renderHaylingInputs(rawScores, true);
        calculationsSection = renderHaylingCalculations(rawScores, calculatedScores, true);
        break;
      case 'HAYLING_INFANTIL':
        inputSection = renderHaylingInputs(rawScores, false);
        calculationsSection = renderHaylingCalculations(rawScores, calculatedScores, false);
        break;
      case 'TFV':
        inputSection = renderTFVInputs(rawScores);
        calculationsSection = renderTFVCalculations();
        break;
      case 'TOM':
        inputSection = renderTOMInputs(rawScores);
        calculationsSection = renderTOMCalculations();
        break;
      case 'TAYLOR':
        inputSection = renderFiguraInputs(rawScores, 'Taylor');
        calculationsSection = renderFiguraCalculations();
        break;
      case 'REY':
        inputSection = renderFiguraInputs(rawScores, 'Rey');
        calculationsSection = renderFiguraCalculations();
        break;
      case 'STROOP':
        inputSection = renderStroopInputs(rawScores);
        calculationsSection = renderStroopCalculations(rawScores, calculatedScores);
        break;
      case 'D2':
        inputSection = renderD2Inputs(rawScores);
        calculationsSection = renderD2Calculations(rawScores, calculatedScores);
        break;
      case 'BDI':
        inputSection = renderScaleInputs(rawScores.totalScore !== undefined ? rawScores : calculatedScores, 'BDI', 63);
        calculationsSection = renderBDICalculations(calculatedScores);
        break;
      case 'BAI':
        inputSection = renderScaleInputs(rawScores.totalScore !== undefined ? rawScores : calculatedScores, 'BAI', 63);
        calculationsSection = renderBAICalculations(calculatedScores);
        break;
      case 'WCST':
        inputSection = renderWCSTInputs(rawScores);
        calculationsSection = renderWCSTCalculations();
        break;
      case 'WECHSLER':
        inputSection = renderWechslerInputs(rawScores.qiTotal !== undefined ? rawScores : calculatedScores);
        calculationsSection = renderEPCalculations('Wechsler', 
          rawScores.qiTotal !== undefined ? rawScores : calculatedScores,
          ['qiTotal', 'icv', 'iop', 'imo', 'ivp', 'irf'].filter(k => {
            const scores = rawScores.qiTotal !== undefined ? rawScores : calculatedScores;
            return scores[k] !== undefined && scores[k] !== 0;
          }),
          { qiTotal: 'QI Total', icv: 'Compreensão Verbal', iop: 'Org. Perceptual', imo: 'Memória Operacional', ivp: 'Vel. Processamento', irf: 'Raciocínio Fluido' }
        );
        break;
      case 'RAVEN':
        inputSection = renderRavenInputs(rawScores);
        calculationsSection = renderRavenCalculations();
        break;
      case 'TOL':
        inputSection = renderTOLInputs(rawScores);
        calculationsSection = renderTOLCalculations();
        break;
      case 'FPT_INFANTIL':
      case 'FPT_ADULTO':
        inputSection = renderFPTInputs(rawScores);
        calculationsSection = renderFPTCalculations();
        break;
      case 'CANCELAMENTO':
        inputSection = renderCancelamentoInputs(rawScores);
        calculationsSection = renderCancelamentoCalculations(rawScores, calculatedScores);
        break;
      case 'NEUPSILIN':
        inputSection = renderNEUPSILINInputs(rawScores);
        calculationsSection = renderNEUPSILINCalculations();
        break;
      case 'TDE2':
        inputSection = renderTDE2Inputs(rawScores);
        calculationsSection = renderTDE2Calculations();
        break;
      case 'WMS':
        inputSection = renderWMSInputs(rawScores.memoriaImediata !== undefined ? rawScores : calculatedScores);
        calculationsSection = renderEPCalculations('WMS',
          rawScores.memoriaImediata !== undefined ? rawScores : calculatedScores,
          ['memoriaImediata', 'memoriaTargia', 'memoriaTrabalho', 'reconhecimentoVisual'],
          { memoriaImediata: 'Memória Imediata', memoriaTargia: 'Memória Tardia', memoriaTrabalho: 'Memória de Trabalho', reconhecimentoVisual: 'Reconhecimento Visual' }
        );
        break;
      case 'VINELAND':
        inputSection = renderVinelandInputs(rawScores.compostoGeral !== undefined ? rawScores : calculatedScores);
        calculationsSection = renderEPCalculations('Vineland',
          rawScores.compostoGeral !== undefined ? rawScores : calculatedScores,
          ['compostoGeral', 'comunicacao', 'vidaDiaria', 'socializacao', 'habMotoras'],
          { compostoGeral: 'CAG', comunicacao: 'Comunicação', vidaDiaria: 'Vida Diária', socializacao: 'Socialização', habMotoras: 'Hab. Motoras' }
        );
        break;
      case 'CONNERS':
        inputSection = renderConnersInputs(rawScores.desatencao !== undefined ? rawScores : calculatedScores);
        calculationsSection = renderTScoreCalculations(
          rawScores.desatencao !== undefined ? rawScores : calculatedScores,
          ['desatencao', 'hiperatividade', 'indiceTDAH'],
          { desatencao: 'Desatenção', hiperatividade: 'Hiperatividade', indiceTDAH: 'Índice TDAH' }
        );
        break;
      case 'CBCL':
        inputSection = renderCBCLInputs(rawScores.internalizacao !== undefined ? rawScores : calculatedScores);
        calculationsSection = renderTScoreCalculations(
          rawScores.internalizacao !== undefined ? rawScores : calculatedScores,
          ['internalizacao', 'externalizacao', 'totalProblemas'],
          { internalizacao: 'Internalização', externalizacao: 'Externalização', totalProblemas: 'Total Problemas' }
        );
        break;
      case 'BRIEF2':
        inputSection = renderBRIEF2Inputs(rawScores, calculatedScores);
        calculationsSection = renderTScoreCalculations(
          calculatedScores,
          ['gec', 'bri', 'eri', 'cri'],
          { gec: 'Índice Global (GEC)', bri: 'Reg. Comportamental', eri: 'Reg. Emocional', cri: 'Reg. Cognitiva' }
        );
        break;
      // Screening tests
      case 'SNAPIV':
      case 'MCHAT':
      case 'MOCA':
      case 'MEEM':
      case 'GDS':
      case 'ACE3':
      case 'SDQ':
        inputSection = renderScreeningInputs(rawScores, calculatedScores, testCode);
        calculationsSection = renderScreeningCalculations(calculatedScores, testCode);
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

    lines.push('DADOS DE ENTRADA:');

    // Adicionar dados específicos por teste
    if (testCode === 'RAVLT') {
      lines.push(`- Tentativas: A1=${rawScores.a1}, A2=${rawScores.a2}, A3=${rawScores.a3}, A4=${rawScores.a4}, A5=${rawScores.a5}`);
      lines.push(`- Lista B: B1=${rawScores.b1}`);
      lines.push(`- Evocações: A6=${rawScores.a6}, A7=${rawScores.a7}`);
      lines.push(`- Reconhecimento (bruto): ${rawScores.rec}`);
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push(`- Escore Total: ${rawScores.a1}+${rawScores.a2}+${rawScores.a3}+${rawScores.a4}+${rawScores.a5} = ${calculatedScores.escoreTotal}`);
      lines.push(`- Reconhecimento: ${rawScores.rec}-35 = ${calculatedScores.reconhecimento}`);
      lines.push(`- ALT: ${calculatedScores.escoreTotal}-(5×${rawScores.a1}) = ${calculatedScores.alt}`);
      lines.push(`- Vel. Esquecimento: ${rawScores.a7}/${rawScores.a6} = ${(calculatedScores.velocidadeEsquecimento ?? 0).toFixed(2)}`);
      lines.push(`- Int. Proativa: ${rawScores.b1}/${rawScores.a1} = ${(calculatedScores.interferenciaProativa ?? 0).toFixed(2)}`);
      lines.push(`- Int. Retroativa: ${rawScores.a6}/${rawScores.a5} = ${(calculatedScores.interferenciaRetroativa ?? 0).toFixed(2)}`);
    } else if (testCode === 'FDT') {
      lines.push(`- Leitura: ${rawScores.leitura}s | Contagem: ${rawScores.contagem}s | Escolha: ${rawScores.escolha}s | Alternância: ${rawScores.alternancia}s`);
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push(`- Inibição: ${rawScores.escolha} - ${rawScores.leitura} = ${(calculatedScores.inibicao ?? 0).toFixed(1)}`);
      lines.push(`- Flexibilidade: ${rawScores.alternancia} - ${rawScores.leitura} = ${(calculatedScores.flexibilidade ?? 0).toFixed(1)}`);
    } else if (testCode === 'BPA2') {
      ['AC', 'AD', 'AA'].forEach(sub => {
        lines.push(`- ${sub}: A=${rawScores[`${sub}_acertos`]}, E=${rawScores[`${sub}_erros`]}, O=${rawScores[`${sub}_omissoes`]} → Score: ${calculatedScores[sub]}`);
      });
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push(`- AG = ${calculatedScores.AC} + ${calculatedScores.AD} + ${calculatedScores.AA} = ${calculatedScores.AG}`);
    } else {
      // Generic: list all raw scores and calculated scores
      if (Object.keys(rawScores).length > 0) {
        Object.entries(rawScores).forEach(([key, val]) => {
          lines.push(`- ${key}: ${val}`);
        });
      } else {
        Object.entries(calculatedScores).forEach(([key, val]) => {
          const name = config.names[key] || key;
          lines.push(`- ${name}: ${val}`);
        });
      }
    }

    // Add percentile calculations for EP/T-score tests
    if (EP_TESTS.includes(testCode) || TSCORE_TESTS.includes(testCode)) {
      lines.push('');
      lines.push('CÁLCULOS DE PERCENTIL:');
      const scores = Object.keys(rawScores).length > 0 ? rawScores : calculatedScores;
      config.subtests.forEach(code => {
        if (config.useRawScores?.includes(code)) return;
        const val = scores[code] ?? calculatedScores[code];
        if (val !== undefined && !isNaN(Number(val))) {
          const type = TSCORE_TESTS.includes(testCode) ? 'tscore' : 'ep';
          lines.push(`- ${config.names[code]}: ${getPercentileFormula(type as 'ep' | 'tscore', Number(val))}`);
        }
      });
    }

    if (SCREENING_TESTS.includes(testCode)) {
      lines.push('');
      lines.push('NOTA: Teste de rastreamento — utiliza pontos de corte, não percentil normativo.');
    }

    lines.push('');
    lines.push('RESULTADOS:');
    lines.push('-------------------------------------------');
    lines.push('Variável                | Bruto | Percentil | Classificação');
    lines.push('-------------------------------------------');

    config.subtests.forEach(code => {
      const name = config.names[code] || code;
      const score = getScoreValue(code);
      const percentile = getPercentileValue(code);
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
        {renderInputAndCalculations()}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variável</TableHead>
              <TableHead className="text-center">Bruto</TableHead>
              <TableHead className="text-center">Percentil • Classificação</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.subtests.map(code => {
              const score = getScoreValue(code);
              const percentile = getPercentileValue(code);
              const classification = results.classifications[code] ?? '-';
              const isMain = code === config.mainSubtest;
              const isScreening = SCREENING_TESTS.includes(testCode);

              const copyRowToClipboard = () => {
                const text = `${testName} - ${config.names[code] || code}: Bruto ${score}, Percentil ${percentile}, Classificação ${classification}`;
                navigator.clipboard.writeText(text);
                toast({
                  title: "Linha copiada!",
                  description: config.names[code] || code
                });
              };
              
              return (
                <TableRow key={code} className={`${isMain ? 'bg-primary/5 font-medium' : ''} group`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isMain && <Brain className="h-4 w-4 text-primary" />}
                      <span>{config.names[code] || code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">{score}</TableCell>
                  <TableCell className="text-center">
                    {(String(percentile) !== '-' || classification !== '-') ? (
                      (() => {
                        const isEP = EP_TESTS.includes(testCode);
                        const isT = TSCORE_TESTS.includes(testCode);
                        let prefix = 'P';
                        if (isEP && !config.useRawScores?.includes(code)) prefix = 'EP ';
                        if (isT) prefix = 'T ';
                        if (isScreening) prefix = '';

                        const percentileDisplay = isScreening 
                          ? '' 
                          : (String(percentile) !== '-' && String(percentile) !== 'N/A' ? `${prefix}${percentile}` : '');
                        
                        return (
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant={getClassificationVariant(String(classification))} className="text-[10px]">
                              {percentileDisplay}{percentileDisplay && classification !== '-' ? ' • ' : ''}{classification !== '-' ? classification : ''}
                            </Badge>
                            {isScreening && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Teste de rastreamento — não utiliza percentil normativo</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={copyRowToClipboard}
                      title="Copiar linha"
                    >
                      <ClipboardCopy className="h-3.5 w-3.5" />
                    </Button>
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

function getClassificationVariant(classification: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (classification.includes('Inferior') || classification === 'Prejuízo' || classification === 'Interferência' || classification === 'Declínio') return 'destructive';
  if (classification.includes('Superior') || classification === 'Curva +' || classification === 'Adequado' || classification === 'Sem interferência') return 'default';
  if (classification.includes('Muito Alta') || classification.includes('Alta')) return 'default';
  if (classification.includes('Muito Baixa') || classification.includes('Baixa')) return 'destructive';
  if (classification.includes('Clínico') || classification.includes('Atípico') || classification === 'Anormal') return 'destructive';
  if (classification.includes('Limítrofe') || classification === 'Plana') return 'warning';
  if (classification === 'Normal' || classification === 'Adequado') return 'default';
  return 'secondary';
}
