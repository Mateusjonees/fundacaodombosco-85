/**
 * Vineland-3 - Escalas de Comportamento Adaptativo
 * Faixa etária: 0-90 anos
 * Referência: Sparrow et al. (2016) - Adaptação brasileira
 */

import type { NeuroTestDefinition } from './bpa2';

export interface VinelandResults {
  rawScores: Record<string, number>;
  classifications: Record<string, string>;
  notes: string;
}

export const VINELAND_TEST: NeuroTestDefinition = {
  code: 'VINELAND',
  name: 'Vineland-3',
  fullName: 'Vineland-3 - Escalas de Comportamento Adaptativo',
  description: 'Avalia comportamento adaptativo: comunicação, vida diária, socialização, habilidades motoras. Escores padrão (M=100, DP=15).',
  minAge: 0,
  maxAge: 90,
  subtests: [
    { code: 'COM', name: 'Comunicação', fields: ['comunicacao'], formula: 'Escore Padrão (M=100, DP=15)' },
    { code: 'VD', name: 'Vida Diária', fields: ['vidaDiaria'], formula: 'Escore Padrão' },
    { code: 'SOC', name: 'Socialização', fields: ['socializacao'], formula: 'Escore Padrão' },
    { code: 'MOT', name: 'Habilidades Motoras', fields: ['habMotoras'], formula: 'Escore Padrão' }
  ],
  calculatedScores: [
    { code: 'CAG', name: 'Comportamento Adaptativo Geral', formula: 'Composto geral (M=100, DP=15)' }
  ]
};

export const getVinelandClassification = (standardScore: number): string => {
  if (standardScore >= 130) return 'Alto';
  if (standardScore >= 115) return 'Moderadamente Alto';
  if (standardScore >= 86) return 'Adequado';
  if (standardScore >= 71) return 'Moderadamente Baixo';
  if (standardScore >= 55) return 'Baixo';
  return 'Muito Baixo';
};

export const calculateVinelandResults = (scores: {
  comunicacao: number;
  vidaDiaria: number;
  socializacao: number;
  habMotoras: number;
  compostoGeral: number;
}): VinelandResults => {
  const rawScores: Record<string, number> = {
    comunicacao: scores.comunicacao,
    vidaDiaria: scores.vidaDiaria,
    socializacao: scores.socializacao,
    habMotoras: scores.habMotoras,
    compostoGeral: scores.compostoGeral
  };

  const classifications: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawScores)) {
    classifications[key] = getVinelandClassification(value);
  }

  return {
    rawScores,
    classifications,
    notes: `CAG=${scores.compostoGeral} (${classifications.compostoGeral}) | Comunicação=${scores.comunicacao} | Vida Diária=${scores.vidaDiaria} | Socialização=${scores.socializacao} | Motor=${scores.habMotoras}`
  };
};
