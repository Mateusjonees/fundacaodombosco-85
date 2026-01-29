/**
 * Definição do Teste de Fluência Verbal Alternada (FVA)
 * Avalia fluência de palavras, memória semântica e flexibilidade cognitiva
 * Faixa etária: 7-70 anos
 */

import { NeuroTestDefinition } from './bpa2';

export const FVA_TEST: NeuroTestDefinition = {
  code: 'FVA',
  name: 'FVA',
  fullName: 'Fluência Verbal Alternada',
  description: 'Avalia fluência de palavras, acesso à memória semântica e flexibilidade cognitiva em pessoas de 7 a 70 anos.',
  minAge: 7,
  maxAge: 70,
  subtests: [
    {
      code: 'ANIMAIS',
      name: 'Animais',
      fields: ['animais'],
      formula: 'Total de acertos na categoria animais'
    },
    {
      code: 'FRUTAS',
      name: 'Frutas',
      fields: ['frutas'],
      formula: 'Total de acertos na categoria frutas'
    },
    {
      code: 'PARES',
      name: 'Pares (Alternada)',
      fields: ['pares'],
      formula: 'Total de pares corretos na alternância'
    }
  ],
  calculatedScores: [
    {
      code: 'PERC_ANIMAIS',
      name: 'Percentil Animais',
      formula: 'Consulta na tabela normativa por idade'
    },
    {
      code: 'PERC_FRUTAS',
      name: 'Percentil Frutas',
      formula: 'Consulta na tabela normativa por idade'
    },
    {
      code: 'PERC_PARES',
      name: 'Percentil Pares',
      formula: 'Consulta na tabela normativa por idade'
    }
  ]
};

/**
 * Classificação baseada no Percentil
 */
export const getFVAClassification = (percentile: string): string => {
  // Valores exatos
  if (percentile === '<5' || percentile === '5' || percentile === '<10' || percentile === '10') {
    return 'Inferior';
  }
  if (percentile === '5-25' || percentile === '10-25' || percentile === '25') {
    return 'Média Inferior';
  }
  if (percentile === '25-50' || percentile === '50' || percentile === '50-75') {
    return 'Média';
  }
  if (percentile === '75' || percentile === '75-90' || percentile === '75-95') {
    return 'Média Superior';
  }
  if (percentile === '90' || percentile === '95' || percentile === '>90' || percentile === '>95') {
    return 'Superior';
  }
  return 'Não classificado';
};

/**
 * Retorna cor CSS para a classificação
 */
export const getFVAClassificationColor = (classification: string): string => {
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

export interface FVAResults {
  rawScores: {
    animais: number;
    frutas: number;
    pares: number;
  };
  calculatedScores: {
    percentilAnimais: string;
    percentilFrutas: string;
    percentilPares: string;
  };
  classifications: {
    classificacaoAnimais: string;
    classificacaoFrutas: string;
    classificacaoPares: string;
  };
  notes?: string;
}
