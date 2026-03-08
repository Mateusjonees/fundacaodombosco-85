/**
 * Definição do Teste Stroop (Victoria Version / Teste de Cores e Palavras)
 * Avalia atenção seletiva, controle inibitório e velocidade de processamento
 * Faixa etária: 18-80 anos
 * 
 * Referência: Duncan (2006) - Normas brasileiras do Teste Stroop
 */

import type { NeuroTestDefinition } from './bpa2';

export interface StroopScores {
  cartao1Tempo: number;   // Cartão 1 - Nomeação de cores (segundos)
  cartao1Erros: number;   // Cartão 1 - Erros
  cartao2Tempo: number;   // Cartão 2 - Leitura de palavras coloridas (segundos)
  cartao2Erros: number;   // Cartão 2 - Erros
  cartao3Tempo: number;   // Cartão 3 - Interferência (segundos)
  cartao3Erros: number;   // Cartão 3 - Erros
}

export interface StroopResults {
  rawScores: StroopScores;
  calculatedScores: {
    interferencia: number; // Cartão 3 - Cartão 1
    razaoInterferencia: number; // Cartão 3 / Cartão 1
  };
  percentiles: {
    cartao1Tempo: number;
    cartao2Tempo: number;
    cartao3Tempo: number;
    interferencia: number;
  };
  classifications: {
    cartao1Tempo: string;
    cartao2Tempo: string;
    cartao3Tempo: string;
    interferencia: string;
  };
  ageGroup: string;
  notes: string;
}

export const STROOP_TEST: NeuroTestDefinition = {
  code: 'STROOP',
  name: 'Stroop',
  fullName: 'Teste Stroop de Cores e Palavras (Victoria)',
  description: 'Avalia atenção seletiva, controle inibitório e velocidade de processamento cognitivo.',
  minAge: 18,
  maxAge: 80,
  subtests: [
    { code: 'C1', name: 'Cartão 1 - Cores', fields: ['tempo', 'erros'], formula: 'Tempo em segundos' },
    { code: 'C2', name: 'Cartão 2 - Palavras', fields: ['tempo', 'erros'], formula: 'Tempo em segundos' },
    { code: 'C3', name: 'Cartão 3 - Interferência', fields: ['tempo', 'erros'], formula: 'Tempo em segundos' }
  ],
  calculatedScores: [
    { code: 'INTERF', name: 'Efeito Interferência', formula: 'Cartão 3 - Cartão 1' },
    { code: 'RAZAO', name: 'Razão de Interferência', formula: 'Cartão 3 / Cartão 1' }
  ]
};

/**
 * Dados normativos por faixa etária
 * Fonte: Duncan (2006) - Normas brasileiras
 * Tempos menores = melhor desempenho (percentil invertido)
 */
interface StroopAgeNorms {
  label: string;
  cartao1: { mean: number; sd: number };
  cartao2: { mean: number; sd: number };
  cartao3: { mean: number; sd: number };
  interferencia: { mean: number; sd: number };
}

const STROOP_NORMS: Record<string, StroopAgeNorms> = {
  '18-29': {
    label: '18-29 anos',
    cartao1: { mean: 14.0, sd: 3.0 },
    cartao2: { mean: 17.0, sd: 3.5 },
    cartao3: { mean: 25.0, sd: 6.0 },
    interferencia: { mean: 11.0, sd: 5.5 }
  },
  '30-39': {
    label: '30-39 anos',
    cartao1: { mean: 15.0, sd: 3.2 },
    cartao2: { mean: 18.0, sd: 3.8 },
    cartao3: { mean: 27.0, sd: 6.5 },
    interferencia: { mean: 12.0, sd: 5.8 }
  },
  '40-49': {
    label: '40-49 anos',
    cartao1: { mean: 16.5, sd: 3.5 },
    cartao2: { mean: 19.5, sd: 4.0 },
    cartao3: { mean: 30.0, sd: 7.5 },
    interferencia: { mean: 13.5, sd: 6.5 }
  },
  '50-59': {
    label: '50-59 anos',
    cartao1: { mean: 18.0, sd: 4.0 },
    cartao2: { mean: 21.5, sd: 4.5 },
    cartao3: { mean: 34.0, sd: 9.0 },
    interferencia: { mean: 16.0, sd: 7.5 }
  },
  '60-69': {
    label: '60-69 anos',
    cartao1: { mean: 20.5, sd: 5.0 },
    cartao2: { mean: 24.0, sd: 5.5 },
    cartao3: { mean: 40.0, sd: 12.0 },
    interferencia: { mean: 19.5, sd: 9.0 }
  },
  '70-80': {
    label: '70-80 anos',
    cartao1: { mean: 24.0, sd: 6.5 },
    cartao2: { mean: 28.0, sd: 7.0 },
    cartao3: { mean: 50.0, sd: 16.0 },
    interferencia: { mean: 26.0, sd: 12.0 }
  }
};

export const getStroopAgeGroup = (age: number): string | null => {
  if (age >= 18 && age <= 29) return '18-29';
  if (age >= 30 && age <= 39) return '30-39';
  if (age >= 40 && age <= 49) return '40-49';
  if (age >= 50 && age <= 59) return '50-59';
  if (age >= 60 && age <= 69) return '60-69';
  if (age >= 70 && age <= 80) return '70-80';
  return null;
};

export const isAgeValidForStroop = (age: number): boolean => {
  return age >= 18 && age <= 80;
};

/**
 * Converte Z-score para percentil (invertido: menor tempo = melhor)
 */
const zScoreToPercentileInverted = (z: number): number => {
  // Para tempos, z negativo = rápido = bom, então invertemos
  return zScoreToPercentile(-z);
};

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

export const getStroopClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

export const calculateStroopResults = (scores: StroopScores, age: number): StroopResults | null => {
  if (!isAgeValidForStroop(age)) return null;

  const ageGroup = getStroopAgeGroup(age);
  if (!ageGroup) return null;

  const norms = STROOP_NORMS[ageGroup];
  const interferencia = scores.cartao3Tempo - scores.cartao1Tempo;
  const razaoInterferencia = scores.cartao1Tempo > 0 ? Math.round((scores.cartao3Tempo / scores.cartao1Tempo) * 100) / 100 : 0;

  // Z-scores (para tempos: valor maior = pior, então z positivo = abaixo da média)
  const zC1 = (scores.cartao1Tempo - norms.cartao1.mean) / norms.cartao1.sd;
  const zC2 = (scores.cartao2Tempo - norms.cartao2.mean) / norms.cartao2.sd;
  const zC3 = (scores.cartao3Tempo - norms.cartao3.mean) / norms.cartao3.sd;
  const zInterf = (interferencia - norms.interferencia.mean) / norms.interferencia.sd;

  // Percentis invertidos (tempo menor = percentil maior)
  const percC1 = zScoreToPercentileInverted(zC1);
  const percC2 = zScoreToPercentileInverted(zC2);
  const percC3 = zScoreToPercentileInverted(zC3);
  const percInterf = zScoreToPercentileInverted(zInterf);

  return {
    rawScores: scores,
    calculatedScores: { interferencia, razaoInterferencia },
    percentiles: {
      cartao1Tempo: percC1,
      cartao2Tempo: percC2,
      cartao3Tempo: percC3,
      interferencia: percInterf
    },
    classifications: {
      cartao1Tempo: getStroopClassification(percC1),
      cartao2Tempo: getStroopClassification(percC2),
      cartao3Tempo: getStroopClassification(percC3),
      interferencia: getStroopClassification(percInterf)
    },
    ageGroup: norms.label,
    notes: ''
  };
};
