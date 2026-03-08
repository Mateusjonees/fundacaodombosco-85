/**
 * BDI-II - Inventário de Depressão de Beck
 * Avalia sintomas depressivos
 * Faixa etária: 13-80 anos
 * Referência: Beck et al. (1996) - Adaptação brasileira Gorenstein & Andrade (1998)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface BDIResults {
  rawScores: { totalScore: number };
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

export const calculateBDIResults = (totalScore: number): BDIResults => {
  const classification = getBDIClassification(totalScore);
  return {
    rawScores: { totalScore },
    classifications: { totalScore: classification },
    severity: classification,
    notes: `Escore total: ${totalScore}/63 | Classificação: ${classification}`
  };
};
