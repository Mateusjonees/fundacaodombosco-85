/**
 * Teste Hayling - Versão Adulto
 * Faixa etária: 19-75 anos
 * 
 * Avalia:
 * - Iniciação e inibição de respostas verbais
 * - Velocidade de processamento
 * - Controle inibitório
 * 
 * Pontuações:
 * - Parte A Tempo: Tempo total em segundos
 * - Parte B Tempo: Tempo total em segundos
 * - Parte B Erros: Total de erros (escala 0-45)
 * - Inibição B-A: Tempo B - Tempo A
 * 
 * Cálculo do Percentil:
 * - Z-score = (Pontuação - Média) / Desvio Padrão
 * - Para tempo e erros: menor é melhor, então usamos fórmula invertida
 * - Percentil = 100 - (Z-score convertido para percentil)
 * 
 * Classificações baseadas em percentis:
 * - <= 5: Inferior
 * - 6-25: Média Inferior
 * - 26-74: Média
 * - 75-94: Média Superior
 * - >= 95: Superior
 * 
 * Dados normativos baseados em:
 * Zimmermann N, Cardoso CO, Kristensen CH, Fonseca RP. Brazilian norms and effects 
 * of age and education on the Hayling and Trail Making Tests.
 * Trends Psychiatry Psychother. 2017.
 */

import { type NeuroTestDefinition } from './bpa2';

export type HaylingAgeGroup = '19-39' | '40-59' | '60-75';
export type HaylingEducationLevel = '5-8' | '9-11' | '12+';

export interface HaylingNormData {
  timeA: { mean: number; sd: number };
  timeB: { mean: number; sd: number };
  errorsB: { mean: number; sd: number };
  timeBA: { mean: number; sd: number };
}

export interface HaylingRawScores {
  tempoA: number;
  tempoB: number;
  errosB: number;
}

export interface HaylingCalculatedScores {
  inibiçãoBA: number;
}

export interface HaylingPercentiles {
  tempoA: number;
  tempoB: number;
  errosB: number;
  inibiçãoBA: number;
}

export interface HaylingClassifications {
  tempoA: string;
  tempoB: string;
  errosB: string;
  inibiçãoBA: string;
}

export interface HaylingResults {
  rawScores: HaylingRawScores;
  calculatedScores: HaylingCalculatedScores;
  percentiles: HaylingPercentiles;
  classifications: HaylingClassifications;
  educationLevel: HaylingEducationLevel;
  notes?: string;
}

export const HAYLING_ADULTO_TEST: NeuroTestDefinition = {
  code: 'HAYLING_ADULTO',
  name: 'Hayling Adulto',
  fullName: 'Teste Hayling - Versão Adulto',
  description: 'Avalia iniciação e inibição de respostas verbais, controle inibitório e flexibilidade cognitiva.',
  minAge: 19,
  maxAge: 75,
  subtests: [
    {
      code: 'TEMPO_A',
      name: 'Parte A - Tempo',
      fields: ['tempoA'],
      formula: 'Tempo total em segundos'
    },
    {
      code: 'TEMPO_B',
      name: 'Parte B - Tempo',
      fields: ['tempoB'],
      formula: 'Tempo total em segundos'
    },
    {
      code: 'ERROS_B',
      name: 'Parte B - Erros',
      fields: ['errosB'],
      formula: 'Total de erros (0-45)'
    }
  ],
  calculatedScores: [
    {
      code: 'INIBICAO_BA',
      name: 'Inibição B-A',
      formula: 'Tempo B - Tempo A'
    }
  ]
};

/**
 * Tabelas normativas por grupo de idade e escolaridade
 * Dados da Table 3 do artigo de Zimmermann et al.
 */
export const HAYLING_NORMS: Record<HaylingAgeGroup, Record<HaylingEducationLevel, HaylingNormData>> = {
  '19-39': {
    '5-8': {
      timeA: { mean: 18.49, sd: 4.88 },
      timeB: { mean: 50.40, sd: 17.86 },
      errorsB: { mean: 13.78, sd: 5.24 },
      timeBA: { mean: 31.91, sd: 17.29 }
    },
    '9-11': {
      timeA: { mean: 16.83, sd: 7.74 },
      timeB: { mean: 37.16, sd: 18.44 },
      errorsB: { mean: 8.82, sd: 6.64 },
      timeBA: { mean: 20.33, sd: 15.50 }
    },
    '12+': {
      timeA: { mean: 14.79, sd: 4.48 },
      timeB: { mean: 36.89, sd: 21.11 },
      errorsB: { mean: 9.97, sd: 6.74 },
      timeBA: { mean: 22.10, sd: 20.13 }
    }
  },
  '40-59': {
    '5-8': {
      timeA: { mean: 16.61, sd: 7.30 },
      timeB: { mean: 62.38, sd: 20.18 },
      errorsB: { mean: 17.17, sd: 7.92 },
      timeBA: { mean: 45.77, sd: 21.20 }
    },
    '9-11': {
      timeA: { mean: 16.36, sd: 7.05 },
      timeB: { mean: 44.88, sd: 21.50 },
      errorsB: { mean: 9.60, sd: 6.10 },
      timeBA: { mean: 28.52, sd: 20.48 }
    },
    '12+': {
      timeA: { mean: 14.88, sd: 4.58 },
      timeB: { mean: 39.11, sd: 18.22 },
      errorsB: { mean: 10.46, sd: 5.97 },
      timeBA: { mean: 24.23, sd: 17.37 }
    }
  },
  '60-75': {
    '5-8': {
      timeA: { mean: 16.65, sd: 4.96 },
      timeB: { mean: 48.98, sd: 18.85 },
      errorsB: { mean: 16.42, sd: 7.27 },
      timeBA: { mean: 32.33, sd: 17.16 }
    },
    '9-11': {
      timeA: { mean: 18.14, sd: 5.00 },
      timeB: { mean: 48.33, sd: 15.06 },
      errorsB: { mean: 13.58, sd: 5.55 },
      timeBA: { mean: 30.19, sd: 15.24 }
    },
    '12+': {
      timeA: { mean: 16.64, sd: 4.89 },
      timeB: { mean: 50.35, sd: 18.07 },
      errorsB: { mean: 12.78, sd: 6.95 },
      timeBA: { mean: 33.70, sd: 17.92 }
    }
  }
};

export const HAYLING_EDUCATION_LEVELS: { value: HaylingEducationLevel; label: string }[] = [
  { value: '5-8', label: 'Fundamental (5-8 anos)' },
  { value: '9-11', label: 'Médio (9-11 anos)' },
  { value: '12+', label: 'Superior (12+ anos)' }
];

/**
 * Determina o grupo de idade para o Hayling
 */
export const getHaylingAgeGroup = (age: number): HaylingAgeGroup | null => {
  if (age >= 19 && age <= 39) return '19-39';
  if (age >= 40 && age <= 59) return '40-59';
  if (age >= 60 && age <= 75) return '60-75';
  return null;
};

/**
 * Verifica se a idade está válida para o teste
 */
export const isAgeValidForHayling = (age: number): boolean => {
  return age >= 19 && age <= 75;
};

/**
 * Converte Z-score para percentil usando aproximação da distribuição normal
 * Para medidas onde menor é melhor (tempo, erros), invertemos
 */
export const zScoreToPercentileInverted = (z: number): number => {
  // Para tempo/erros, z negativo significa melhor desempenho (abaixo da média = mais rápido/menos erros)
  // Invertemos o z-score para que menor tempo/erros resulte em maior percentil
  const invertedZ = -z;
  
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = invertedZ < 0 ? -1 : 1;
  const absZ = Math.abs(invertedZ) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

  const cdf = 0.5 * (1.0 + sign * y);
  
  return Math.round(cdf * 100);
};

/**
 * Retorna a classificação baseada no percentil
 */
export const getHaylingClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

/**
 * Retorna a cor CSS baseada na classificação
 */
export const getHaylingClassificationColor = (classification: string): string => {
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
 * Calcula os resultados do teste Hayling
 */
export const calculateHaylingResults = (
  age: number,
  educationLevel: HaylingEducationLevel,
  tempoA: number,
  tempoB: number,
  errosB: number
): HaylingResults | null => {
  const ageGroup = getHaylingAgeGroup(age);
  if (!ageGroup) return null;

  const norms = HAYLING_NORMS[ageGroup][educationLevel];
  if (!norms) return null;

  // Calcular Inibição B-A
  const inibiçãoBA = tempoB - tempoA;

  // Calcular Z-scores (para tempo/erros, menor é melhor)
  const zTempoA = (tempoA - norms.timeA.mean) / norms.timeA.sd;
  const zTempoB = (tempoB - norms.timeB.mean) / norms.timeB.sd;
  const zErrosB = (errosB - norms.errorsB.mean) / norms.errorsB.sd;
  const zInibiçãoBA = (inibiçãoBA - norms.timeBA.mean) / norms.timeBA.sd;

  // Converter para percentis (invertido porque menor é melhor)
  const percentileTempoA = zScoreToPercentileInverted(zTempoA);
  const percentileTempoB = zScoreToPercentileInverted(zTempoB);
  const percentileErrosB = zScoreToPercentileInverted(zErrosB);
  const percentileInibiçãoBA = zScoreToPercentileInverted(zInibiçãoBA);

  return {
    rawScores: {
      tempoA,
      tempoB,
      errosB
    },
    calculatedScores: {
      inibiçãoBA
    },
    percentiles: {
      tempoA: percentileTempoA,
      tempoB: percentileTempoB,
      errosB: percentileErrosB,
      inibiçãoBA: percentileInibiçãoBA
    },
    classifications: {
      tempoA: getHaylingClassification(percentileTempoA),
      tempoB: getHaylingClassification(percentileTempoB),
      errosB: getHaylingClassification(percentileErrosB),
      inibiçãoBA: getHaylingClassification(percentileInibiçãoBA)
    },
    educationLevel
  };
};
