/**
 * GDS - Escala de Depressão Geriátrica
 * Faixa etária: 60+ anos
 * Referência: Yesavage et al. (1982) - Adaptação brasileira Almeida & Almeida (1999)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface GDSResults {
  rawScores: { totalScore: number; version: string };
  classifications: { totalScore: string };
  severity: string;
  notes: string;
}

export const GDS_TEST: NeuroTestDefinition = {
  code: 'GDS',
  name: 'GDS (Depressão Geriátrica)',
  fullName: 'Escala de Depressão Geriátrica',
  description: 'Rastreamento de depressão em idosos. Versões de 15 ou 30 itens.',
  minAge: 60,
  maxAge: 120,
  subtests: [
    { code: 'TOTAL', name: 'Escore Total', fields: ['total'], formula: 'Contagem de respostas indicativas' }
  ],
  calculatedScores: [
    { code: 'CLASS', name: 'Classificação', formula: 'Classificação por faixa de corte' }
  ]
};

export const getGDSClassification15 = (score: number): string => {
  if (score <= 5) return 'Normal';
  if (score <= 10) return 'Depressão Leve';
  return 'Depressão Grave';
};

export const getGDSClassification30 = (score: number): string => {
  if (score <= 10) return 'Normal';
  if (score <= 20) return 'Depressão Leve';
  return 'Depressão Grave';
};

export const calculateGDSResults = (totalScore: number, version: '15' | '30'): GDSResults => {
  const classification = version === '15' ? getGDSClassification15(totalScore) : getGDSClassification30(totalScore);
  const maxScore = version === '15' ? 15 : 30;
  return {
    rawScores: { totalScore, version },
    classifications: { totalScore: classification },
    severity: classification,
    notes: `GDS-${version}: ${totalScore}/${maxScore} | ${classification}`
  };
};
