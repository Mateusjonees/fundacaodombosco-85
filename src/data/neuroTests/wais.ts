/**
 * Definição dos Testes Wechsler de Inteligência (WAIS-III / WISC-V)
 * Calcula classificações a partir dos Índices já obtidos
 * WAIS: 16-89 anos | WISC: 6-16 anos
 * 
 * Os índices são calculados pelo próprio manual Wechsler a partir dos subtestes.
 * Este módulo recebe os índices compostos já calculados e fornece classificações.
 * 
 * Referência: Wechsler (2014) - WISC-V; Wechsler (2008) - WAIS-III/IV
 */

import type { NeuroTestDefinition } from './bpa2';

export interface WechslerScores {
  qiTotal: number;        // QI Total (Escala Completa)
  icv?: number;           // Índice de Compreensão Verbal
  iop?: number;           // Índice de Organização Perceptual / Visuoespacial
  imo?: number;           // Índice de Memória Operacional
  ivp?: number;           // Índice de Velocidade de Processamento
  irf?: number;           // Índice de Raciocínio Fluido (WISC-V)
}

export interface WechslerResults {
  rawScores: WechslerScores;
  classifications: {
    qiTotal: string;
    icv?: string;
    iop?: string;
    imo?: string;
    ivp?: string;
    irf?: string;
  };
  percentiles: {
    qiTotal: number;
    icv?: number;
    iop?: number;
    imo?: number;
    ivp?: number;
    irf?: number;
  };
  testVersion: string;
  notes: string;
}

export const WECHSLER_TEST: NeuroTestDefinition = {
  code: 'WECHSLER',
  name: 'Wechsler (WAIS/WISC)',
  fullName: 'Escalas Wechsler de Inteligência (WAIS-III/IV e WISC-V)',
  description: 'Avalia inteligência geral e índices cognitivos: compreensão verbal, organização perceptual, memória operacional e velocidade de processamento.',
  minAge: 6,
  maxAge: 89,
  subtests: [
    { code: 'QIT', name: 'QI Total', fields: ['pontuacao'], formula: 'Índice composto (M=100, DP=15)' },
    { code: 'ICV', name: 'Compreensão Verbal', fields: ['pontuacao'], formula: 'Índice composto' },
    { code: 'IOP', name: 'Org. Perceptual / Visuoespacial', fields: ['pontuacao'], formula: 'Índice composto' },
    { code: 'IMO', name: 'Memória Operacional', fields: ['pontuacao'], formula: 'Índice composto' },
    { code: 'IVP', name: 'Velocidade de Processamento', fields: ['pontuacao'], formula: 'Índice composto' }
  ],
  calculatedScores: [
    { code: 'CLASS', name: 'Classificação', formula: 'Baseada na escala QI (M=100, DP=15)' }
  ]
};

/**
 * Classificação Wechsler padrão (M=100, DP=15)
 * Baseada no manual oficial
 */
export const getWechslerClassification = (score: number): string => {
  if (score >= 130) return 'Muito Superior';
  if (score >= 120) return 'Superior';
  if (score >= 110) return 'Média Superior';
  if (score >= 90) return 'Média';
  if (score >= 80) return 'Média Inferior';
  if (score >= 70) return 'Limítrofe';
  return 'Extremamente Baixo';
};

/**
 * Converte índice QI para percentil aproximado
 * QI segue distribuição normal com M=100, DP=15
 */
const qiToPercentile = (qi: number): number => {
  const z = (qi - 100) / 15;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);
  return Math.round(0.5 * (1.0 + sign * y) * 100);
};

export const isAgeValidForWechsler = (age: number): boolean => {
  return age >= 6 && age <= 89;
};

/**
 * Determina a versão do teste baseada na idade
 */
export const getWechslerVersion = (age: number): string => {
  if (age >= 6 && age <= 16) return 'WISC-V';
  return 'WAIS-III/IV';
};

/**
 * Calcula resultados completos
 */
export const calculateWechslerResults = (scores: WechslerScores, age: number): WechslerResults | null => {
  if (!isAgeValidForWechsler(age)) return null;

  const testVersion = getWechslerVersion(age);

  const classifications: WechslerResults['classifications'] = {
    qiTotal: getWechslerClassification(scores.qiTotal)
  };
  const percentiles: WechslerResults['percentiles'] = {
    qiTotal: qiToPercentile(scores.qiTotal)
  };

  if (scores.icv !== undefined && scores.icv > 0) {
    classifications.icv = getWechslerClassification(scores.icv);
    percentiles.icv = qiToPercentile(scores.icv);
  }
  if (scores.iop !== undefined && scores.iop > 0) {
    classifications.iop = getWechslerClassification(scores.iop);
    percentiles.iop = qiToPercentile(scores.iop);
  }
  if (scores.imo !== undefined && scores.imo > 0) {
    classifications.imo = getWechslerClassification(scores.imo);
    percentiles.imo = qiToPercentile(scores.imo);
  }
  if (scores.ivp !== undefined && scores.ivp > 0) {
    classifications.ivp = getWechslerClassification(scores.ivp);
    percentiles.ivp = qiToPercentile(scores.ivp);
  }
  if (scores.irf !== undefined && scores.irf > 0) {
    classifications.irf = getWechslerClassification(scores.irf);
    percentiles.irf = qiToPercentile(scores.irf);
  }

  return {
    rawScores: scores,
    classifications,
    percentiles,
    testVersion,
    notes: ''
  };
};
