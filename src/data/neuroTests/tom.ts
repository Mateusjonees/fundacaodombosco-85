/**
 * Teste ToM - Bateria de Tarefas para Avaliação da Teoria da Mente
 * Faixa etária: 3-5 anos
 * 
 * Mede:
 * - Capacidade de compreender a mente através da inferência de emoções, desejos, perceções e crenças
 * 
 * Pontuações:
 * - Total de acertos (0-24 pontos)
 * 
 * Cálculo do Percentil:
 * - Z-score = (Total - Média) / Desvio Padrão
 * - Percentil é convertido a partir do Z-score usando distribuição normal
 * 
 * Classificações baseadas em percentis:
 * - <= 5: Inferior
 * - 6-25: Média Inferior
 * - 26-74: Média
 * - 75-94: Média Superior
 * - >= 95: Superior
 * 
 * Dados normativos baseados em:
 * Leal, A. F. A. (2014). Avaliação do desenvolvimento da teoria da mente em crianças 
 * dos 3 aos 5 anos: adaptação portuguesa da Theory of Mind Task Battery (Master's thesis).
 */

import { type NeuroTestDefinition } from './bpa2';

export interface TOMTestResult {
  totalScore: number;
  zScore: number;
  percentile: number;
  classification: string;
}

export const TOM_TEST: NeuroTestDefinition = {
  code: 'TOM',
  name: 'ToM',
  fullName: 'Bateria de Tarefas para Avaliação da Teoria da Mente (ToM)',
  description: 'Avalia a teoria da mente em crianças de 3 a 5 anos através de 9 tarefas',
  minAge: 3,
  maxAge: 5,
  subtests: [
    {
      code: 'TOTAL',
      name: 'Total de Acertos',
      fields: ['totalScore'],
      formula: 'totalScore'
    },
  ],
  calculatedScores: [
    {
      code: 'PERCENTIL',
      name: 'Percentil',
      formula: 'zScoreToPercentile((totalScore - mean) / sd)'
    },
  ],
};

// Dados normativos do estudo (crianças 3-5 anos)
// Tabela 6 do manual
interface TOMNormData {
  mean: number;
  sd: number;
  min: number;
  max: number;
}

const TOM_NORMS: Record<number, TOMNormData> = {
  3: { mean: 7.24, sd: 2.803, min: 2, max: 14 },
  4: { mean: 9.28, sd: 2.772, min: 4, max: 15 },
  5: { mean: 13.85, sd: 4.234, min: 7, max: 21 },
};

/**
 * Converte Z-score para percentil usando aproximação da distribuição normal
 */
export const zScoreToPercentileTOM = (z: number): number => {
  // Aproximação usando função de erro (erf)
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

  const cdf = 0.5 * (1.0 + sign * y);
  
  return Math.round(cdf * 100);
};

/**
 * Retorna a classificação baseada no percentil
 */
export const getTOMClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

/**
 * Retorna a cor CSS baseada na classificação
 */
export const getTOMClassificationColor = (classification: string): string => {
  switch (classification) {
    case 'Inferior':
      return 'text-red-600 dark:text-red-400';
    case 'Média Inferior':
      return 'text-orange-600 dark:text-orange-400';
    case 'Média':
      return 'text-green-600 dark:text-green-400';
    case 'Média Superior':
      return 'text-blue-600 dark:text-blue-400';
    case 'Superior':
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-muted-foreground';
  }
};

/**
 * Obtém as normas para uma idade específica
 */
export const getTOMNormsForAge = (age: number): TOMNormData | null => {
  if (age < 3 || age > 5) return null;
  return TOM_NORMS[age] || null;
};

/**
 * Calcula os resultados do teste TOM
 */
export const calculateTOMResults = (
  totalScore: number,
  age: number
): TOMTestResult | null => {
  const norms = getTOMNormsForAge(age);
  if (!norms) return null;

  const zScore = (totalScore - norms.mean) / norms.sd;
  const percentile = zScoreToPercentileTOM(zScore);
  const classification = getTOMClassification(percentile);

  return {
    totalScore,
    zScore: Math.round(zScore * 100) / 100,
    percentile,
    classification,
  };
};

/**
 * Verifica se a idade está dentro da faixa do teste
 */
export const isAgeValidForTOM = (age: number): boolean => {
  return age >= 3 && age <= 5;
};
