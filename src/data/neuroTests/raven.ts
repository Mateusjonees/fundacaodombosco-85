/**
 * Matrizes Progressivas de Raven
 * Avalia inteligência geral (fator g) não-verbal
 * Faixa etária: 5-69 anos
 * Versões: Coloridas (5-11) e Geral (12-69)
 * Referência: Angelini et al. (1999) - Normas brasileiras
 */

import type { NeuroTestDefinition } from './bpa2';

export interface RavenResults {
  rawScores: {
    serieA: number;
    serieAb?: number;  // Colorida
    serieB: number;
    serieC?: number;   // Geral
    serieD?: number;   // Geral
    serieE?: number;   // Geral
    total: number;
  };
  percentiles: { total: number };
  classifications: { total: string };
  version: string; // 'colorida' ou 'geral'
  ageGroup: string;
  notes: string;
}

export const RAVEN_TEST: NeuroTestDefinition = {
  code: 'RAVEN',
  name: 'Matrizes de Raven',
  fullName: 'Matrizes Progressivas de Raven',
  description: 'Avalia inteligência geral (fator g) através de raciocínio não-verbal.',
  minAge: 5,
  maxAge: 69,
  subtests: [
    { code: 'TOTAL', name: 'Escore Total', fields: ['total'], formula: 'Soma dos acertos por série' }
  ],
  calculatedScores: [
    { code: 'PERC', name: 'Percentil', formula: 'Lookup por faixa etária e versão' }
  ]
};

// Normas Coloridas (5-11 anos) - Angelini et al.
interface RavenNorms { mean: number; sd: number }
const RAVEN_COLORIDA_NORMS: Record<string, RavenNorms> = {
  '5':  { mean: 15, sd: 4.5 },
  '6':  { mean: 18, sd: 5.0 },
  '7':  { mean: 21, sd: 5.2 },
  '8':  { mean: 24, sd: 5.0 },
  '9':  { mean: 27, sd: 4.8 },
  '10': { mean: 29, sd: 4.5 },
  '11': { mean: 31, sd: 4.0 },
};

// Normas Geral (12-69 anos)
const RAVEN_GERAL_NORMS: Record<string, RavenNorms> = {
  '12-14': { mean: 38, sd: 8 },
  '15-17': { mean: 42, sd: 8 },
  '18-25': { mean: 48, sd: 7 },
  '26-35': { mean: 46, sd: 8 },
  '36-45': { mean: 43, sd: 9 },
  '46-55': { mean: 40, sd: 9 },
  '56-69': { mean: 36, sd: 10 },
};

const getGeralAgeGroup = (age: number): string => {
  if (age <= 14) return '12-14';
  if (age <= 17) return '15-17';
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  return '56-69';
};

const zToPercentile = (z: number): number => {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return Math.round(0.5 * (1.0 + sign * y) * 100);
};

const getClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Intelectualmente Deficiente';
  if (percentile <= 10) return 'Definidamente Abaixo da Média';
  if (percentile <= 25) return 'Abaixo da Média';
  if (percentile <= 75) return 'Média';
  if (percentile <= 90) return 'Acima da Média';
  if (percentile <= 95) return 'Definidamente Acima da Média';
  return 'Intelectualmente Superior';
};

export const calculateRavenResults = (
  total: number,
  age: number,
  rawScores: Partial<RavenResults['rawScores']>
): RavenResults => {
  const isColorida = age <= 11;
  let norms: RavenNorms;
  let ageGroup: string;

  if (isColorida) {
    ageGroup = Math.min(11, Math.max(5, Math.round(age))).toString();
    norms = RAVEN_COLORIDA_NORMS[ageGroup] || RAVEN_COLORIDA_NORMS['8'];
  } else {
    ageGroup = getGeralAgeGroup(age);
    norms = RAVEN_GERAL_NORMS[ageGroup];
  }

  const z = (total - norms.mean) / norms.sd;
  const percentile = zToPercentile(z);
  const classification = getClassification(percentile);

  return {
    rawScores: {
      serieA: rawScores.serieA || 0,
      serieAb: rawScores.serieAb,
      serieB: rawScores.serieB || 0,
      serieC: rawScores.serieC,
      serieD: rawScores.serieD,
      serieE: rawScores.serieE,
      total
    },
    percentiles: { total: percentile },
    classifications: { total: classification },
    version: isColorida ? 'Colorida' : 'Geral',
    ageGroup: isColorida ? `${ageGroup} anos` : `${ageGroup} anos`,
    notes: `Versão: ${isColorida ? 'Colorida' : 'Geral'} | Faixa: ${ageGroup} | M=${norms.mean} DP=${norms.sd}`
  };
};
