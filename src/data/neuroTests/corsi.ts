/**
 * Cubos de Corsi - Memória de trabalho visuoespacial
 * Faixa etária: 6-89 anos
 * Referência: Kessels et al. (2000) - Normas brasileiras
 */

import type { NeuroTestDefinition } from './bpa2';

export interface CorsiResults {
  rawScores: { spanDireto: number; spanInverso: number };
  classifications: { spanDireto: string; spanInverso: string };
  notes: string;
}

export const CORSI_TEST: NeuroTestDefinition = {
  code: 'CORSI',
  name: 'Cubos de Corsi',
  fullName: 'Teste de Blocos de Corsi',
  description: 'Avalia memória de trabalho visuoespacial. Span direto (armazenamento) e inverso (manipulação).',
  minAge: 6,
  maxAge: 89,
  subtests: [
    { code: 'SD', name: 'Span Direto', fields: ['spanDireto'], formula: 'Maior sequência correta (ordem direta)' },
    { code: 'SI', name: 'Span Inverso', fields: ['spanInverso'], formula: 'Maior sequência correta (ordem inversa)' }
  ],
  calculatedScores: []
};

// Classificação por span (normas gerais)
export const getCorsiClassification = (span: number, isDirect: boolean): string => {
  if (isDirect) {
    if (span >= 7) return 'Superior';
    if (span >= 6) return 'Média Superior';
    if (span >= 5) return 'Média';
    if (span >= 4) return 'Média Inferior';
    if (span >= 3) return 'Limítrofe';
    return 'Deficitário';
  } else {
    if (span >= 7) return 'Superior';
    if (span >= 6) return 'Média Superior';
    if (span >= 5) return 'Média';
    if (span >= 4) return 'Média Inferior';
    if (span >= 3) return 'Limítrofe';
    return 'Deficitário';
  }
};

export const calculateCorsiResults = (spanDireto: number, spanInverso: number): CorsiResults => {
  const classD = getCorsiClassification(spanDireto, true);
  const classI = getCorsiClassification(spanInverso, false);
  return {
    rawScores: { spanDireto, spanInverso },
    classifications: { spanDireto: classD, spanInverso: classI },
    notes: `Span Direto: ${spanDireto} (${classD}) | Span Inverso: ${spanInverso} (${classI})`
  };
};
