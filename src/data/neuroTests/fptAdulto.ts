/**
 * Definição do Teste FPT Adulto (Five-Point Test - Versão Adulto)
 * Avalia fluência figural através da produção de desenhos únicos
 * Estratificado por faixa etária (período de 2 minutos)
 * 
 * Referência: Tucha et al. (2012) - The Five-Point Test: Reliability, Validity and 
 * Normative Data for Children and Adults. PLoS ONE 7(9): e46080.
 */

import type { NeuroTestDefinition } from './bpa2';

// Faixas etárias suportadas pelo teste
export type FPTAdultoAgeGroup = '20-29' | '30-39' | '40-49' | '50-59' | '60-69' | '70+';

export const AGE_GROUP_OPTIONS: { value: FPTAdultoAgeGroup; label: string }[] = [
  { value: '20-29', label: '20-29 anos' },
  { value: '30-39', label: '30-39 anos' },
  { value: '40-49', label: '40-49 anos' },
  { value: '50-59', label: '50-59 anos' },
  { value: '60-69', label: '60-69 anos' },
  { value: '70+', label: '70+ anos' }
];

export interface FPTAdultoResults {
  ageGroup: FPTAdultoAgeGroup;
  rawScore: number;
  percentile: number | null;
  classification: string;
}

export const FPT_ADULTO_TEST: NeuroTestDefinition = {
  code: 'FPT_ADULTO',
  name: 'FPT (Adulto)',
  fullName: 'Five-Point Test - Versão Adulto',
  description: 'Avalia fluência figural através da produção de desenhos únicos. Período de 2 minutos.',
  minAge: 20,
  maxAge: 99,
  subtests: [
    {
      code: 'UNIQUE',
      name: 'Desenhos Únicos',
      fields: ['total'],
      formula: 'Total de desenhos não repetidos (2 minutos)'
    }
  ],
  calculatedScores: []
};

/**
 * Tabela de percentis para adultos (período de 2 minutos)
 * Extraída da Tabela 5 do artigo (coluna "Two – minute period")
 * Estrutura: [rawScore][ageGroup] = percentile
 */
const FPT_ADULTO_PERCENTILES: Record<number, Partial<Record<FPTAdultoAgeGroup, number>>> = {
  // Raw Score: percentis por faixa etária [20-29, 30-39, 40-49, 50-59, 60-69, 70+]
  12: { '70+': 6 },
  13: { '70+': 8 },
  14: { '60-69': 10 },
  15: { '60-69': 12, '70+': 18 },
  16: { '60-69': 16, '70+': 18 },
  17: { '60-69': 18, '70+': 24 },
  18: { '60-69': 18, '70+': 26 },
  19: { '60-69': 24 },
  20: { '50-59': 27, '60-69': 28, '70+': 55 },
  21: { '50-59': 31, '60-69': 31, '70+': 57 },
  22: { '50-59': 33, '60-69': 37, '70+': 60 },
  23: { '40-49': 41, '50-59': 50, '60-69': 62, '70+': 99 },
  24: { '40-49': 50, '50-59': 56, '60-69': 68 },
  25: { '40-49': 56, '50-59': 60, '60-69': 72 },
  26: { '40-49': 60, '50-59': 60, '60-69': 82, '70+': 98 },
  27: { '40-49': 60, '50-59': 62, '60-69': 85 },
  28: { '40-49': 62, '50-59': 68, '60-69': 87 },
  29: { '30-39': 57, '40-49': 68, '50-59': 74, '60-69': 90 },
  30: { '30-39': 62, '40-49': 74, '50-59': 76, '60-69': 90 },
  31: { '30-39': 70, '40-49': 76, '50-59': 81 },
  32: { '30-39': 75, '40-49': 81, '50-59': 86, '60-69': 95 },
  33: { '30-39': 78, '40-49': 86, '50-59': 88 },
  34: { '30-39': 81, '40-49': 88 },
  35: { '30-39': 87, '40-49': 91 },
  36: { '30-39': 88, '40-49': 93, '50-59': 95, '60-69': 98 },
  37: { '30-39': 92, '40-49': 96 },
  38: { '30-39': 93, '40-49': 97 },
  39: { '30-39': 98 },
  40: { '20-29': 89, '30-39': 95 },
  41: { '20-29': 96 },
  42: { '20-29': 92, '30-39': 98 },
  43: { '20-29': 94, '30-39': 99, '40-49': 99 },
  44: { '20-29': 96 },
  45: { '20-29': 98 },
  46: { '20-29': 98 },
  47: { '20-29': 97 },
  50: { '20-29': 99 },
  51: { '40-49': 98 },
  52: { '40-49': 99 }
};

/**
 * Determina a faixa etária do adulto
 */
export const getAgeGroupForFPTAdulto = (age: number): FPTAdultoAgeGroup | null => {
  if (age < 20) return null;
  if (age <= 29) return '20-29';
  if (age <= 39) return '30-39';
  if (age <= 49) return '40-49';
  if (age <= 59) return '50-59';
  if (age <= 69) return '60-69';
  return '70+';
};

/**
 * Busca o percentil para uma pontuação bruta e faixa etária
 */
export const lookupFPTAdultoPercentile = (rawScore: number, ageGroup: FPTAdultoAgeGroup): number | null => {
  // Se a pontuação for muito baixa, retornar o menor percentil
  if (rawScore < 12) {
    return 1;
  }
  
  // Buscar o percentil exato ou o mais próximo inferior
  let percentile: number | null = null;
  
  for (let score = rawScore; score >= 12; score--) {
    if (FPT_ADULTO_PERCENTILES[score]?.[ageGroup] !== undefined) {
      percentile = FPT_ADULTO_PERCENTILES[score][ageGroup]!;
      break;
    }
  }
  
  // Se ainda não encontrou, verificar se é maior que o máximo
  if (percentile === null && rawScore > 52) {
    return 99;
  }
  
  return percentile;
};

/**
 * Retorna a classificação baseada no percentil
 * percentil <= 5 - Inferior
 * percentil 6-25 - Média Inferior
 * percentil 26-74 - Média
 * percentil 75-94 - Média Superior
 * percentil >= 95 - Superior
 */
export const getFPTAdultoClassification = (percentile: number | null): string => {
  if (percentile === null) return 'Não disponível';
  
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

/**
 * Calcula os resultados do FPT Adulto
 */
export const calculateFPTAdultoResults = (
  rawScore: number,
  ageGroup: FPTAdultoAgeGroup
): FPTAdultoResults => {
  const percentile = lookupFPTAdultoPercentile(rawScore, ageGroup);
  const classification = getFPTAdultoClassification(percentile);
  
  return {
    ageGroup,
    rawScore,
    percentile,
    classification
  };
};

/**
 * Verifica se a idade é válida para o teste FPT Adulto
 */
export const isAgeValidForFPTAdulto = (age: number): boolean => {
  return age >= 20 && age <= 99;
};
