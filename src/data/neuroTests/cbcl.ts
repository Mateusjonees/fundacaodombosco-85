/**
 * CBCL - Child Behavior Checklist
 * Perfil comportamental/emocional amplo
 * Faixa etária: 6-18 anos
 * Referência: Achenbach & Rescorla (2001) - Adaptação brasileira Bordin et al. (2013)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface CBCLResults {
  rawScores: Record<string, number>;
  classifications: Record<string, string>;
  notes: string;
}

export const CBCL_TEST: NeuroTestDefinition = {
  code: 'CBCL',
  name: 'CBCL',
  fullName: 'CBCL - Child Behavior Checklist',
  description: 'Avalia problemas comportamentais e emocionais. Escalas de internalização e externalização. Escores T (M=50, DP=10).',
  minAge: 6,
  maxAge: 18,
  subtests: [
    { code: 'INT', name: 'Internalização', fields: ['internalizacao'], formula: 'Escore T' },
    { code: 'EXT', name: 'Externalização', fields: ['externalizacao'], formula: 'Escore T' },
    { code: 'TOT', name: 'Total de Problemas', fields: ['totalProblemas'], formula: 'Escore T' }
  ],
  calculatedScores: []
};

export const getCBCLClassification = (tScore: number): string => {
  if (tScore < 60) return 'Normal';
  if (tScore < 64) return 'Limítrofe';
  return 'Clínico';
};

export const calculateCBCLResults = (scores: {
  internalizacao: number;
  externalizacao: number;
  totalProblemas: number;
}): CBCLResults => {
  const rawScores = { ...scores };
  const classifications: Record<string, string> = {
    internalizacao: getCBCLClassification(scores.internalizacao),
    externalizacao: getCBCLClassification(scores.externalizacao),
    totalProblemas: getCBCLClassification(scores.totalProblemas)
  };
  return {
    rawScores,
    classifications,
    notes: `Internalização T=${scores.internalizacao} (${classifications.internalizacao}) | Externalização T=${scores.externalizacao} (${classifications.externalizacao}) | Total T=${scores.totalProblemas} (${classifications.totalProblemas})`
  };
};
