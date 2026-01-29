/**
 * Definição do Teste de Nomeação de Boston - Versão Brasileira (BNT-BR)
 * Avalia o processo de nomeação (percepção visual, memória semântica e linguagem)
 * Versão de 30 itens
 * Faixa etária: 6-99 anos
 */

import { NeuroTestDefinition } from './bpa2';

export const BNTBR_TEST: NeuroTestDefinition = {
  code: 'BNTBR',
  name: 'BNT-BR',
  fullName: 'Teste de Nomeação de Boston - Versão Brasileira (30 itens)',
  description: 'Avalia o processo de nomeação envolvendo percepção visual, memória semântica e linguagem em pessoas de 6 a 99 anos.',
  minAge: 6,
  maxAge: 99,
  subtests: [
    {
      code: 'ACERTOS',
      name: 'Total de Acertos',
      fields: ['acertos'],
      formula: 'Total de acertos (0-30)'
    }
  ],
  calculatedScores: [
    {
      code: 'PONTUACAO',
      name: 'Pontuação',
      formula: 'Total de Acertos'
    },
    {
      code: 'PERCENTIL',
      name: 'Percentil',
      formula: 'Z-score = (Acertos - Média) / DP, convertido para percentil'
    }
  ]
};

/**
 * Classificação baseada no Percentil
 * percentil <= 5: Inferior
 * percentil 6-25: Média Inferior
 * percentil 26-74: Média
 * percentil 75-94: Média Superior
 * percentil >= 95: Superior
 */
export const getBNTBRClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

/**
 * Retorna cor CSS para a classificação
 */
export const getBNTBRClassificationColor = (classification: string): string => {
  switch (classification) {
    case 'Superior':
      return 'text-green-600 dark:text-green-400';
    case 'Média Superior':
      return 'text-blue-600 dark:text-blue-400';
    case 'Média':
      return 'text-gray-600 dark:text-gray-400';
    case 'Média Inferior':
      return 'text-orange-600 dark:text-orange-400';
    case 'Inferior':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export interface BNTBRResults {
  rawScores: {
    acertos: number;
  };
  calculatedScores: {
    pontuacao: number;
    zScore: number;
    percentil: number;
  };
  classifications: {
    classificacao: string;
  };
  notes?: string;
}
