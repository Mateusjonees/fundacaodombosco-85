/**
 * Cubos de Corsi - Memória de trabalho visuoespacial
 * Faixa etária: 6-89 anos
 * Referência: Kessels et al. (2000) - Normas brasileiras
 * 
 * Percentis estimados baseados em dados normativos:
 * - Span Direto: média ~5 (DP ~1.1)
 * - Span Inverso: média ~4.5 (DP ~1.1)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface CorsiResults {
  rawScores: { spanDireto: number; spanInverso: number };
  percentiles: { spanDireto: number; spanInverso: number };
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

/**
 * Percentil estimado para Corsi - Span Direto
 * Baseado em normas: média ~5, DP ~1.1
 */
export const getCorsiDirectPercentile = (span: number): number => {
  if (span >= 9) return 99;
  if (span === 8) return 98;
  if (span === 7) return 93;
  if (span === 6) return 80;
  if (span === 5) return 50;
  if (span === 4) return 25;
  if (span === 3) return 10;
  if (span === 2) return 3;
  return 1;
};

/**
 * Percentil estimado para Corsi - Span Inverso
 * Baseado em normas: média ~4.5, DP ~1.1
 */
export const getCorsiInversePercentile = (span: number): number => {
  if (span >= 8) return 99;
  if (span === 7) return 97;
  if (span === 6) return 90;
  if (span === 5) return 70;
  if (span === 4) return 40;
  if (span === 3) return 15;
  if (span === 2) return 5;
  return 1;
};

export const calculateCorsiResults = (spanDireto: number, spanInverso: number): CorsiResults => {
  const classD = getCorsiClassification(spanDireto, true);
  const classI = getCorsiClassification(spanInverso, false);
  const percD = getCorsiDirectPercentile(spanDireto);
  const percI = getCorsiInversePercentile(spanInverso);
  return {
    rawScores: { spanDireto, spanInverso },
    percentiles: { spanDireto: percD, spanInverso: percI },
    classifications: { spanDireto: classD, spanInverso: classI },
    notes: `Span Direto: ${spanDireto} (P${percD} - ${classD}) | Span Inverso: ${spanInverso} (P${percI} - ${classI})`
  };
};
