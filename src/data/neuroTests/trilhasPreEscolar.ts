/**
 * Teste de Trilhas Pré-Escolares (TT-P)
 * Faixa etária: 4-6 anos
 * 
 * Mede:
 * - Sequências A: Total de sequências corretas
 * - Sequências B: Total de sequências corretas
 * 
 * Escore padrão: média = 100, desvio-padrão = 15
 * 
 * Classificações:
 * - < 70: Muito Baixa
 * - 70-84: Baixa
 * - 85-114: Média
 * - 115-129: Alta
 * - >= 130: Muito Alta
 */

import { type NeuroTestDefinition } from './bpa2';

export interface TrilhasPreEscolarTestResult {
  sequenciasA: number;
  sequenciasB: number;
  standardScoreA: number | null;
  standardScoreB: number | null;
  classificationA: string;
  classificationB: string;
}

export const TRILHAS_PRE_ESCOLAR_TEST: NeuroTestDefinition = {
  code: 'TRILHAS_PRE_ESCOLAR',
  name: 'TT-P',
  fullName: 'Teste de Trilhas Pré-Escolares',
  description: 'Avalia atenção e flexibilidade cognitiva em crianças pré-escolares (4-6 anos)',
  minAge: 4,
  maxAge: 6,
  subtests: [
    {
      code: 'SEQ_A',
      name: 'Sequências A',
      fields: ['sequenciasA'],
      formula: 'sequenciasA'
    },
    {
      code: 'SEQ_B',
      name: 'Sequências B',
      fields: ['sequenciasB'],
      formula: 'sequenciasB'
    },
  ],
  calculatedScores: [
    {
      code: 'EP_A',
      name: 'Escore Padrão A',
      formula: 'lookup(sequenciasA, idade)'
    },
    {
      code: 'EP_B',
      name: 'Escore Padrão B',
      formula: 'lookup(sequenciasB, idade)'
    },
  ],
};

/**
 * Retorna a classificação baseada no escore padrão
 */
export const getStandardScoreClassificationPreEscolar = (standardScore: number): string => {
  if (standardScore < 70) return 'Muito Baixa';
  if (standardScore <= 84) return 'Baixa';
  if (standardScore <= 114) return 'Média';
  if (standardScore <= 129) return 'Alta';
  return 'Muito Alta';
};

/**
 * Retorna a cor CSS baseada na classificação
 */
export const getClassificationColorPreEscolar = (classification: string): string => {
  switch (classification) {
    case 'Muito Baixa':
      return 'text-red-600 dark:text-red-400';
    case 'Baixa':
      return 'text-orange-600 dark:text-orange-400';
    case 'Média':
      return 'text-green-600 dark:text-green-400';
    case 'Alta':
      return 'text-blue-600 dark:text-blue-400';
    case 'Muito Alta':
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-muted-foreground';
  }
};

/**
 * Verifica se a idade está dentro da faixa do teste
 */
export const isAgeValidForTrilhasPreEscolar = (age: number): boolean => {
  return age >= 4 && age <= 6;
};
