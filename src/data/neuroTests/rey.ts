/**
 * Definição do Teste Figuras Complexas de Rey
 * Avalia habilidades visuoconstrutivas e memória visual
 * Faixa etária: 5-88 anos
 * 
 * Referência: Rey, A. (1941); Oliveira & Rigoni (2010) - Normas brasileiras
 */

import type { NeuroTestDefinition } from './bpa2';

export interface ReyScores {
  copia: number;           // Pontos na cópia (0-36)
  memoria: number;         // Pontos na reprodução de memória (0-36)
  tempoCopia?: number;     // Tempo de cópia em segundos (opcional)
}

export interface ReyResults {
  rawScores: ReyScores;
  percentiles: {
    copia: number;
    memoria: number;
  };
  classifications: {
    copia: string;
    memoria: string;
  };
  ageGroup: string;
  notes: string;
}

export const REY_TEST: NeuroTestDefinition = {
  code: 'REY',
  name: 'Figuras de Rey',
  fullName: 'Teste de Cópia e Reprodução de Memória de Figuras Complexas de Rey',
  description: 'Avalia habilidades visuoconstrutivas (cópia) e memória visual (reprodução de memória).',
  minAge: 5,
  maxAge: 88,
  subtests: [
    { code: 'COPIA', name: 'Cópia', fields: ['pontos'], formula: 'Pontos na cópia (0-36)' },
    { code: 'MEMORIA', name: 'Memória', fields: ['pontos'], formula: 'Pontos na reprodução de memória (0-36)' }
  ],
  calculatedScores: [
    { code: 'COPIA_PERC', name: 'Percentil Cópia', formula: 'Lookup por faixa etária' },
    { code: 'MEMORIA_PERC', name: 'Percentil Memória', formula: 'Lookup por faixa etária' }
  ]
};

/**
 * Dados normativos por faixa etária
 * Fonte: Oliveira & Rigoni (2010) - Adaptação brasileira
 * Cada faixa contém média e desvio padrão para cópia e memória
 */
interface AgeGroupNorms {
  label: string;
  copia: { mean: number; sd: number };
  memoria: { mean: number; sd: number };
}

const REY_NORMS: Record<string, AgeGroupNorms> = {
  '5-6': {
    label: '5-6 anos',
    copia: { mean: 15.5, sd: 5.8 },
    memoria: { mean: 8.5, sd: 4.2 }
  },
  '7-8': {
    label: '7-8 anos',
    copia: { mean: 22.0, sd: 5.5 },
    memoria: { mean: 13.0, sd: 5.0 }
  },
  '9-10': {
    label: '9-10 anos',
    copia: { mean: 27.5, sd: 5.0 },
    memoria: { mean: 16.5, sd: 5.5 }
  },
  '11-12': {
    label: '11-12 anos',
    copia: { mean: 30.0, sd: 4.5 },
    memoria: { mean: 19.0, sd: 5.5 }
  },
  '13-14': {
    label: '13-14 anos',
    copia: { mean: 31.5, sd: 3.8 },
    memoria: { mean: 20.5, sd: 5.5 }
  },
  '15-17': {
    label: '15-17 anos',
    copia: { mean: 33.0, sd: 3.2 },
    memoria: { mean: 22.0, sd: 5.5 }
  },
  '18-29': {
    label: '18-29 anos',
    copia: { mean: 34.0, sd: 2.5 },
    memoria: { mean: 22.5, sd: 5.8 }
  },
  '30-39': {
    label: '30-39 anos',
    copia: { mean: 33.5, sd: 3.0 },
    memoria: { mean: 21.0, sd: 6.0 }
  },
  '40-49': {
    label: '40-49 anos',
    copia: { mean: 32.5, sd: 3.5 },
    memoria: { mean: 19.0, sd: 6.2 }
  },
  '50-59': {
    label: '50-59 anos',
    copia: { mean: 31.0, sd: 4.0 },
    memoria: { mean: 16.5, sd: 6.5 }
  },
  '60-69': {
    label: '60-69 anos',
    copia: { mean: 29.0, sd: 5.0 },
    memoria: { mean: 14.0, sd: 6.0 }
  },
  '70-79': {
    label: '70-79 anos',
    copia: { mean: 26.5, sd: 6.0 },
    memoria: { mean: 11.5, sd: 5.5 }
  },
  '80-88': {
    label: '80-88 anos',
    copia: { mean: 23.0, sd: 7.0 },
    memoria: { mean: 9.0, sd: 5.0 }
  }
};

/**
 * Determina a faixa etária
 */
export const getReyAgeGroup = (age: number): string | null => {
  if (age >= 5 && age <= 6) return '5-6';
  if (age >= 7 && age <= 8) return '7-8';
  if (age >= 9 && age <= 10) return '9-10';
  if (age >= 11 && age <= 12) return '11-12';
  if (age >= 13 && age <= 14) return '13-14';
  if (age >= 15 && age <= 17) return '15-17';
  if (age >= 18 && age <= 29) return '18-29';
  if (age >= 30 && age <= 39) return '30-39';
  if (age >= 40 && age <= 49) return '40-49';
  if (age >= 50 && age <= 59) return '50-59';
  if (age >= 60 && age <= 69) return '60-69';
  if (age >= 70 && age <= 79) return '70-79';
  if (age >= 80 && age <= 88) return '80-88';
  return null;
};

export const isAgeValidForRey = (age: number): boolean => {
  return age >= 5 && age <= 88;
};

/**
 * Converte Z-score para percentil
 */
const zScoreToPercentile = (z: number): number => {
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
  return Math.round(0.5 * (1.0 + sign * y) * 100);
};

/**
 * Classificação por percentil
 */
export const getReyClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

/**
 * Calcula resultados completos do teste
 */
export const calculateReyResults = (scores: ReyScores, age: number): ReyResults | null => {
  if (!isAgeValidForRey(age)) return null;

  const ageGroup = getReyAgeGroup(age);
  if (!ageGroup) return null;

  const norms = REY_NORMS[ageGroup];

  const zCopia = (scores.copia - norms.copia.mean) / norms.copia.sd;
  const zMemoria = (scores.memoria - norms.memoria.mean) / norms.memoria.sd;

  const percCopia = zScoreToPercentile(zCopia);
  const percMemoria = zScoreToPercentile(zMemoria);

  return {
    rawScores: scores,
    percentiles: { copia: percCopia, memoria: percMemoria },
    classifications: {
      copia: getReyClassification(percCopia),
      memoria: getReyClassification(percMemoria)
    },
    ageGroup: norms.label,
    notes: ''
  };
};
