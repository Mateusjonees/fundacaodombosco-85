/**
 * Definição do Teste RAVLT (Rey Auditory Verbal Learning Test)
 * Avalia memória verbal: aprendizagem, evocação e reconhecimento
 * Faixa etária: 6-81+ anos
 */

import type { NeuroTestDefinition } from './bpa2';

export interface RAVLTScores {
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  b1: number;
  a6: number;
  a7: number;
  rec: number; // Reconhecimento antes de subtrair 35
}

export interface RAVLTCalculatedScores {
  reconhecimento: number;         // REC - 35
  escoreTotal: number;            // A1 + A2 + A3 + A4 + A5
  alt: number;                    // Escore Total - (5 x A1)
  velocidadeEsquecimento: number; // A7 / A6
  interferenciaProativa: number;  // B1 / A1
  interferenciaRetroativa: number; // A6 / A5
}

export interface RAVLTResults {
  rawScores: RAVLTScores;
  calculatedScores: RAVLTCalculatedScores;
  percentiles: {
    a1: number;
    a2: number;
    a3: number;
    a4: number;
    a5: number;
    b1: number;
    a6: number;
    a7: number;
    escoreTotal: number;
    reconhecimento: number;
  };
  percentileRanges?: {
    a1: string;
    a2: string;
    a3: string;
    a4: string;
    a5: string;
    b1: string;
    a6: string;
    a7: string;
    escoreTotal: string;
    reconhecimento: string;
  };
  classifications: {
    a1: string;
    a2: string;
    a3: string;
    a4: string;
    a5: string;
    b1: string;
    a6: string;
    a7: string;
    escoreTotal: string;
    reconhecimento: string;
  };
  notes: string;
}

export const RAVLT_TEST: NeuroTestDefinition = {
  code: 'RAVLT',
  name: 'RAVLT',
  fullName: 'Teste de Aprendizagem Auditivo-Verbal de Rey',
  description: 'Avalia memória verbal: aprendizagem, evocação imediata e tardia, e reconhecimento.',
  minAge: 6,
  maxAge: 81,
  subtests: [
    { code: 'A1', name: 'A1', fields: ['palavras'], formula: 'total de palavras' },
    { code: 'A2', name: 'A2', fields: ['palavras'], formula: 'total de palavras' },
    { code: 'A3', name: 'A3', fields: ['palavras'], formula: 'total de palavras' },
    { code: 'A4', name: 'A4', fields: ['palavras'], formula: 'total de palavras' },
    { code: 'A5', name: 'A5', fields: ['palavras'], formula: 'total de palavras' },
    { code: 'B1', name: 'B1', fields: ['palavras'], formula: 'lista distratora' },
    { code: 'A6', name: 'A6', fields: ['palavras'], formula: 'evocação imediata' },
    { code: 'A7', name: 'A7', fields: ['palavras'], formula: 'evocação tardia' },
    { code: 'REC', name: 'Reconhecimento', fields: ['palavras'], formula: 'total antes de -35' }
  ],
  calculatedScores: [
    { code: 'RECON', name: 'Reconhecimento', formula: 'REC - 35' },
    { code: 'ET', name: 'Escore Total', formula: 'A1 + A2 + A3 + A4 + A5' },
    { code: 'ALT', name: 'ALT', formula: 'Escore Total - (5 × A1)' },
    { code: 'VE', name: 'Vel. Esquecimento', formula: 'A7 / A6' },
    { code: 'IP', name: 'Int. Proativa', formula: 'B1 / A1' },
    { code: 'IR', name: 'Int. Retroativa', formula: 'A6 / A5' }
  ]
};

/**
 * Calcula o Reconhecimento
 */
export const calculateReconhecimento = (rec: number): number => {
  return rec - 35;
};

/**
 * Calcula o Escore Total (soma de A1 a A5)
 */
export const calculateEscoreTotal = (a1: number, a2: number, a3: number, a4: number, a5: number): number => {
  return a1 + a2 + a3 + a4 + a5;
};

/**
 * Calcula o ALT (Aprendizagem ao Longo das Tentativas)
 */
export const calculateALT = (escoreTotal: number, a1: number): number => {
  return escoreTotal - (5 * a1);
};

/**
 * Calcula a Velocidade de Esquecimento
 */
export const calculateVelocidadeEsquecimento = (a7: number, a6: number): number => {
  if (a6 === 0) return 0;
  return Number((a7 / a6).toFixed(2));
};

/**
 * Calcula a Interferência Proativa
 */
export const calculateInterferenciaProativa = (b1: number, a1: number): number => {
  if (a1 === 0) return 0;
  return Number((b1 / a1).toFixed(2));
};

/**
 * Calcula a Interferência Retroativa
 */
export const calculateInterferenciaRetroativa = (a6: number, a5: number): number => {
  if (a5 === 0) return 0;
  return Number((a6 / a5).toFixed(2));
};

/**
 * Sistema de Classificação por Percentil (numérico)
 * 
 * <5 = Inferior
 * 5 = Inferior
 * 5-25 = Médio Inferior
 * 25 = Médio Inferior
 * 25-50 = Médio
 * 50 = Médio
 * 50-75 = Médio
 * 75 = Médio Superior
 * 75-95 = Médio Superior
 * 95 = Superior
 * >95 = Superior
 */
export const getRAVLTClassification = (percentile: number): string => {
  if (percentile < 5) return 'Inferior';
  if (percentile === 5) return 'Inferior';
  if (percentile > 5 && percentile < 25) return 'Médio Inferior';
  if (percentile === 25) return 'Médio Inferior';
  if (percentile > 25 && percentile < 75) return 'Médio';
  if (percentile === 75) return 'Médio';
  if (percentile > 75 && percentile < 95) return 'Médio Superior';
  if (percentile === 95) return 'Superior';
  if (percentile > 95) return 'Superior';
  return 'Médio';
};
