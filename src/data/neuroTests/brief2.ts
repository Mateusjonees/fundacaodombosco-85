/**
 * BRIEF-2 - Behavior Rating Inventory of Executive Function
 * Inventário de funções executivas (questionário pais/professores)
 * Faixa etária: 5-18 anos
 * Referência: Gioia et al. (2015) - Adaptação brasileira
 */

import type { NeuroTestDefinition } from './bpa2';

export interface BRIEF2Results {
  rawScores: Record<string, number>;
  classifications: Record<string, string>;
  indices: { bri: number; eri: number; cri: number; gec: number };
  notes: string;
}

export const BRIEF2_TEST: NeuroTestDefinition = {
  code: 'BRIEF2',
  name: 'BRIEF-2',
  fullName: 'BRIEF-2 - Inventário de Funções Executivas',
  description: 'Avalia funções executivas no cotidiano via questionário para pais/professores. Escores T (M=50, DP=10).',
  minAge: 5,
  maxAge: 18,
  subtests: [
    { code: 'INI', name: 'Inibição', fields: ['inibicao'], formula: 'Escore T' },
    { code: 'ACD', name: 'Autocontrole', fields: ['autocontrole'], formula: 'Escore T' },
    { code: 'FLX', name: 'Flexibilidade', fields: ['flexibilidade'], formula: 'Escore T' },
    { code: 'REM', name: 'Regulação Emocional', fields: ['regulacaoEmocional'], formula: 'Escore T' },
    { code: 'INI2', name: 'Iniciativa', fields: ['iniciativa'], formula: 'Escore T' },
    { code: 'MT', name: 'Memória de Trabalho', fields: ['memoriaTrabalho'], formula: 'Escore T' },
    { code: 'PLO', name: 'Planejamento/Organização', fields: ['planejamento'], formula: 'Escore T' },
    { code: 'MON', name: 'Monitoramento', fields: ['monitoramento'], formula: 'Escore T' }
  ],
  calculatedScores: [
    { code: 'BRI', name: 'Índice Regulação Comportamental', formula: 'Inibição + Autocontrole' },
    { code: 'ERI', name: 'Índice Regulação Emocional', formula: 'Flexibilidade + Regulação Emocional' },
    { code: 'CRI', name: 'Índice Regulação Cognitiva', formula: 'Iniciativa + MT + Planejamento + Monitoramento' },
    { code: 'GEC', name: 'Índice Executivo Global', formula: 'Composto geral' }
  ]
};

// Classificação por Escore T (M=50, DP=10)
export const getBRIEF2Classification = (tScore: number): string => {
  if (tScore < 60) return 'Normal';
  if (tScore < 65) return 'Levemente Elevado';
  if (tScore < 70) return 'Potencialmente Clínico';
  return 'Clinicamente Significativo';
};

export const calculateBRIEF2Results = (scores: {
  inibicao: number;
  autocontrole: number;
  flexibilidade: number;
  regulacaoEmocional: number;
  iniciativa: number;
  memoriaTrabalho: number;
  planejamento: number;
  monitoramento: number;
  bri: number;
  eri: number;
  cri: number;
  gec: number;
}): BRIEF2Results => {
  const rawScores: Record<string, number> = {
    inibicao: scores.inibicao,
    autocontrole: scores.autocontrole,
    flexibilidade: scores.flexibilidade,
    regulacaoEmocional: scores.regulacaoEmocional,
    iniciativa: scores.iniciativa,
    memoriaTrabalho: scores.memoriaTrabalho,
    planejamento: scores.planejamento,
    monitoramento: scores.monitoramento
  };

  const classifications: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawScores)) {
    classifications[key] = getBRIEF2Classification(value);
  }
  classifications.bri = getBRIEF2Classification(scores.bri);
  classifications.eri = getBRIEF2Classification(scores.eri);
  classifications.cri = getBRIEF2Classification(scores.cri);
  classifications.gec = getBRIEF2Classification(scores.gec);

  return {
    rawScores,
    classifications,
    indices: { bri: scores.bri, eri: scores.eri, cri: scores.cri, gec: scores.gec },
    notes: `GEC (T=${scores.gec}): ${classifications.gec} | BRI (T=${scores.bri}): ${classifications.bri} | ERI (T=${scores.eri}): ${classifications.eri} | CRI (T=${scores.cri}): ${classifications.cri}`
  };
};
