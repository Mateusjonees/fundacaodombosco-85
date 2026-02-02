/**
 * Teste de Fluência Verbal Fonêmica FAS
 * Faixa etária: 19-59 anos (adultos de alto letramento)
 * 
 * Mede:
 * - Fluência verbal fonêmica com as letras F, A e S
 * 
 * Pontuações:
 * - Letra F: Total de acertos
 * - Letra A: Total de acertos
 * - Letra S: Total de acertos
 * - Total FAS: F + A + S
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
 * Opasso PR, Barreto SS, Ortiz KZ. Fluência verbal fonêmica em adultos de alto letramento.
 * einstein. 2016;14(3):398-402.
 */

import { type NeuroTestDefinition } from './bpa2';

export interface FASTestResult {
  letraF: number;
  letraA: number;
  letraS: number;
  totalFAS: number;
  zScore: number;
  percentile: number;
  classification: string;
}

export const FAS_TEST: NeuroTestDefinition = {
  code: 'FAS',
  name: 'FAS',
  fullName: 'Teste de Fluência Verbal Fonêmica FAS',
  description: 'Avalia fluência verbal fonêmica em adultos de alto letramento (19-59 anos)',
  minAge: 19,
  maxAge: 59,
  subtests: [
    {
      code: 'LETRA_F',
      name: 'Letra F',
      fields: ['letraF'],
      formula: 'letraF'
    },
    {
      code: 'LETRA_A',
      name: 'Letra A',
      fields: ['letraA'],
      formula: 'letraA'
    },
    {
      code: 'LETRA_S',
      name: 'Letra S',
      fields: ['letraS'],
      formula: 'letraS'
    },
  ],
  calculatedScores: [
    {
      code: 'TOTAL_FAS',
      name: 'Total FAS',
      formula: 'letraF + letraA + letraS'
    },
    {
      code: 'PERCENTIL',
      name: 'Percentil',
      formula: 'zScoreToPercentile((totalFAS - mean) / sd)'
    },
  ],
};

// Dados normativos do estudo (adultos 19-59 anos, alto letramento)
const FAS_NORMS = {
  mean: 43.5,
  sd: 10.9,
};

/**
 * Converte Z-score para percentil usando aproximação da distribuição normal
 */
export const zScoreToPercentile = (z: number): number => {
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
export const getFASClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

/**
 * Retorna a cor CSS baseada na classificação
 */
export const getFASClassificationColor = (classification: string): string => {
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
 * Calcula os resultados do teste FAS
 */
export const calculateFASResults = (
  letraF: number,
  letraA: number,
  letraS: number
): FASTestResult => {
  const totalFAS = letraF + letraA + letraS;
  const zScore = (totalFAS - FAS_NORMS.mean) / FAS_NORMS.sd;
  const percentile = zScoreToPercentile(zScore);
  const classification = getFASClassification(percentile);

  return {
    letraF,
    letraA,
    letraS,
    totalFAS,
    zScore: Math.round(zScore * 100) / 100,
    percentile,
    classification,
  };
};

/**
 * Verifica se a idade está dentro da faixa do teste
 */
export const isAgeValidForFAS = (age: number): boolean => {
  return age >= 19 && age <= 59;
};
