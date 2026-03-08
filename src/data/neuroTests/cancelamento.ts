/**
 * Teste de Cancelamento (AC) - Atenção Concentrada
 * Faixa etária: 6-14 anos
 * Referência: Montiel & Seabra (2012) - Normas brasileiras
 */

import type { NeuroTestDefinition } from './bpa2';

export interface CancelamentoResults {
  rawScores: { acertos: number; erros: number; omissoes: number };
  calculatedScores: { totalLiquido: number };
  classifications: { totalLiquido: string };
  notes: string;
}

export const CANCELAMENTO_TEST: NeuroTestDefinition = {
  code: 'CANCELAMENTO',
  name: 'Teste de Cancelamento',
  fullName: 'Teste de Atenção por Cancelamento',
  description: 'Avalia atenção concentrada visual. Total líquido = acertos - (erros + omissões).',
  minAge: 6,
  maxAge: 14,
  subtests: [
    { code: 'ACE', name: 'Acertos', fields: ['acertos'], formula: 'Número de alvos marcados corretamente' },
    { code: 'ERR', name: 'Erros', fields: ['erros'], formula: 'Marcações incorretas (comissão)' },
    { code: 'OMI', name: 'Omissões', fields: ['omissoes'], formula: 'Alvos não marcados' }
  ],
  calculatedScores: [
    { code: 'TL', name: 'Total Líquido', formula: 'Acertos - (Erros + Omissões)' }
  ]
};

export const getCancelamentoClassification = (percentile: number): string => {
  if (percentile >= 75) return 'Superior';
  if (percentile >= 50) return 'Média';
  if (percentile >= 25) return 'Média Inferior';
  if (percentile >= 5) return 'Limítrofe';
  return 'Deficitário';
};

export const calculateCancelamentoResults = (
  acertos: number,
  erros: number,
  omissoes: number,
  classificacao: string
): CancelamentoResults => {
  const totalLiquido = acertos - (erros + omissoes);
  return {
    rawScores: { acertos, erros, omissoes },
    calculatedScores: { totalLiquido },
    classifications: { totalLiquido: classificacao },
    notes: `Acertos: ${acertos} | Erros: ${erros} | Omissões: ${omissoes} | Total Líquido: ${totalLiquido} | ${classificacao}`
  };
};
