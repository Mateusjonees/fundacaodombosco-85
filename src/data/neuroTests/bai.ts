/**
 * BAI - Inventário de Ansiedade de Beck
 * Avalia sintomas de ansiedade
 * Faixa etária: 17-80 anos
 * Referência: Beck et al. (1988) - Adaptação brasileira Cunha (2001)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface BAIResults {
  rawScores: { totalScore: number };
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

export const calculateBAIResults = (totalScore: number): BAIResults => {
  const classification = getBAIClassification(totalScore);
  return {
    rawScores: { totalScore },
    classifications: { totalScore: classification },
    severity: classification,
    notes: `Escore total: ${totalScore}/63 | Classificação: ${classification}`
  };
};
