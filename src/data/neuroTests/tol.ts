/**
 * Torre de Londres (ToL)
 * Avalia funções executivas: planejamento e resolução de problemas
 * Faixa etária: 6-14 anos
 * Referência: Seabra & Dias (2012) - Normas brasileiras
 */

import type { NeuroTestDefinition } from './bpa2';

export interface ToLResults {
  rawScores: { totalAcertos: number; tempoTotal?: number };
  percentiles: { totalAcertos: number };
  classifications: { totalAcertos: string };
  ageGroup: string;
  notes: string;
}

export const TOL_TEST: NeuroTestDefinition = {
  code: 'TOL',
  name: 'Torre de Londres',
  fullName: 'Torre de Londres - Teste de Planejamento',
  description: 'Avalia funções executivas como planejamento, sequenciamento e resolução de problemas.',
  minAge: 6,
  maxAge: 14,
  subtests: [
    { code: 'ACERTOS', name: 'Total de Acertos', fields: ['acertos'], formula: 'Total de problemas resolvidos corretamente (0-12)' }
  ],
  calculatedScores: [
    { code: 'PERC', name: 'Percentil', formula: 'Lookup por faixa etária' }
  ]
};

interface ToLNorms {
  mean: number;
  sd: number;
}

// Normas brasileiras por faixa etária (Seabra & Dias, 2012)
const TOL_NORMS: Record<string, ToLNorms> = {
  '6': { mean: 6.2, sd: 2.1 },
  '7': { mean: 7.1, sd: 2.0 },
  '8': { mean: 7.8, sd: 1.9 },
  '9': { mean: 8.5, sd: 1.8 },
  '10': { mean: 9.0, sd: 1.7 },
  '11': { mean: 9.4, sd: 1.6 },
  '12': { mean: 9.8, sd: 1.5 },
  '13': { mean: 10.1, sd: 1.4 },
  '14': { mean: 10.3, sd: 1.3 }
};

const getClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Muito Baixo';
  if (percentile <= 10) return 'Baixo';
  if (percentile <= 25) return 'Médio Inferior';
  if (percentile <= 75) return 'Médio';
  if (percentile <= 90) return 'Médio Superior';
  if (percentile <= 95) return 'Alto';
  return 'Muito Alto';
};

const zToPercentile = (z: number): number => {
  // Approximation using normal CDF
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  const cdf = 0.5 * (1.0 + sign * y);
  return Math.round(cdf * 100);
};

export const calculateToLResults = (totalAcertos: number, age: number, tempoTotal?: number): ToLResults => {
  const ageKey = Math.min(14, Math.max(6, Math.round(age))).toString();
  const norms = TOL_NORMS[ageKey] || TOL_NORMS['10'];

  const z = (totalAcertos - norms.mean) / norms.sd;
  const percentile = zToPercentile(z);
  const classification = getClassification(percentile);

  return {
    rawScores: { totalAcertos, tempoTotal },
    percentiles: { totalAcertos: percentile },
    classifications: { totalAcertos: classification },
    ageGroup: `${ageKey} anos`,
    notes: `Idade: ${ageKey} anos | M=${norms.mean} DP=${norms.sd}`
  };
};
