import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Calendar, ChevronDown, ClipboardCopy, Calculator, FileInput, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';
import NeuroScoreCalculator from './NeuroScoreCalculator';

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

interface PatientNeuroTestHistoryProps {
  clientId: string;
  clientName: string;
  clientBirthDate?: string;
}

interface TestConfig {
  subtests: string[];
  names: Record<string, string>;
  mainSubtest: string;
  useRawScores?: string[];
}

// Configuração de subtestes por tipo de teste (deve corresponder às chaves salvas no banco)
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
        subtests: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7', 'escoreTotal', 'reconhecimento', 'alt', 'velocidadeEsquecimento', 'interferenciaProativa', 'interferenciaRetroativa'],
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
          reconhecimento: 'Reconhecimento',
          alt: 'ALT (Aprendizagem)',
          velocidadeEsquecimento: 'Vel. Esquecimento',
          interferenciaProativa: 'Int. Proativa',
          interferenciaRetroativa: 'Int. Retroativa'
        },
        mainSubtest: 'escoreTotal',
        useRawScores: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7']
      };
    case 'FDT':
      return {
        subtests: [
          'leitura', 'contagem', 'escolha', 'alternancia',
          'errosLeitura', 'errosContagem', 'errosEscolha', 'errosAlternancia',
          'inibicao', 'flexibilidade'
        ],
        names: {
          leitura: 'Tempo - Leitura',
          contagem: 'Tempo - Contagem',
          escolha: 'Tempo - Escolha',
          alternancia: 'Tempo - Alternância',
          errosLeitura: 'Erros - Leitura',
          errosContagem: 'Erros - Contagem',
          errosEscolha: 'Erros - Escolha',
          errosAlternancia: 'Erros - Alternância',
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
    case 'PCFO':
      return {
        subtests: ['escorePadrao'],
        names: {
          escorePadrao: 'Escore Padrão'
        },
        mainSubtest: 'escorePadrao'
      };
    case 'TSBC':
      return {
        subtests: ['escorePadraoOD', 'escorePadraoOI'],
        names: {
          escorePadraoOD: 'Ordem Direta (EP)',
          escorePadraoOI: 'Ordem Inversa (EP)'
        },
        mainSubtest: 'escorePadraoOD'
      };
    case 'FVA':
      return {
        subtests: ['percentilAnimais', 'percentilFrutas', 'percentilPares'],
        names: {
          percentilAnimais: 'Animais',
          percentilFrutas: 'Frutas',
          percentilPares: 'Pares (Alternada)'
        },
        mainSubtest: 'percentilAnimais'
      };
    case 'BNTBR':
      return {
        subtests: ['percentil'],
        names: {
          percentil: 'Nomeação'
        },
        mainSubtest: 'percentil'
      };
    case 'TRILHAS':
      return {
        subtests: ['trilhaA', 'trilhaB'],
        names: {
          trilhaA: 'Trilha A (EP)',
          trilhaB: 'Trilha B (EP)'
        },
        mainSubtest: 'trilhaA'
      };
    case 'TRILHAS_PRE_ESCOLAR':
      return {
        subtests: ['trilhaA', 'trilhaB'],
        names: {
          trilhaA: 'Trilha A (EP)',
          trilhaB: 'Trilha B (EP)'
        },
        mainSubtest: 'trilhaA'
      };
    case 'TMT_ADULTO':
      return {
        subtests: ['tempoA', 'tempoB', 'tempoBA'],
        names: {
          tempoA: 'TMT-A (Tempo)',
          tempoB: 'TMT-B (Tempo)',
          tempoBA: 'TMT B-A (Diferença)'
        },
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
        names: {
          tempoA: 'Parte A (Tempo)',
          tempoB: 'Parte B (Tempo)',
          errosB: 'Parte B (Erros)',
          'inibiçãoBA': 'Inibição (B-A)'
        },
        mainSubtest: 'inibiçãoBA'
      };
    case 'HAYLING_INFANTIL':
      return {
        subtests: ['parteATempo', 'parteBTempo', 'parteBErros', 'inibicaoBA'],
        names: {
          parteATempo: 'Parte A (Tempo)',
          parteBTempo: 'Parte B (Tempo)',
          parteBErros: 'Parte B (Erros)',
          inibicaoBA: 'Inibição (B-A)'
        },
        mainSubtest: 'inibicaoBA'
      };
    case 'TFV':
      return {
        subtests: ['fluenciaLivre', 'fluenciaFonemica', 'fluenciaSemantica'],
        names: {
          fluenciaLivre: 'Fluência Livre',
          fluenciaFonemica: 'Fluência Fonêmica',
          fluenciaSemantica: 'Fluência Semântica'
        },
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
        names: {
          copia: 'Cópia',
          reproducaoMemoria: 'Memória'
        },
        mainSubtest: 'copia'
      };
    case 'TRPP':
      return {
        subtests: ['total'],
        names: { total: 'Total (EP)' },
        mainSubtest: 'total'
      };
    case 'FPT_INFANTIL':
      return {
        subtests: ['desenhosUnicos'],
        names: {
          desenhosUnicos: 'Desenhos Únicos'
        },
        mainSubtest: 'desenhosUnicos'
      };
    case 'FPT_ADULTO':
      return {
        subtests: ['desenhosUnicos'],
        names: {
          desenhosUnicos: 'Desenhos Únicos'
        },
        mainSubtest: 'desenhosUnicos'
      };
    default:
      return null;
  }
};

// Obtém o escore correto (raw ou calculated) para cada subteste
const getScoreValue = (
  test: NeuroTestResult,
  subtestCode: string,
  config: TestConfig
): number | string => {
  const rawScores = test.raw_scores as Record<string, number>;
  const calculatedScores = test.calculated_scores as Record<string, number>;
  
  if (config.useRawScores?.includes(subtestCode)) {
    return rawScores[subtestCode] ?? '-';
  }
  
  return calculatedScores[subtestCode] ?? '-';
};

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
  <div className="space-y-3">
    <div>
      <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">Tempos (segundos)</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['leitura', 'contagem', 'escolha', 'alternancia'].map(key => {
          const labels: Record<string, string> = { leitura: 'Leitura', contagem: 'Contagem', escolha: 'Escolha', alternancia: 'Alternância' };
          return (
            <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
              <p className="text-xs font-medium text-muted-foreground mb-1">{labels[key]}</p>
              <Badge variant="outline" className="font-mono text-lg">{rawScores[key] ?? '-'}s</Badge>
            </div>
          );
        })}
      </div>
    </div>
    <div>
      <p className="text-xs font-semibold text-destructive mb-2 uppercase tracking-wide">Erros</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['errosLeitura', 'errosContagem', 'errosEscolha', 'errosAlternancia'].map(key => {
          const labels: Record<string, string> = { errosLeitura: 'Leitura', errosContagem: 'Contagem', errosEscolha: 'Escolha', errosAlternancia: 'Alternância' };
          return (
            <div key={key} className="p-3 bg-muted/30 rounded-lg border text-center">
              <p className="text-xs font-medium text-muted-foreground mb-1">{labels[key]}</p>
              <Badge variant="outline" className="font-mono text-lg">{rawScores[key] ?? '-'}</Badge>
            </div>
          );
        })}
      </div>
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

const renderTINCalculations = (calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Escore Padrão = Consulta tabela normativa por idade</span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Escore Padrão</span>
      <span className="font-mono"><strong>{calc.escorePadrao ?? '-'}</strong> (M=100, DP=15)</span>
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

const renderPCFOCalculations = (calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">EP = Consulta tabela normativa por idade e escolaridade</span>
    </div>
    <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
      <span className="font-medium">Escore Padrão</span>
      <span className="font-mono"><strong>{calc.escorePadrao ?? '-'}</strong> (M=100, DP=15)</span>
    </div>
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

const renderTSBCCalculations = (calc: Record<string, number>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">EP = Consulta tabela normativa por idade e tipo de escola</span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">EP Ordem Direta</span>
        <span className="font-mono"><strong>{calc.escorePadraoOD ?? '-'}</strong></span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg flex justify-between items-center">
        <span className="font-medium">EP Ordem Inversa</span>
        <span className="font-mono"><strong>{calc.escorePadraoOI ?? '-'}</strong></span>
      </div>
    </div>
  </div>
);

const renderFVAInputs = (rawScores: Record<string, number>) => (
  <div className="grid grid-cols-3 gap-3">
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Animais</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.animais ?? '-'}</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Frutas</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.frutas ?? '-'}</Badge>
    </div>
    <div className="p-3 bg-muted/30 rounded-lg border text-center">
      <p className="text-xs font-medium text-muted-foreground mb-1">Pares</p>
      <Badge variant="outline" className="font-mono text-lg">{rawScores.pares ?? '-'}</Badge>
    </div>
  </div>
);

const renderFVACalculations = (calc: Record<string, string>) => (
  <div className="space-y-2 text-sm">
    <div className="p-2 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground">Fórmula: </span>
      <span className="font-mono">Percentil = Consulta tabela normativa por idade</span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="p-2 bg-primary/10 rounded-lg text-center">
        <span className="font-medium block mb-1">Animais</span>
        <span className="font-mono text-sm">{calc.percentilAnimais ?? '-'}</span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg text-center">
        <span className="font-medium block mb-1">Frutas</span>
        <span className="font-mono text-sm">{calc.percentilFrutas ?? '-'}</span>
      </div>
      <div className="p-2 bg-primary/10 rounded-lg text-center">
        <span className="font-medium block mb-1">Pares</span>
        <span className="font-mono text-sm">{calc.percentilPares ?? '-'}</span>
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

// Renderiza dados genéricos de entrada com label/valor
const renderGenericInputs = (rawScores: Record<string, number>) => {
  const entries = Object.entries(rawScores).filter(([_, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, val]) => (
        <Badge key={key} variant="outline" className="font-mono">
          {key}: {typeof val === 'number' ? val : String(val)}
        </Badge>
      ))}
    </div>
  );
};

export default function PatientNeuroTestHistory({
  clientId,
  clientName,
  clientBirthDate
}: PatientNeuroTestHistoryProps) {
  const { toast } = useToast();
  const [tests, setTests] = useState<NeuroTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [applierNames, setApplierNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTests();
  }, [clientId]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('neuro_test_results')
        .select('*')
        .eq('client_id', clientId)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      setTests(data || []);

      const applierIds = [...new Set((data || []).map(t => t.applied_by).filter(Boolean))];
      if (applierIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', applierIds);

        const names: Record<string, string> = {};
        profiles?.forEach(p => {
          names[p.user_id] = p.name || 'Desconhecido';
        });
        setApplierNames(names);
      }
    } catch (error) {
      console.error('Erro ao buscar testes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (test: NeuroTestResult) => {
    const config = getTestConfig(test.test_code);
    const percentiles = test.percentiles as Record<string, number | string>;
    const classifications = test.classifications as Record<string, string>;
    const calculatedScores = test.calculated_scores as Record<string, number>;
    const rawScores = test.raw_scores as Record<string, number>;

    // Gera subtests dinamicamente se não tem config
    const subtestKeys = config ? config.subtests : Object.keys(percentiles);
    const subtestNames = config ? config.names : Object.fromEntries(Object.keys(percentiles).map(k => [k, k]));


    const lines = [
      '================================================================================',
      `TESTE: ${test.test_name}`,
      `Paciente: ${clientName} (${test.patient_age} anos)`,
      `Data: ${new Date(test.applied_at).toLocaleDateString('pt-BR')}`,
      test.applied_by ? `Aplicador: ${applierNames[test.applied_by] || 'Desconhecido'}` : '',
      '================================================================================',
      ''
    ];

    // Adicionar dados de entrada específicos por teste
    lines.push('DADOS DE ENTRADA:');
    if (test.test_code === 'RAVLT') {
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
    } else if (test.test_code === 'FDT') {
      lines.push('TEMPOS:');
      lines.push(`- Leitura: ${rawScores.leitura}s | P${percentiles.leitura ?? '-'} • ${classifications.leitura ?? '-'}`);
      lines.push(`- Contagem: ${rawScores.contagem}s | P${percentiles.contagem ?? '-'} • ${classifications.contagem ?? '-'}`);
      lines.push(`- Escolha: ${rawScores.escolha}s | P${percentiles.escolha ?? '-'} • ${classifications.escolha ?? '-'}`);
      lines.push(`- Alternância: ${rawScores.alternancia}s | P${percentiles.alternancia ?? '-'} • ${classifications.alternancia ?? '-'}`);
      lines.push('');
      lines.push('ERROS:');
      lines.push(`- Leitura: ${rawScores.errosLeitura ?? 0} | P${percentiles.errosLeitura ?? '-'} • ${classifications.errosLeitura ?? '-'}`);
      lines.push(`- Contagem: ${rawScores.errosContagem ?? 0} | P${percentiles.errosContagem ?? '-'} • ${classifications.errosContagem ?? '-'}`);
      lines.push(`- Escolha: ${rawScores.errosEscolha ?? 0} | P${percentiles.errosEscolha ?? '-'} • ${classifications.errosEscolha ?? '-'}`);
      lines.push(`- Alternância: ${rawScores.errosAlternancia ?? 0} | P${percentiles.errosAlternancia ?? '-'} • ${classifications.errosAlternancia ?? '-'}`);
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push(`- Inibição: ${rawScores.escolha} - ${rawScores.leitura} = ${(calculatedScores.inibicao ?? 0).toFixed(1)} | P${percentiles.inibicao ?? '-'} • ${classifications.inibicao ?? '-'}`);
      lines.push(`- Flexibilidade: ${rawScores.alternancia} - ${rawScores.leitura} = ${(calculatedScores.flexibilidade ?? 0).toFixed(1)} | P${percentiles.flexibilidade ?? '-'} • ${classifications.flexibilidade ?? '-'}`);
    } else if (test.test_code === 'BPA2') {
      ['AC', 'AD', 'AA'].forEach(sub => {
        lines.push(`- ${sub}: Acertos=${rawScores[`${sub}_acertos`]}, Erros=${rawScores[`${sub}_erros`]}, Omissões=${rawScores[`${sub}_omissoes`]} → Score: ${calculatedScores[sub]}`);
      });
      lines.push('');
      lines.push('CÁLCULOS:');
      lines.push('- Fórmula: Score = Acertos - Erros - Omissões');
      lines.push(`- AG = ${calculatedScores.AC} + ${calculatedScores.AD} + ${calculatedScores.AA} = ${calculatedScores.AG}`);
    } else {
      // Genérico: lista todos os raw_scores
      Object.entries(rawScores).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          lines.push(`- ${key}: ${val}`);
        }
      });
    }

    lines.push('');
    lines.push('RESULTADOS:');
    lines.push('-------------------------------------------');
    lines.push('Variável                | Bruto | Percentil | Classificação');
    lines.push('-------------------------------------------');

    subtestKeys.forEach(code => {
      const name = subtestNames[code] || code;
      const score = config 
        ? getScoreValue(test, code, config)
        : (calculatedScores[code] ?? rawScores[code] ?? '-');
      const percentile = percentiles[code] ?? '-';
      const classification = classifications[code] ?? '-';
      
      lines.push(
        `${name.padEnd(23)} | ${String(score).padStart(5)} | ${String(percentile).padStart(9)} | ${classification}`
      );
    });

    lines.push('-------------------------------------------');

    if (test.notes) {
      lines.push('');
      lines.push('OBSERVAÇÕES:');
      lines.push(test.notes);
    }

    lines.push('');
    lines.push('================================================================================');

    navigator.clipboard.writeText(lines.filter(l => l !== undefined && l !== '').join('\n'));
    toast({
      title: "Copiado!",
      description: "Resultado completo do teste copiado para a área de transferência."
    });
  };

  // Testes que usam Escore Padrão (EP) ao invés de Percentil (P)
  const EP_TESTS = ['TIN', 'PCFO', 'TSBC', 'TRILHAS', 'TRILHAS_PRE_ESCOLAR', 'TRPP'];
  
  // Nota: Os escores calculados do RAVLT (ALT, VE, IP, IR) agora possuem tabelas normativas com percentis

  // Helper to get display percentile (range string if available, otherwise numeric)
  const getDisplayPercentile = (test: NeuroTestResult, code: string): string => {
    const percentiles = test.percentiles as Record<string, number | string>;
    const val = percentiles[code];
    if (val === undefined || val === null) return '-';
    return String(val);
  };
  
  // Helper to get the correct prefix for display
  const getPercentilePrefix = (testCode: string, subtestCode: string): string => {
    if (EP_TESTS.includes(testCode)) return 'EP ';
    return 'P';
  };

  const getMainSubtestBadge = (test: NeuroTestResult) => {
    const config = getTestConfig(test.test_code);
    const percentiles = test.percentiles as Record<string, number | string>;
    const classifications = test.classifications as Record<string, string>;
    const calculatedScores = test.calculated_scores as Record<string, number>;

    if (config) {
      const mainCode = config.mainSubtest;
      const mainPercentile = getDisplayPercentile(test, mainCode);
      const mainClassification = classifications[mainCode] || '-';

      const prefix = getPercentilePrefix(test.test_code, mainCode);
      if (mainPercentile !== '-' && mainClassification !== '-') {
        return (
          <Badge variant={getClassificationVariant(mainClassification)}>
            {prefix}{mainPercentile} • {mainClassification}
          </Badge>
        );
      }
      if (mainClassification !== '-') {
        return (
          <Badge variant={getClassificationVariant(mainClassification)}>
            {mainClassification}
          </Badge>
        );
      }
      const mainScore = calculatedScores[mainCode] ?? '-';
      return (
        <Badge variant="secondary">
          {config.names[mainCode]}: {mainScore}
        </Badge>
      );
    }

    // Fallback genérico
    const firstKey = Object.keys(classifications)[0] || Object.keys(percentiles)[0];
    if (!firstKey) return null;

    const classification = classifications[firstKey] || 'Médio';
    const percentile = percentiles[firstKey];

    return (
      <Badge variant={getClassificationVariant(classification)}>
        {percentile !== undefined ? `P${percentile} • ` : ''}{classification}
      </Badge>
    );  
  };

  // Renderiza seções de entrada e cálculos com base no tipo de teste
  const renderInputAndCalculations = (test: NeuroTestResult) => {
    const rawScores = test.raw_scores as Record<string, number>;
    const calculatedScores = test.calculated_scores as Record<string, number>;

    let inputSection = null;
    let calculationsSection = null;

    switch (test.test_code) {
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
      case 'PCFO':
        inputSection = renderPCFOInputs(rawScores);
        calculationsSection = renderPCFOCalculations(calculatedScores);
        break;
      case 'TSBC':
        inputSection = renderTSBCInputs(rawScores);
        calculationsSection = renderTSBCCalculations(calculatedScores);
        break;
      case 'FVA':
        inputSection = renderFVAInputs(rawScores);
        calculationsSection = renderFVACalculations(calculatedScores as unknown as Record<string, string>);
        break;
      case 'BNTBR':
        inputSection = renderBNTBRInputs(rawScores);
        calculationsSection = renderBNTBRCalculations(calculatedScores);
        break;
      default: {
        inputSection = renderGenericInputs(rawScores);
        break;
      }
    }

    return (
      <div className="space-y-3">
        {inputSection && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full">
              <FileInput className="h-4 w-4" />
              Dados de Entrada
              <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
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
              <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {calculationsSection}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Brain className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Nenhum teste neuropsicológico registrado para este paciente.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular idade do paciente
  const calculateAge = (birthDate?: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const clientAge = calculateAge(clientBirthDate);

  return (
    <div className="space-y-6">
      {/* Calculadora de Scores */}
      <NeuroScoreCalculator 
        clientId={clientId} 
        clientAge={clientAge} 
        onSaved={fetchTests}
      />
      
      {/* Histórico de Testes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Histórico de Testes Neuropsicológicos
            <Badge variant="secondary" className="ml-auto">{tests.length} teste(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {tests.map((test) => {
            const config = getTestConfig(test.test_code);
            const percentiles = test.percentiles as Record<string, number>;
            const classifications = test.classifications as Record<string, string>;
            const calculatedScores = test.calculated_scores as Record<string, number>;
            const rawScores = test.raw_scores as Record<string, number>;

            // Se não tem config específica, gera automaticamente a partir dos percentiles
            const subtestKeys = config ? config.subtests : Object.keys(percentiles);
            const subtestNames = config ? config.names : Object.fromEntries(Object.keys(percentiles).map(k => [k, k]));
            
            
            return (
              <AccordionItem key={test.id} value={test.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex flex-col">
                      <span className="font-medium">{test.test_name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(test.applied_at).toLocaleDateString('pt-BR')}
                        <span>•</span>
                        {test.patient_age} anos
                      </span>
                    </div>
                    {getMainSubtestBadge(test)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Seções de entrada e cálculos (apenas para testes com config) */}
                    {config && renderInputAndCalculations(test)}

                    {/* Tabela de resultados */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full">
                        <Brain className="h-4 w-4" />
                        Resultados (Percentis e Classificações)
                        <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
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
                            {subtestKeys.map(code => {
                              const score = config 
                                ? getScoreValue(test, code, config)
                                : (calculatedScores[code] ?? rawScores[code] ?? '-');
                              const percentile = getDisplayPercentile(test, code);
                              const classification = classifications[code] ?? '-';
                              const isMain = config ? code === config.mainSubtest : false;

                              const copyRowToClipboard = () => {
                                const displayName = subtestNames[code] || code;
                                const text = `${test.test_name} - ${displayName}: Bruto ${score}, Percentil ${percentile}, Classificação ${classification}`;
                                navigator.clipboard.writeText(text);
                                toast({
                                  title: "Linha copiada!",
                                  description: displayName
                                });
                              };

                              return (
                                <TableRow key={code} className={`${isMain ? 'bg-primary/5 font-medium' : ''} group`}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {isMain && <Brain className="h-4 w-4 text-primary" />}
                                      <span>{subtestNames[code] || code}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center font-mono">{score}</TableCell>
                                  <TableCell className="text-center">
                                    {(percentile !== '-' || classification !== '-') ? (
                                      (() => {
                                        const prefix = getPercentilePrefix(test.test_code, code);
                                        return (
                                          <Badge variant={getClassificationVariant(String(classification))} className="text-[10px]">
                                            {percentile !== '-' ? `${prefix}${percentile}` : ''}{percentile !== '-' && classification !== '-' ? ' • ' : ''}{classification !== '-' ? classification : ''}
                                          </Badge>
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
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Aplicador e observações */}
                    <div className="flex flex-col gap-2 text-sm">
                      {test.applied_by && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Aplicado por: {applierNames[test.applied_by] || 'Desconhecido'}</span>
                        </div>
                      )}
                      {test.notes && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium mb-1">Observações:</p>
                          <p className="text-muted-foreground">{test.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Botão copiar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(test)}
                      className="w-full"
                    >
                      <ClipboardCopy className="h-4 w-4 mr-2" />
                      Copiar para Laudo
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
    </div>
  );
}

function getClassificationVariant(classification: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  if (classification.includes('Inferior') || classification === 'Prejuízo' || classification === 'Interferência' || classification === 'Declínio') return 'destructive';
  if (classification.includes('Superior') || classification === 'Curva +' || classification === 'Adequado' || classification === 'Sem interferência') return 'default';
  if (classification.includes('Muito Alta') || classification.includes('Alta')) return 'default';
  if (classification.includes('Muito Baixa') || classification.includes('Baixa')) return 'destructive';
  if (classification === 'Plana') return 'warning';
  return 'secondary';
}
