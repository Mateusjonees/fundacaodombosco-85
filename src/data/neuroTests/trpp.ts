/**
 * Definição do Teste de Repetição de Palavras e Pseudopalavras (TRPP)
 * Avalia memória operacional fonológica em crianças
 * Faixa etária: 3-14 anos
 */

import { NeuroTestDefinition } from './bpa2';

export const TRPP_TEST: NeuroTestDefinition = {
  code: 'TRPP',
  name: 'TRPP',
  fullName: 'Teste de Repetição de Palavras e Pseudopalavras',
  description: 'Avalia memória operacional fonológica através da repetição de palavras e pseudopalavras em crianças de 3 a 14 anos.',
  minAge: 3,
  maxAge: 14,
  subtests: [
    {
      code: 'PALAVRAS',
      name: 'Repetição de Palavras',
      fields: ['palavras'],
      formula: 'Total de acertos na repetição de palavras (0-10)'
    },
    {
      code: 'PSEUDOPALAVRAS',
      name: 'Repetição de Pseudopalavras',
      fields: ['pseudopalavras'],
      formula: 'Total de acertos na repetição de pseudopalavras (0-10)'
    }
  ],
  calculatedScores: [
    {
      code: 'TOTAL',
      name: 'Pontuação Total',
      formula: 'Palavras + Pseudopalavras'
    },
    {
      code: 'EP',
      name: 'Escore Padrão',
      formula: 'Consulta na tabela normativa por idade'
    }
  ]
};

// Tabela normativa para pontuação TOTAL do TRPP (Tabela 9.2)
// Escore bruto -> [idade 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
const TRPP_TOTAL_NORMS: Record<number, (number | null)[]> = {
  1:  [83, 76, 70, 69, null, 65, 60, 58, 55, 44, 38, null],
  2:  [92, 84, 79, 76, 72, 71, 71, 67, 64, 61, 52, 46],
  3:  [102, 93, 88, 84, 81, 78, 78, 73, 71, 67, 59, 54],
  4:  [111, 102, 96, 92, 89, 86, 84, 80, 77, 73, 67, 62],
  5:  [120, 111, 105, 100, 98, 94, 90, 86, 84, 80, 74, 70],
  6:  [129, 119, 114, 108, 107, 101, 97, 93, 91, 86, 82, 77],
  7:  [138, 128, 123, 116, 116, 109, 103, 99, 97, 92, 89, 85],
  8:  [148, 137, 132, 123, 124, 116, 110, 106, 104, 98, 97, 93],
  9:  [157, 146, 140, 131, 133, 124, 116, 112, 110, 104, 104, 101],
  10: [166, 154, 149, 139, 142, 132, 123, 119, 117, 110, 112, 109],
  11: [175, 163, 158, 147, 150, 139, 129, 125, 123, 117, 119, 116],
  12: [184, 172, 167, 155, 159, 147, 135, 132, 130, 123, 127, 124],
  13: [194, 180, 175, 162, 168, 155, 142, 138, 136, 129, 134, 132],
  14: [203, 189, 184, 170, 177, 162, 148, 145, 143, 135, 142, 140],
  15: [212, 198, 193, 178, 185, 170, 155, 151, 149, 141, 149, 148],
  16: [221, 207, 202, 186, 194, 178, 161, 158, 156, 147, 157, 155],
  17: [231, 215, 210, 194, 203, 185, 168, 164, 163, 154, 164, 163],
  18: [240, 224, 219, 202, 212, 193, 174, 171, 169, 160, 172, 171],
  19: [249, 233, 228, 209, 220, 200, 180, 177, 176, 166, 179, 179],
  20: [258, 242, 237, 217, 229, 208, 187, 184, 182, 172, 187, 187],
};

export interface TRPPResults {
  rawScores: {
    palavras: number;
    pseudopalavras: number;
  };
  calculatedScores: {
    total: number;
    escorePadrao: number | null;
  };
  classifications: {
    total: string;
  };
  notes?: string;
}

/**
 * Converte idade para índice da tabela (0-11)
 */
const getAgeIndex = (age: number): number | null => {
  if (age < 3 || age > 14) return null;
  return age - 3;
};

/**
 * Consulta o Escore Padrão na tabela normativa para o TOTAL
 */
export const lookupTRPPStandardScore = (
  totalScore: number,
  age: number
): number | null => {
  const ageIndex = getAgeIndex(age);
  if (ageIndex === null) return null;
  
  const row = TRPP_TOTAL_NORMS[totalScore];
  if (!row) return null;
  
  return row[ageIndex];
};

/**
 * Classificação baseada no Escore Padrão
 */
export const getTRPPClassification = (standardScore: number | null): string => {
  if (standardScore === null) return 'Não disponível';
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
export const getTRPPClassificationColor = (classification: string): string => {
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

/**
 * Verifica se a idade é válida para o TRPP
 */
export const isAgeValidForTRPP = (age: number): boolean => {
  return age >= 3 && age <= 14;
};

/**
 * Calcula os resultados completos do TRPP
 */
export const calculateTRPPResults = (
  palavras: number,
  pseudopalavras: number,
  age: number
): TRPPResults => {
  const total = palavras + pseudopalavras;
  const escorePadrao = lookupTRPPStandardScore(total, age);
  const classification = getTRPPClassification(escorePadrao);

  return {
    rawScores: {
      palavras,
      pseudopalavras
    },
    calculatedScores: {
      total,
      escorePadrao
    },
    classifications: {
      total: classification
    }
  };
};
