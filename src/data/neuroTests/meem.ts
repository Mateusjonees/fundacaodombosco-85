/**
 * MEEM - Mini Exame do Estado Mental
 * Rastreamento de demência
 * Faixa etária: 18-90 anos
 * Referência: Folstein et al. (1975) - Adaptação brasileira Brucki et al. (2003)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface MEEMResults {
  rawScores: { totalScore: number; educationYears: number };
  classifications: { totalScore: string };
  severity: string;
  cutoffScore: number;
  notes: string;
}

export const MEEM_TEST: NeuroTestDefinition = {
  code: 'MEEM',
  name: 'MEEM (Mini Mental)',
  fullName: 'Mini Exame do Estado Mental',
  description: 'Rastreamento de demência. Domínios: orientação, memória, atenção/cálculo, evocação, linguagem.',
  minAge: 18,
  maxAge: 90,
  subtests: [
    { code: 'TOTAL', name: 'Escore Total', fields: ['total'], formula: 'Soma dos itens (0-30)' }
  ],
  calculatedScores: [
    { code: 'CLASS', name: 'Classificação', formula: 'Ponto de corte por escolaridade (Brucki et al., 2003)' }
  ]
};

// Pontos de corte por escolaridade (Brucki et al., 2003)
export const getMEEMCutoff = (educationYears: number): number => {
  if (educationYears === 0) return 20;
  if (educationYears <= 4) return 25;
  if (educationYears <= 8) return 26;
  if (educationYears <= 11) return 28;
  return 29; // 12+ anos
};

export const getMEEMClassification = (totalScore: number, educationYears: number): string => {
  const cutoff = getMEEMCutoff(educationYears);
  if (totalScore >= cutoff) return 'Normal';
  if (totalScore >= cutoff - 3) return 'Possível Comprometimento';
  return 'Comprometimento Cognitivo';
};

export const calculateMEEMResults = (totalScore: number, educationYears: number): MEEMResults => {
  const cutoff = getMEEMCutoff(educationYears);
  const classification = getMEEMClassification(totalScore, educationYears);
  return {
    rawScores: { totalScore, educationYears },
    classifications: { totalScore: classification },
    severity: classification,
    cutoffScore: cutoff,
    notes: `Escore: ${totalScore}/30 | Escolaridade: ${educationYears} anos | Ponto de corte: ${cutoff} | ${classification}`
  };
};
