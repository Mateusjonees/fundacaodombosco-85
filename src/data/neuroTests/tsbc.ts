/**
 * Definição da Tarefa Span de Blocos - Corsi (TSBC)
 * Avalia memória de trabalho visuoespacial
 * Faixa etária: 4-10 anos
 */

import { NeuroTestDefinition } from './bpa2';

export const TSBC_TEST: NeuroTestDefinition = {
  code: 'TSBC',
  name: 'TSBC',
  fullName: 'Tarefa Span de Blocos - Corsi',
  description: 'Avalia memória de trabalho visuoespacial em crianças de 4 a 10 anos.',
  minAge: 4,
  maxAge: 10,
  subtests: [
    {
      code: 'OD',
      name: 'Ordem Direta',
      fields: ['ordemDireta'],
      formula: 'Total de acertos na ordem direta'
    },
    {
      code: 'OI',
      name: 'Ordem Inversa',
      fields: ['ordemInversa'],
      formula: 'Total de acertos na ordem inversa'
    }
  ],
  calculatedScores: [
    {
      code: 'EP_OD',
      name: 'Escore Padrão (OD)',
      formula: 'Consulta na tabela normativa por idade e tipo de escola'
    },
    {
      code: 'EP_OI',
      name: 'Escore Padrão (OI)',
      formula: 'Consulta na tabela normativa por idade e tipo de escola'
    }
  ]
};

/**
 * Classificação baseada no Escore Padrão
 */
export const getTSBCClassification = (standardScore: number): string => {
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
export const getTSBCClassificationColor = (classification: string): string => {
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

export type TSBCSchoolType = 'publica' | 'privada';

export interface TSBCResults {
  rawScores: {
    ordemDireta: number;
    ordemInversa: number;
    schoolType: TSBCSchoolType;
  };
  calculatedScores: {
    escorePadraoOD: number;
    escorePadraoOI: number;
  };
  classifications: {
    classificacaoOD: string;
    classificacaoOI: string;
  };
  notes?: string;
}
