/**
 * MoCA - Montreal Cognitive Assessment
 * Rastreamento de declínio cognitivo leve
 * Faixa etária: 18-90 anos
 * Referência: Nasreddine et al. (2005) - Adaptação brasileira Memória et al. (2013)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface MoCAResults {
  rawScores: { totalScore: number; educationYears: number };
  calculatedScores: { adjustedScore: number };
  classifications: { totalScore: string };
  severity: string;
  notes: string;
}

export const MOCA_TEST: NeuroTestDefinition = {
  code: 'MOCA',
  name: 'MoCA',
  fullName: 'Montreal Cognitive Assessment',
  description: 'Rastreamento de declínio cognitivo leve. Domínios: visuoespacial, nomeação, memória, atenção, linguagem, abstração, orientação.',
  minAge: 18,
  maxAge: 90,
  subtests: [
    { code: 'TOTAL', name: 'Escore Total', fields: ['total'], formula: 'Soma dos domínios (0-30)' }
  ],
  calculatedScores: [
    { code: 'ADJ', name: 'Escore Ajustado', formula: '+1 ponto se escolaridade ≤ 12 anos' }
  ]
};

// Pontos de corte ajustados para população brasileira
export const getMoCAClassification = (adjustedScore: number): string => {
  if (adjustedScore >= 26) return 'Normal';
  if (adjustedScore >= 22) return 'Comprometimento Cognitivo Leve';
  if (adjustedScore >= 17) return 'Comprometimento Cognitivo Moderado';
  return 'Comprometimento Cognitivo Grave';
};

export const calculateMoCAResults = (totalScore: number, educationYears: number): MoCAResults => {
  // Ajuste por escolaridade: +1 se ≤ 12 anos de estudo
  const adjustedScore = educationYears <= 12 ? Math.min(totalScore + 1, 30) : totalScore;
  const classification = getMoCAClassification(adjustedScore);
  return {
    rawScores: { totalScore, educationYears },
    calculatedScores: { adjustedScore },
    classifications: { totalScore: classification },
    severity: classification,
    notes: `Escore bruto: ${totalScore}/30 | Escolaridade: ${educationYears} anos | Ajustado: ${adjustedScore}/30 | ${classification}`
  };
};
