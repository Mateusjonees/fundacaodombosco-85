/**
 * M-CHAT-R/F - Modified Checklist for Autism in Toddlers
 * Rastreamento de TEA em crianças de 16-30 meses
 * Faixa etária: 1-3 anos
 * Referência: Robins et al. (2014) - Adaptação brasileira Losapio & Pondé (2008)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface MCHATResults {
  rawScores: { totalScore: number; criticalItems: number };
  classifications: { totalScore: string };
  riskLevel: string;
  notes: string;
}

export const MCHAT_TEST: NeuroTestDefinition = {
  code: 'MCHAT',
  name: 'M-CHAT-R/F (Autismo)',
  fullName: 'M-CHAT-R/F - Rastreamento de TEA',
  description: 'Rastreamento de Transtorno do Espectro Autista em crianças de 16-30 meses. 20 itens sim/não.',
  minAge: 1,
  maxAge: 3,
  subtests: [
    { code: 'TOTAL', name: 'Escore Total', fields: ['total'], formula: 'Total de respostas de risco (0-20)' }
  ],
  calculatedScores: [
    { code: 'RISK', name: 'Nível de Risco', formula: '0-2: Baixo | 3-7: Médio | 8-20: Alto' }
  ]
};

export const getMCHATClassification = (score: number): string => {
  if (score <= 2) return 'Baixo Risco';
  if (score <= 7) return 'Risco Médio';
  return 'Alto Risco';
};

export const calculateMCHATResults = (totalScore: number, criticalItems: number = 0): MCHATResults => {
  const classification = getMCHATClassification(totalScore);
  return {
    rawScores: { totalScore, criticalItems },
    classifications: { totalScore: classification },
    riskLevel: classification,
    notes: `Escore: ${totalScore}/20 | Itens críticos: ${criticalItems} | Risco: ${classification}`
  };
};
