/**
 * SDQ - Strengths and Difficulties Questionnaire
 * Rastreamento de dificuldades emocionais/comportamentais
 * Faixa etária: 4-17 anos
 * Referência: Goodman (1997) - Adaptação brasileira Fleitlich et al. (2000)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface SDQResults {
  rawScores: Record<string, number>;
  classifications: Record<string, string>;
  notes: string;
}

export const SDQ_TEST: NeuroTestDefinition = {
  code: 'SDQ',
  name: 'SDQ',
  fullName: 'SDQ - Questionário de Capacidades e Dificuldades',
  description: 'Rastreamento breve: sintomas emocionais, problemas de conduta, hiperatividade, problemas com pares e comportamento pró-social.',
  minAge: 4,
  maxAge: 17,
  subtests: [
    { code: 'EMO', name: 'Sintomas Emocionais', fields: ['sintomasEmocionais'], formula: '0-10' },
    { code: 'CON', name: 'Problemas de Conduta', fields: ['problemasConduta'], formula: '0-10' },
    { code: 'HIP', name: 'Hiperatividade', fields: ['hiperatividade'], formula: '0-10' },
    { code: 'PAR', name: 'Problemas com Pares', fields: ['problemasPares'], formula: '0-10' },
    { code: 'PRO', name: 'Comportamento Pró-social', fields: ['proSocial'], formula: '0-10' }
  ],
  calculatedScores: [
    { code: 'TOT', name: 'Total de Dificuldades', formula: 'Soma das 4 escalas (sem pró-social), 0-40' }
  ]
};

export const getSDQClassification = (subscale: string, score: number): string => {
  const cutoffs: Record<string, [number, number]> = {
    sintomasEmocionais: [4, 5],
    problemasConduta: [3, 4],
    hiperatividade: [6, 7],
    problemasPares: [3, 4],
    proSocial: [5, 4], // invertido: menor = pior
    totalDificuldades: [14, 17]
  };
  const [borderline, clinical] = cutoffs[subscale] || [14, 17];
  if (subscale === 'proSocial') {
    if (score >= borderline) return 'Normal';
    if (score >= clinical) return 'Limítrofe';
    return 'Anormal';
  }
  if (score < borderline) return 'Normal';
  if (score < clinical) return 'Limítrofe';
  return 'Anormal';
};

export const calculateSDQResults = (scores: {
  sintomasEmocionais: number;
  problemasConduta: number;
  hiperatividade: number;
  problemasPares: number;
  proSocial: number;
}): SDQResults => {
  const totalDificuldades = scores.sintomasEmocionais + scores.problemasConduta + scores.hiperatividade + scores.problemasPares;
  const rawScores = { ...scores, totalDificuldades };
  const classifications: Record<string, string> = {};
  for (const key of Object.keys(rawScores)) {
    classifications[key] = getSDQClassification(key, rawScores[key]);
  }
  return {
    rawScores,
    classifications,
    notes: `Total Dificuldades: ${totalDificuldades}/40 (${classifications.totalDificuldades}) | Pró-social: ${scores.proSocial}/10 (${classifications.proSocial})`
  };
};
