/**
 * SNAP-IV - Escala de Rastreamento de TDAH
 * Avalia sintomas de TDAH e TOD em crianças/adolescentes
 * Faixa etária: 6-18 anos
 * Referência: Swanson et al. (1983) - Adaptação brasileira Mattos et al. (2006)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface SNAPIVResults {
  rawScores: {
    desatencao: number;       // média itens 1-9
    hiperatividade: number;   // média itens 10-18
    tod: number;              // média itens 19-26
  };
  classifications: {
    desatencao: string;
    hiperatividade: string;
    tod: string;
  };
  notes: string;
}

export const SNAPIV_TEST: NeuroTestDefinition = {
  code: 'SNAPIV',
  name: 'SNAP-IV (TDAH)',
  fullName: 'SNAP-IV - Escala de Rastreamento de TDAH',
  description: 'Escala de rastreamento de sintomas de TDAH e TOD. 26 itens preenchidos por pais/professores.',
  minAge: 6,
  maxAge: 18,
  subtests: [
    { code: 'DESAT', name: 'Desatenção', fields: ['media'], formula: 'Média dos itens 1-9 (ponto de corte ≥ 1.78)' },
    { code: 'HIPER', name: 'Hiperatividade', fields: ['media'], formula: 'Média dos itens 10-18 (ponto de corte ≥ 1.78)' },
    { code: 'TOD', name: 'Oposição/Desafio', fields: ['media'], formula: 'Média dos itens 19-26 (ponto de corte ≥ 1.78)' }
  ],
  calculatedScores: [
    { code: 'CLASS', name: 'Indicativo', formula: 'Média ≥ 1.78 = Indicativo de sintomas' }
  ]
};

const CUTOFF = 1.78;

export const getSNAPIVClassification = (mean: number): string => {
  if (mean >= CUTOFF) return 'Indicativo';
  return 'Não indicativo';
};

export const calculateSNAPIVResults = (
  desatencaoMedia: number,
  hiperatividadeMedia: number,
  todMedia: number
): SNAPIVResults => {
  return {
    rawScores: {
      desatencao: Math.round(desatencaoMedia * 100) / 100,
      hiperatividade: Math.round(hiperatividadeMedia * 100) / 100,
      tod: Math.round(todMedia * 100) / 100
    },
    classifications: {
      desatencao: getSNAPIVClassification(desatencaoMedia),
      hiperatividade: getSNAPIVClassification(hiperatividadeMedia),
      tod: getSNAPIVClassification(todMedia)
    },
    notes: `Ponto de corte: ≥ ${CUTOFF} | Desatenção: ${desatencaoMedia.toFixed(2)} | Hiperatividade: ${hiperatividadeMedia.toFixed(2)} | TOD: ${todMedia.toFixed(2)}`
  };
};
