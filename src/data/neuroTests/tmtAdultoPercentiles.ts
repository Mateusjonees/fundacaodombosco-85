/**
 * Tabelas de Percentis do TMT - Teste de Trilhas Adulto (19-75 anos)
 * Dados extraídos das tabelas do manual oficial
 * 
 * IMPORTANTE: Para tempo e erros, percentis são interpretados de forma INVERSA
 * - Tempos menores = melhor desempenho = percentis maiores
 * - Percentil 95 tem o menor tempo (melhor)
 * - Percentil 5 tem o maior tempo (pior)
 * 
 * Classificações:
 * - <5: Muito Inferior
 * - 5, 5-10, 10: Inferior
 * - 10-25, 25: Média Inferior
 * - 25-50, 50, 50-75: Média
 * - 75, 75-90: Média Superior
 * - 90, 90-95: Superior
 * - >95, 95: Muito Superior
 */

import { EducationLevel, AgeGroup, getAgeGroup, getClassificationFromPercentile } from './tmtAdulto';

// Estrutura da tabela: [P95, P90, P75, P50, P25, P10, P5]
// Valores em segundos
type PercentileRow = [number, number, number, number, number, number, number];

// TMT A Tempo em segundos
const TMT_A_TEMPO: Record<AgeGroup, Record<EducationLevel, PercentileRow>> = {
  '19-39': {
    fundamental: [23.39, 27.67, 34.03, 40.58, 50.84, 61.14, 70.03],
    medio: [20.71, 21.15, 25.65, 33.87, 42.53, 50.35, 58.48],
    superior: [17.36, 19.09, 23.06, 29.97, 35.70, 45.75, 53.93]
  },
  '40-59': {
    fundamental: [29.97, 29.97, 31.57, 37.60, 48.66, 48.66, 48.66],
    medio: [20.04, 24.24, 32.03, 40.55, 45.98, 53.40, 60.34],
    superior: [20.79, 23.19, 27.36, 34.83, 48.41, 65.65, 76.04]
  },
  '60-75': {
    fundamental: [28.47, 28.52, 34.48, 38.05, 48.17, 61.12, 61.12],
    medio: [29.64, 31.89, 36.16, 46.80, 55.20, 59.36, 59.36],
    superior: [20.69, 22.00, 31.97, 39.85, 50.68, 62.70, 63.42]
  }
};

// TMT B Tempo em segundos
const TMT_B_TEMPO: Record<AgeGroup, Record<EducationLevel, PercentileRow>> = {
  '19-39': {
    fundamental: [62.31, 68.63, 85.54, 107.73, 142.01, 169.50, 182.41],
    medio: [47.42, 48.24, 55.32, 76.12, 95.37, 120.25, 148.19],
    superior: [33.09, 37.90, 51.19, 62.09, 77.07, 101.59, 134.03]
  },
  '40-59': {
    fundamental: [82.47, 82.47, 95.12, 145.66, 168.33, 168.33, 168.33],
    medio: [43.31, 63.21, 83.90, 100.15, 118.98, 144.48, 177.81],
    superior: [44.10, 55.75, 65.93, 90.14, 107.20, 157.61, 177.25]
  },
  '60-75': {
    fundamental: [72.93, 74.41, 90.52, 137.59, 157.70, 171.73, 171.73],
    medio: [53.37, 64.75, 85.93, 125.03, 147.41, 162.69, 162.69],
    superior: [44.97, 59.15, 65.56, 89.56, 114.50, 168.91, 180.36]
  }
};

// TMT B-A (Tempo B - Tempo A) em segundos
const TMT_BA_TEMPO: Record<AgeGroup, Record<EducationLevel, PercentileRow>> = {
  '19-39': {
    fundamental: [16.45, 25.62, 40.50, 62.88, 94.40, 119.10, 147.36],
    medio: [14.46, 17.60, 26.67, 37.41, 58.04, 80.59, 96.56],
    superior: [7.82, 12.62, 20.91, 32.11, 45.70, 66.86, 93.49]
  },
  '40-59': {
    fundamental: [52.50, 52.50, 56.68, 108.06, 129.19, 129.19, 129.19],
    medio: [19.01, 29.58, 47.84, 58.63, 82.66, 103.24, 137.56],
    superior: [12.61, 14.68, 30.87, 48.13, 68.61, 98.54, 106.77]
  },
  '60-75': {
    fundamental: [29.84, 32.13, 58.66, 95.77, 111.80, 137.59, 137.59],
    medio: [7.32, 13.77, 39.13, 72.52, 98.94, 119.53, 119.53],
    superior: [21.90, 23.02, 30.91, 44.48, 72.69, 109.13, 129.68]
  }
};

// Percentis disponíveis
const PERCENTILE_VALUES = [95, 90, 75, 50, 25, 10, 5];

/**
 * Busca o percentil para um tempo dado
 * Como tempo menor = melhor desempenho, a lógica é invertida:
 * - Se tempo <= valor do P95, é P>95
 * - Se tempo <= valor do P90 (e > P95), é P90-95
 * - etc.
 */
const lookupPercentileForTime = (
  time: number,
  row: PercentileRow
): string => {
  // Valores na row: [P95, P90, P75, P50, P25, P10, P5]
  // P95 tem menor tempo, P5 tem maior tempo
  
  if (time <= row[0]) return '>95';
  if (time <= row[1]) return '90-95';
  if (time <= row[2]) return '75-90';
  if (time <= row[3]) return '50-75';
  if (time <= row[4]) return '25-50';
  if (time <= row[5]) return '10-25';
  if (time <= row[6]) return '5-10';
  return '<5';
};

/**
 * Busca o percentil para TMT A Tempo
 */
export const lookupTMTATempoPercentile = (
  age: number,
  educationLevel: EducationLevel,
  time: number
): string | null => {
  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return null;
  
  const row = TMT_A_TEMPO[ageGroup]?.[educationLevel];
  if (!row) return null;
  
  return lookupPercentileForTime(time, row);
};

/**
 * Busca o percentil para TMT B Tempo
 */
export const lookupTMTBTempoPercentile = (
  age: number,
  educationLevel: EducationLevel,
  time: number
): string | null => {
  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return null;
  
  const row = TMT_B_TEMPO[ageGroup]?.[educationLevel];
  if (!row) return null;
  
  return lookupPercentileForTime(time, row);
};

/**
 * Busca o percentil para TMT B-A
 */
export const lookupTMTBATempoPercentile = (
  age: number,
  educationLevel: EducationLevel,
  diffTime: number
): string | null => {
  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return null;
  
  const row = TMT_BA_TEMPO[ageGroup]?.[educationLevel];
  if (!row) return null;
  
  return lookupPercentileForTime(diffTime, row);
};

/**
 * Calcula todos os resultados do TMT Adulto
 */
export const calculateTMTAdultoResults = (
  age: number,
  educationLevel: EducationLevel,
  tempoA: number,
  tempoB: number
): {
  calculatedScores: { tempoA: number; tempoB: number; tempoBA: number };
  percentiles: { tempoA: string; tempoB: string; tempoBA: string };
  classifications: { tempoA: string; tempoB: string; tempoBA: string };
} | null => {
  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return null;
  
  const tempoBA = tempoB - tempoA;
  
  const percentileA = lookupTMTATempoPercentile(age, educationLevel, tempoA);
  const percentileB = lookupTMTBTempoPercentile(age, educationLevel, tempoB);
  const percentileBA = lookupTMTBATempoPercentile(age, educationLevel, tempoBA);
  
  if (!percentileA || !percentileB || !percentileBA) return null;
  
  return {
    calculatedScores: {
      tempoA,
      tempoB,
      tempoBA
    },
    percentiles: {
      tempoA: percentileA,
      tempoB: percentileB,
      tempoBA: percentileBA
    },
    classifications: {
      tempoA: getClassificationFromPercentile(percentileA),
      tempoB: getClassificationFromPercentile(percentileB),
      tempoBA: getClassificationFromPercentile(percentileBA)
    }
  };
};

/**
 * Retorna o nome da faixa etária para exibição
 */
export const getTMTAdultoAgeGroupName = (age: number): string => {
  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return 'Idade não suportada';
  
  switch (ageGroup) {
    case '19-39': return 'Adultos de 19 a 39 anos';
    case '40-59': return 'Adultos de 40 a 59 anos';
    case '60-75': return 'Adultos de 60 a 75 anos';
  }
};

/**
 * Verifica se a idade está dentro da faixa do teste
 */
export const isAgeValidForTMTAdulto = (age: number): boolean => {
  return age >= 19 && age <= 75;
};
