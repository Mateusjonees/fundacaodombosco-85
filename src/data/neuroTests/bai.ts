/**
 * BAI - Inventário de Ansiedade de Beck
 * Avalia sintomas de ansiedade
 * Faixa etária: 17-80 anos
 * Referência: Beck et al. (1988) - Adaptação brasileira Cunha (2001)
 * 
 * Percentis estimados baseados na distribuição normativa:
 * - Mínimo (0-10): ~80-85% da população saudável
 * - Leve (11-19): ~10-15%
 * - Moderado (20-30): ~3-5%
 * - Grave (31-63): ~1-2%
 */

import type { NeuroTestDefinition } from './bpa2';

export interface BAIResults {
  rawScores: { totalScore: number };
  percentiles: { totalScore: number };
  classifications: { totalScore: string };
  severity: string;
  notes: string;
}

export const BAI_TEST: NeuroTestDefinition = {
  code: 'BAI',
  name: 'BAI (Ansiedade de Beck)',
  fullName: 'Inventário de Ansiedade de Beck',
  description: 'Avalia a intensidade de sintomas de ansiedade. 21 itens, pontuação de 0-3 cada.',
  minAge: 17,
  maxAge: 80,
  subtests: [
    { code: 'TOTAL', name: 'Escore Total', fields: ['total'], formula: 'Soma dos 21 itens (0-63)' }
  ],
  calculatedScores: [
    { code: 'CLASS', name: 'Classificação', formula: 'Classificação direta por faixa de corte' }
  ]
};

export const getBAIClassification = (score: number): string => {
  if (score <= 10) return 'Mínimo';
  if (score <= 19) return 'Leve';
  if (score <= 30) return 'Moderado';
  return 'Grave';
};

/**
 * Percentil estimado invertido para BAI (escores maiores = pior)
 * Baseado em dados normativos brasileiros (Cunha, 2001)
 * Quanto MAIOR o escore, MENOR o percentil (escala invertida)
 */
export const getBAIEstimatedPercentile = (score: number): number => {
  if (score === 0) return 99;
  if (score <= 3) return 95;
  if (score <= 6) return 85;
  if (score <= 10) return 75;
  if (score <= 13) return 50;
  if (score <= 16) return 35;
  if (score <= 19) return 25;
  if (score <= 23) return 15;
  if (score <= 27) return 10;
  if (score <= 30) return 5;
  if (score <= 40) return 3;
  return 1;
};

export const calculateBAIResults = (totalScore: number): BAIResults => {
  const classification = getBAIClassification(totalScore);
  const percentile = getBAIEstimatedPercentile(totalScore);
  return {
    rawScores: { totalScore },
    percentiles: { totalScore: percentile },
    classifications: { totalScore: classification },
    severity: classification,
    notes: `Escore total: ${totalScore}/63 | Percentil: ${percentile} | Classificação: ${classification}`
  };
};
