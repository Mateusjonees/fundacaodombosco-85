/**
 * TDE-II - Teste de Desempenho Escolar
 * Faixa etária: 6-14 anos (1º ao 9º ano)
 * Referência: Stein (1994) - TDE-II adaptado
 */

import type { NeuroTestDefinition } from './bpa2';

export interface TDE2Results {
  rawScores: Record<string, number>;
  classifications: Record<string, string>;
  notes: string;
}

export const TDE2_TEST: NeuroTestDefinition = {
  code: 'TDE2',
  name: 'TDE-II',
  fullName: 'TDE-II - Teste de Desempenho Escolar',
  description: 'Avalia desempenho em leitura, escrita e aritmética. Classificação por ano escolar.',
  minAge: 6,
  maxAge: 14,
  subtests: [
    { code: 'ESC', name: 'Escrita', fields: ['escrita'], formula: 'Escore bruto' },
    { code: 'ARI', name: 'Aritmética', fields: ['aritmetica'], formula: 'Escore bruto' },
    { code: 'LEI', name: 'Leitura', fields: ['leitura'], formula: 'Escore bruto' }
  ],
  calculatedScores: [
    { code: 'TOT', name: 'Escore Total', formula: 'Soma dos 3 subtestes' }
  ]
};

export const getTDE2Classification = (percentile: number): string => {
  if (percentile >= 75) return 'Superior';
  if (percentile >= 50) return 'Médio';
  if (percentile >= 25) return 'Inferior';
  return 'Muito Inferior';
};

export const calculateTDE2Results = (scores: {
  escrita: number;
  aritmetica: number;
  leitura: number;
  classificacaoEscrita: string;
  classificacaoAritmetica: string;
  classificacaoLeitura: string;
  classificacaoTotal: string;
}): TDE2Results => {
  const total = scores.escrita + scores.aritmetica + scores.leitura;
  return {
    rawScores: {
      escrita: scores.escrita,
      aritmetica: scores.aritmetica,
      leitura: scores.leitura,
      totalScore: total
    },
    classifications: {
      escrita: scores.classificacaoEscrita,
      aritmetica: scores.classificacaoAritmetica,
      leitura: scores.classificacaoLeitura,
      totalScore: scores.classificacaoTotal
    },
    notes: `Total: ${total} | Escrita: ${scores.classificacaoEscrita} | Aritmética: ${scores.classificacaoAritmetica} | Leitura: ${scores.classificacaoLeitura}`
  };
};
