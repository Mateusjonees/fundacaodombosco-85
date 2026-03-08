/**
 * Definição do Teste Wisconsin de Classificação de Cartas (WCST)
 * Avalia funções executivas: flexibilidade cognitiva, formação de conceitos, 
 * capacidade de mudar estratégias e perseveração
 * Faixa etária: 6-89 anos
 * 
 * Referência: Heaton et al. (1993) - Manual do WCST; Cunha et al. (2005) - Normas brasileiras
 */

import type { NeuroTestDefinition } from './bpa2';

export interface WCSTScores {
  totalErrors: number;           // Total de erros
  perseverativeResponses: number; // Respostas perseverativas
  perseverativeErrors: number;    // Erros perseverativos
  nonPerseverativeErrors: number; // Erros não-perseverativos
  categoriesCompleted: number;    // Categorias completadas (0-6)
  trialsToFirst: number;         // Tentativas para completar 1ª categoria
  failureToMaintain: number;     // Falha em manter o set
  totalTrials: number;           // Total de tentativas administradas (máx 128)
}

export interface WCSTResults {
  rawScores: WCSTScores;
  calculatedScores: {
    percentCorrect: number;
    percentPerseverativeErrors: number;
  };
  percentiles: {
    totalErrors: number;
    perseverativeResponses: number;
    perseverativeErrors: number;
    nonPerseverativeErrors: number;
    categoriesCompleted: number;
  };
  classifications: {
    totalErrors: string;
    perseverativeResponses: string;
    perseverativeErrors: string;
    nonPerseverativeErrors: string;
    categoriesCompleted: string;
  };
  ageGroup: string;
  notes: string;
}

export const WCST_TEST: NeuroTestDefinition = {
  code: 'WCST',
  name: 'Wisconsin (WCST)',
  fullName: 'Teste Wisconsin de Classificação de Cartas (WCST)',
  description: 'Avalia funções executivas: flexibilidade cognitiva, formação de conceitos e capacidade de mudar estratégias.',
  minAge: 6,
  maxAge: 89,
  subtests: [
    { code: 'TE', name: 'Total de Erros', fields: ['erros'], formula: 'Contagem de erros' },
    { code: 'RP', name: 'Respostas Perseverativas', fields: ['respostas'], formula: 'Contagem' },
    { code: 'EP', name: 'Erros Perseverativos', fields: ['erros'], formula: 'Contagem' },
    { code: 'CC', name: 'Categorias Completadas', fields: ['categorias'], formula: '0-6 categorias' }
  ],
  calculatedScores: [
    { code: 'PC', name: '% Acertos', formula: '(Total - Erros) / Total × 100' },
    { code: 'PPE', name: '% Erros Perseverativos', formula: 'Erros Persev. / Total × 100' }
  ]
};

/**
 * Normas por faixa etária
 * Para erros e perseveração: valor menor = melhor (percentil invertido)
 * Para categorias: valor maior = melhor (percentil direto)
 */
interface WCSTAgeNorms {
  label: string;
  totalErrors: { mean: number; sd: number };
  perseverativeResponses: { mean: number; sd: number };
  perseverativeErrors: { mean: number; sd: number };
  nonPerseverativeErrors: { mean: number; sd: number };
  categoriesCompleted: { mean: number; sd: number };
}

const WCST_NORMS: Record<string, WCSTAgeNorms> = {
  '6-8': {
    label: '6-8 anos',
    totalErrors: { mean: 50.0, sd: 18.0 },
    perseverativeResponses: { mean: 30.0, sd: 15.0 },
    perseverativeErrors: { mean: 25.0, sd: 12.0 },
    nonPerseverativeErrors: { mean: 25.0, sd: 10.0 },
    categoriesCompleted: { mean: 3.0, sd: 1.8 }
  },
  '9-11': {
    label: '9-11 anos',
    totalErrors: { mean: 38.0, sd: 16.0 },
    perseverativeResponses: { mean: 22.0, sd: 12.0 },
    perseverativeErrors: { mean: 18.0, sd: 10.0 },
    nonPerseverativeErrors: { mean: 20.0, sd: 9.0 },
    categoriesCompleted: { mean: 4.0, sd: 1.6 }
  },
  '12-15': {
    label: '12-15 anos',
    totalErrors: { mean: 30.0, sd: 14.0 },
    perseverativeResponses: { mean: 17.0, sd: 10.0 },
    perseverativeErrors: { mean: 14.0, sd: 8.0 },
    nonPerseverativeErrors: { mean: 16.0, sd: 8.0 },
    categoriesCompleted: { mean: 5.0, sd: 1.3 }
  },
  '16-19': {
    label: '16-19 anos',
    totalErrors: { mean: 26.0, sd: 13.0 },
    perseverativeResponses: { mean: 14.0, sd: 9.0 },
    perseverativeErrors: { mean: 12.0, sd: 7.0 },
    nonPerseverativeErrors: { mean: 14.0, sd: 7.5 },
    categoriesCompleted: { mean: 5.5, sd: 1.0 }
  },
  '20-29': {
    label: '20-29 anos',
    totalErrors: { mean: 24.0, sd: 12.0 },
    perseverativeResponses: { mean: 13.0, sd: 8.5 },
    perseverativeErrors: { mean: 11.0, sd: 7.0 },
    nonPerseverativeErrors: { mean: 13.0, sd: 7.0 },
    categoriesCompleted: { mean: 5.5, sd: 1.0 }
  },
  '30-39': {
    label: '30-39 anos',
    totalErrors: { mean: 26.0, sd: 13.0 },
    perseverativeResponses: { mean: 14.0, sd: 9.0 },
    perseverativeErrors: { mean: 12.0, sd: 7.5 },
    nonPerseverativeErrors: { mean: 14.0, sd: 7.5 },
    categoriesCompleted: { mean: 5.3, sd: 1.2 }
  },
  '40-49': {
    label: '40-49 anos',
    totalErrors: { mean: 28.0, sd: 14.0 },
    perseverativeResponses: { mean: 16.0, sd: 10.0 },
    perseverativeErrors: { mean: 13.0, sd: 8.0 },
    nonPerseverativeErrors: { mean: 15.0, sd: 8.0 },
    categoriesCompleted: { mean: 5.0, sd: 1.3 }
  },
  '50-59': {
    label: '50-59 anos',
    totalErrors: { mean: 32.0, sd: 16.0 },
    perseverativeResponses: { mean: 19.0, sd: 11.0 },
    perseverativeErrors: { mean: 16.0, sd: 9.0 },
    nonPerseverativeErrors: { mean: 16.0, sd: 9.0 },
    categoriesCompleted: { mean: 4.5, sd: 1.5 }
  },
  '60-69': {
    label: '60-69 anos',
    totalErrors: { mean: 38.0, sd: 18.0 },
    perseverativeResponses: { mean: 24.0, sd: 13.0 },
    perseverativeErrors: { mean: 20.0, sd: 11.0 },
    nonPerseverativeErrors: { mean: 18.0, sd: 9.5 },
    categoriesCompleted: { mean: 4.0, sd: 1.7 }
  },
  '70-89': {
    label: '70-89 anos',
    totalErrors: { mean: 45.0, sd: 20.0 },
    perseverativeResponses: { mean: 30.0, sd: 15.0 },
    perseverativeErrors: { mean: 25.0, sd: 12.0 },
    nonPerseverativeErrors: { mean: 20.0, sd: 10.0 },
    categoriesCompleted: { mean: 3.2, sd: 1.8 }
  }
};

export const getWCSTAgeGroup = (age: number): string | null => {
  if (age >= 6 && age <= 8) return '6-8';
  if (age >= 9 && age <= 11) return '9-11';
  if (age >= 12 && age <= 15) return '12-15';
  if (age >= 16 && age <= 19) return '16-19';
  if (age >= 20 && age <= 29) return '20-29';
  if (age >= 30 && age <= 39) return '30-39';
  if (age >= 40 && age <= 49) return '40-49';
  if (age >= 50 && age <= 59) return '50-59';
  if (age >= 60 && age <= 69) return '60-69';
  if (age >= 70 && age <= 89) return '70-89';
  return null;
};

export const isAgeValidForWCST = (age: number): boolean => {
  return age >= 6 && age <= 89;
};

const zScoreToPercentile = (z: number): number => {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);
  return Math.round(0.5 * (1.0 + sign * y) * 100);
};

export const getWCSTClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 10) return 'Abaixo da Média';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

export const calculateWCSTResults = (scores: WCSTScores, age: number): WCSTResults | null => {
  if (!isAgeValidForWCST(age)) return null;

  const ageGroup = getWCSTAgeGroup(age);
  if (!ageGroup) return null;

  const norms = WCST_NORMS[ageGroup];
  const totalTrials = scores.totalTrials || 128;

  const percentCorrect = Math.round(((totalTrials - scores.totalErrors) / totalTrials) * 100);
  const percentPerseverativeErrors = Math.round((scores.perseverativeErrors / totalTrials) * 100);

  // Para erros: z positivo = mais erros = pior → percentil invertido
  const zTE = (scores.totalErrors - norms.totalErrors.mean) / norms.totalErrors.sd;
  const zRP = (scores.perseverativeResponses - norms.perseverativeResponses.mean) / norms.perseverativeResponses.sd;
  const zEP = (scores.perseverativeErrors - norms.perseverativeErrors.mean) / norms.perseverativeErrors.sd;
  const zNPE = (scores.nonPerseverativeErrors - norms.nonPerseverativeErrors.mean) / norms.nonPerseverativeErrors.sd;
  // Para categorias: z positivo = mais categorias = melhor → percentil direto
  const zCC = (scores.categoriesCompleted - norms.categoriesCompleted.mean) / norms.categoriesCompleted.sd;

  return {
    rawScores: scores,
    calculatedScores: { percentCorrect, percentPerseverativeErrors },
    percentiles: {
      totalErrors: zScoreToPercentile(-zTE),       // invertido
      perseverativeResponses: zScoreToPercentile(-zRP), // invertido
      perseverativeErrors: zScoreToPercentile(-zEP),    // invertido
      nonPerseverativeErrors: zScoreToPercentile(-zNPE), // invertido
      categoriesCompleted: zScoreToPercentile(zCC)       // direto
    },
    classifications: {
      totalErrors: getWCSTClassification(zScoreToPercentile(-zTE)),
      perseverativeResponses: getWCSTClassification(zScoreToPercentile(-zRP)),
      perseverativeErrors: getWCSTClassification(zScoreToPercentile(-zEP)),
      nonPerseverativeErrors: getWCSTClassification(zScoreToPercentile(-zNPE)),
      categoriesCompleted: getWCSTClassification(zScoreToPercentile(zCC))
    },
    ageGroup: norms.label,
    notes: ''
  };
};
