/**
 * Definição do Teste Infantil de Nomeação (TIN)
 * Avalia vocabulário expressivo e nomeação em crianças
 * Faixa etária: 3-14 anos
 */

import { NeuroTestDefinition } from './bpa2';

export const TIN_TEST: NeuroTestDefinition = {
  code: 'TIN',
  name: 'TIN',
  fullName: 'Teste Infantil de Nomeação',
  description: 'Avalia vocabulário expressivo e capacidade de nomeação em crianças de 3 a 14 anos.',
  minAge: 3,
  maxAge: 14,
  subtests: [
    {
      code: 'ACERTOS',
      name: 'Total de Acertos',
      fields: ['acertos'],
      formula: 'Número total de itens nomeados corretamente (0-60)'
    }
  ],
  calculatedScores: [
    {
      code: 'EP',
      name: 'Escore Padrão',
      formula: 'Consulta na tabela normativa por idade'
    }
  ]
};

/**
 * Classificação baseada no Escore Padrão
 */
export const getTINClassification = (standardScore: number): string => {
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
export const getTINClassificationColor = (classification: string): string => {
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
