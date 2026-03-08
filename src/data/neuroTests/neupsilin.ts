/**
 * NEUPSILIN - Instrumento de Avaliação Neuropsicológica Breve
 * Faixa etária: 12-90 anos
 * Referência: Fonseca et al. (2009)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface NEUPSILINResults {
  rawScores: Record<string, number>;
  classifications: Record<string, string>;
  notes: string;
}

export const NEUPSILIN_TEST: NeuroTestDefinition = {
  code: 'NEUPSILIN',
  name: 'NEUPSILIN',
  fullName: 'NEUPSILIN - Avaliação Neuropsicológica Breve',
  description: 'Avalia 8 funções: orientação, atenção, percepção, memória, habilidades aritméticas, linguagem, praxias e funções executivas.',
  minAge: 12,
  maxAge: 90,
  subtests: [
    { code: 'ORI', name: 'Orientação', fields: ['orientacao'], formula: 'Escore Z' },
    { code: 'ATN', name: 'Atenção', fields: ['atencao'], formula: 'Escore Z' },
    { code: 'PER', name: 'Percepção', fields: ['percepcao'], formula: 'Escore Z' },
    { code: 'MEM', name: 'Memória', fields: ['memoria'], formula: 'Escore Z' },
    { code: 'ARI', name: 'Habilidades Aritméticas', fields: ['aritmetica'], formula: 'Escore Z' },
    { code: 'LIN', name: 'Linguagem', fields: ['linguagem'], formula: 'Escore Z' },
    { code: 'PRA', name: 'Praxias', fields: ['praxias'], formula: 'Escore Z' },
    { code: 'FEX', name: 'Funções Executivas', fields: ['funcoesExecutivas'], formula: 'Escore Z' }
  ],
  calculatedScores: []
};

export const getNEUPSILINClassification = (zScore: number): string => {
  if (zScore >= 1) return 'Acima da Média';
  if (zScore >= -1) return 'Média';
  if (zScore >= -1.5) return 'Limítrofe';
  if (zScore >= -2) return 'Deficitário';
  return 'Muito Deficitário';
};

export const calculateNEUPSILINResults = (scores: Record<string, number>): NEUPSILINResults => {
  const classifications: Record<string, string> = {};
  for (const [key, value] of Object.entries(scores)) {
    classifications[key] = getNEUPSILINClassification(value);
  }
  const entries = Object.entries(scores).map(([k, v]) => `${k}: Z=${v.toFixed(1)} (${classifications[k]})`);
  return {
    rawScores: scores,
    classifications,
    notes: entries.join(' | ')
  };
};
