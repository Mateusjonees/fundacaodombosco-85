/**
 * Definição do Teste de Trilhas: Partes A e B
 * Avalia atenção, velocidade de processamento e flexibilidade cognitiva
 * Faixa etária: 6-14 anos
 */

import { NeuroTestDefinition } from './bpa2';

export const TRILHAS_TEST: NeuroTestDefinition = {
  code: 'TRILHAS',
  name: 'Trilhas A e B',
  fullName: 'Teste de Trilhas: Partes A e B',
  description: 'Avalia atenção, velocidade de processamento e flexibilidade cognitiva em crianças e adolescentes de 6 a 14 anos.',
  minAge: 6,
  maxAge: 14,
  subtests: [
    {
      code: 'SEQ_A',
      name: 'Sequências A',
      fields: ['sequenciasA'],
      formula: 'Total de sequências na Parte A (letras e números)'
    },
    {
      code: 'SEQ_B',
      name: 'Sequências B',
      fields: ['sequenciasB'],
      formula: 'Total de sequências na Parte B (alternância)'
    }
  ],
  calculatedScores: [
    {
      code: 'EP_A',
      name: 'Escore Padrão A',
      formula: 'Consulta na tabela normativa por idade'
    },
    {
      code: 'EP_B',
      name: 'Escore Padrão B',
      formula: 'Consulta na tabela normativa por idade'
    },
    {
      code: 'EP_BA',
      name: 'Escore Padrão B-A',
      formula: 'Consulta na tabela normativa por idade para diferença B-A'
    }
  ]
};

/**
 * Classificação baseada no Escore Padrão
 * Fórmula: pontuação-padrão = ([PONTUAÇÃO - média]/desvio-padrão) * 15 + 100
 */
export const getTrilhasClassification = (standardScore: number): string => {
  if (standardScore < 70) return 'Muito Baixa';
  if (standardScore >= 70 && standardScore <= 84) return 'Baixa';
  if (standardScore >= 85 && standardScore <= 114) return 'Média';
  if (standardScore >= 115 && standardScore <= 129) return 'Alta';
  if (standardScore >= 130) return 'Muito Alta';
  return 'Não classificado';
};

/**
 * Retorna cor CSS para a classificação
 */
export const getTrilhasClassificationColor = (classification: string): string => {
  switch (classification) {
    case 'Muito Alta':
      return 'text-green-600 dark:text-green-400';
    case 'Alta':
      return 'text-blue-600 dark:text-blue-400';
    case 'Média':
      return 'text-gray-600 dark:text-gray-400';
    case 'Baixa':
      return 'text-orange-600 dark:text-orange-400';
    case 'Muito Baixa':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};
