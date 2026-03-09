/**
 * BDI-II - Inventário de Depressão de Beck
 * Avalia sintomas depressivos
 * Faixa etária: 13-80 anos
 * Referência: Beck et al. (1996) - Adaptação brasileira Gorenstein & Andrade (1998)
 * 
 * Percentis estimados baseados na distribuição normativa:
 * - Mínimo (0-13): maioria da população saudável (~85%)
 * - Leve (14-19): ~10-15% da população
 * - Moderado (20-28): ~3-5%
 * - Grave (29-63): ~1-2%
 */

import type { NeuroTestDefinition } from './bpa2';

export interface BDIResults {
  rawScores: { totalScore: number };
  percentiles: { totalScore: number };
  classifications: { totalScore: string };
  severity: string;
  notes: string;
}

export const BDI_TEST: NeuroTestDefinition = {
  code: 'BDI',
  name: 'BDI-II (Depressão de Beck)',
  fullName: 'Inventário de Depressão de Beck - Segunda Edição',
  description: 'Avalia a intensidade de sintomas depressivos. 21 itens, pontuação de 0-3 cada.',
  minAge: 13,
  maxAge: 80,
  subtests: [
    { code: 'TOTAL', name: 'Escore Total', fields: ['total'], formula: 'Soma dos 21 itens (0-63)' }
  ],
  calculatedScores: [
    { code: 'CLASS', name: 'Classificação', formula: 'Classificação direta por faixa de corte' }
  ]
};

export const getBDIClassification = (score: number): string => {
  if (score <= 13) return 'Mínimo';
  if (score <= 19) return 'Leve';
  if (score <= 28) return 'Moderado';
  return 'Grave';
};

/**
 * Percentil estimado invertido para BDI (escores maiores = pior)
 * Baseado em dados normativos brasileiros (Gorenstein & Andrade, 1998)
 * Quanto MAIOR o escore, MENOR o percentil (escala invertida - mede sintomas)
 */
export const getBDIEstimatedPercentile = (score: number): number => {
  // Escala invertida: score baixo = percentil alto (menos sintomas = melhor)
  if (score === 0) return 99;
  if (score <= 3) return 95;
  if (score <= 6) return 90;
  if (score <= 9) return 80;
  if (score <= 13) return 70;
  if (score <= 15) return 50;
  if (score <= 17) return 35;
  if (score <= 19) return 25;
  if (score <= 22) return 15;
  if (score <= 25) return 10;
  if (score <= 28) return 5;
  if (score <= 35) return 3;
  return 1;
};

export const calculateBDIResults = (totalScore: number): BDIResults => {
  const classification = getBDIClassification(totalScore);
  const percentile = getBDIEstimatedPercentile(totalScore);
  return {
    rawScores: { totalScore },
    percentiles: { totalScore: percentile },
    classifications: { totalScore: classification },
    severity: classification,
    notes: `Escore total: ${totalScore}/63 | Percentil: ${percentile} | Classificação: ${classification}`
  };
};
