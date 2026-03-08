/**
 * ACE-III - Addenbrooke's Cognitive Examination III
 * Avaliação cognitiva breve
 * Faixa etária: 40-90 anos
 * Referência: Hsieh et al. (2013) - Adaptação brasileira Cesar et al. (2017)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface ACE3Results {
  rawScores: Record<string, number>;
  classifications: { totalScore: string };
  severity: string;
  notes: string;
}

export const ACE3_TEST: NeuroTestDefinition = {
  code: 'ACE3',
  name: 'ACE-III',
  fullName: "ACE-III - Addenbrooke's Cognitive Examination",
  description: 'Avaliação cognitiva breve: atenção (18), memória (26), fluência (14), linguagem (26), visuoespacial (16). Total: 0-100.',
  minAge: 40,
  maxAge: 90,
  subtests: [
    { code: 'ATN', name: 'Atenção', fields: ['atencao'], formula: '0-18' },
    { code: 'MEM', name: 'Memória', fields: ['memoria'], formula: '0-26' },
    { code: 'FLU', name: 'Fluência', fields: ['fluencia'], formula: '0-14' },
    { code: 'LIN', name: 'Linguagem', fields: ['linguagem'], formula: '0-26' },
    { code: 'VIS', name: 'Visuoespacial', fields: ['visuoespacial'], formula: '0-16' }
  ],
  calculatedScores: [
    { code: 'TOT', name: 'Escore Total', formula: 'Soma dos domínios (0-100)' }
  ]
};

export const getACE3Classification = (totalScore: number, educationYears: number): string => {
  // Pontos de corte brasileiros (Cesar et al., 2017)
  const cutoff = educationYears <= 4 ? 55 : educationYears <= 11 ? 70 : 78;
  if (totalScore >= cutoff) return 'Normal';
  if (totalScore >= cutoff - 10) return 'Possível Comprometimento';
  return 'Comprometimento Cognitivo';
};

export const calculateACE3Results = (scores: {
  atencao: number;
  memoria: number;
  fluencia: number;
  linguagem: number;
  visuoespacial: number;
  educationYears: number;
}): ACE3Results => {
  const total = scores.atencao + scores.memoria + scores.fluencia + scores.linguagem + scores.visuoespacial;
  const classification = getACE3Classification(total, scores.educationYears);
  return {
    rawScores: {
      atencao: scores.atencao,
      memoria: scores.memoria,
      fluencia: scores.fluencia,
      linguagem: scores.linguagem,
      visuoespacial: scores.visuoespacial,
      totalScore: total,
      educationYears: scores.educationYears
    },
    classifications: { totalScore: classification },
    severity: classification,
    notes: `Total: ${total}/100 | Atenção: ${scores.atencao}/18 | Memória: ${scores.memoria}/26 | Fluência: ${scores.fluencia}/14 | Linguagem: ${scores.linguagem}/26 | Visuoespacial: ${scores.visuoespacial}/16 | ${classification}`
  };
};
