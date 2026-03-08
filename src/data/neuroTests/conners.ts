/**
 * Conners 3 - Escala de Avaliação de TDAH
 * Questionário para pais/professores
 * Faixa etária: 6-18 anos
 * Referência: Conners (2008) - Adaptação brasileira
 */

import type { NeuroTestDefinition } from './bpa2';

export interface ConnersResults {
  rawScores: Record<string, number>;
  classifications: Record<string, string>;
  notes: string;
}

export const CONNERS_TEST: NeuroTestDefinition = {
  code: 'CONNERS',
  name: 'Conners 3',
  fullName: 'Escala Conners 3 - Avaliação TDAH',
  description: 'Avalia sintomas de TDAH e comorbidades via questionário pais/professores. Escores T (M=50, DP=10).',
  minAge: 6,
  maxAge: 18,
  subtests: [
    { code: 'DES', name: 'Desatenção', fields: ['desatencao'], formula: 'Escore T' },
    { code: 'HIP', name: 'Hiperatividade/Impulsividade', fields: ['hiperatividade'], formula: 'Escore T' },
    { code: 'PRO', name: 'Problemas de Aprendizagem', fields: ['aprendizagem'], formula: 'Escore T' },
    { code: 'FEX', name: 'Funções Executivas', fields: ['funcoesExecutivas'], formula: 'Escore T' },
    { code: 'AGR', name: 'Agressividade', fields: ['agressividade'], formula: 'Escore T' },
    { code: 'REL', name: 'Relações com Pares', fields: ['relacoesPares'], formula: 'Escore T' }
  ],
  calculatedScores: [
    { code: 'TDAH', name: 'Índice TDAH', formula: 'Índice global de TDAH (Escore T)' }
  ]
};

export const getConnersClassification = (tScore: number): string => {
  if (tScore < 60) return 'Normal';
  if (tScore < 65) return 'Levemente Atípico';
  if (tScore < 70) return 'Moderadamente Atípico';
  return 'Marcadamente Atípico';
};

export const calculateConnersResults = (scores: {
  desatencao: number;
  hiperatividade: number;
  aprendizagem: number;
  funcoesExecutivas: number;
  agressividade: number;
  relacoesPares: number;
  indiceTDAH: number;
}): ConnersResults => {
  const rawScores: Record<string, number> = {
    desatencao: scores.desatencao,
    hiperatividade: scores.hiperatividade,
    aprendizagem: scores.aprendizagem,
    funcoesExecutivas: scores.funcoesExecutivas,
    agressividade: scores.agressividade,
    relacoesPares: scores.relacoesPares,
    indiceTDAH: scores.indiceTDAH
  };

  const classifications: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawScores)) {
    classifications[key] = getConnersClassification(value);
  }

  return {
    rawScores,
    classifications,
    notes: `Desatenção T=${scores.desatencao} (${classifications.desatencao}) | Hiperatividade T=${scores.hiperatividade} (${classifications.hiperatividade}) | Índice TDAH T=${scores.indiceTDAH} (${classifications.indiceTDAH})`
  };
};
