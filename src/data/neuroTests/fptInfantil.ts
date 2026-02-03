/**
 * Definição do Teste FPT Infantil (Five-Point Test - Versão Infantil)
 * Avalia fluência figural através da produção de desenhos únicos
 * Estratificado por ano escolar (não idade!)
 * 
 * Referência: Tucha et al. (2012) - The Five-Point Test: Reliability, Validity and 
 * Normative Data for Children and Adults. PLoS ONE 7(9): e46080.
 */

import type { NeuroTestDefinition } from './bpa2';

// Anos escolares suportados pelo teste
export type SchoolYear = '8-9' | '10-11' | '12-13' | '14-15';

export const SCHOOL_YEAR_OPTIONS: { value: SchoolYear; label: string }[] = [
  { value: '8-9', label: '1º e 2º ano (8-9 anos)' },
  { value: '10-11', label: '3º e 4º ano (10-11 anos)' },
  { value: '12-13', label: '5º e 6º ano (12-13 anos)' },
  { value: '14-15', label: '7º ao 9º ano (14-15 anos)' }
];

export interface FPTInfantilResults {
  schoolYear: SchoolYear;
  rawScore: number;
  percentile: number | null;
  classification: string;
}

export const FPT_INFANTIL_TEST: NeuroTestDefinition = {
  code: 'FPT_INFANTIL',
  name: 'FPT (Infantil)',
  fullName: 'Five-Point Test - Versão Infantil',
  description: 'Avalia fluência figural através da produção de desenhos únicos. Estratificado por ano escolar.',
  minAge: 8,
  maxAge: 15,
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
 * Tabela de percentis para crianças (período de 2 minutos)
 * Extraída da Tabela 7 do artigo
 * Estrutura: [rawScore][schoolYear] = percentile
 */
const FPT_INFANTIL_PERCENTILES: Record<number, Partial<Record<SchoolYear, number>>> = {
  // Raw Score: percentis por ano escolar [8-9, 10-11, 12-13, 14-15]
  5: { '8-9': 10 },
  6: { '8-9': 10 },
  7: { '8-9': 19, '10-11': 2, '12-13': 3 },
  8: { '8-9': 26, '10-11': 3, '12-13': 5 },
  9: { '8-9': 36, '10-11': 8, '12-13': 10 },
  10: { '8-9': 40, '10-11': 12, '12-13': 10 },
  11: { '8-9': 44, '10-11': 14, '12-13': 4 },
  12: { '8-9': 49, '10-11': 21, '12-13': 13, '14-15': 6 },
  13: { '8-9': 55, '10-11': 23, '12-13': 15, '14-15': 8 },
  14: { '8-9': 64, '10-11': 20, '12-13': 10 },
  15: { '8-9': 71, '10-11': 29, '12-13': 23 },
  16: { '8-9': 78, '10-11': 37, '12-13': 12 },
  17: { '8-9': 78, '10-11': 43, '12-13': 25, '14-15': 18 },
  18: { '8-9': 79, '10-11': 46, '12-13': 30, '14-15': 18 },
  19: { '8-9': 83, '10-11': 49, '12-13': 36, '14-15': 24 },
  20: { '8-9': 83, '10-11': 51, '12-13': 38, '14-15': 26 },
  21: { '8-9': 88, '10-11': 57, '12-13': 50, '14-15': 28 },
  22: { '8-9': 90, '10-11': 62, '12-13': 53, '14-15': 31 },
  23: { '8-9': 94, '10-11': 70, '12-13': 61, '14-15': 37 },
  24: { '8-9': 90, '10-11': 72, '12-13': 39 },
  25: { '8-9': 92, '10-11': 75, '12-13': 66 },
  26: { '8-9': 98, '10-11': 67, '12-13': 43 },
  27: { '10-11': 72, '12-13': 51 },
  28: { '10-11': 79, '12-13': 77 },
  29: { '10-11': 85, '12-13': 85, '14-15': 57 },
  30: { '10-11': 91, '12-13': 63 },
  31: { '10-11': 88, '12-13': 69 },
  32: { '10-11': 92, '12-13': 90, '14-15': 73 },
  33: { '10-11': 95, '12-13': 80 },
  34: { '12-13': 86 },
  35: { '10-11': 97, '12-13': 88 },
  36: { '10-11': 99, '12-13': 93 },
  37: { '12-13': 94 },
  38: { '12-13': 98 },
  40: { '12-13': 98 }
};

/**
 * Busca o percentil para uma pontuação bruta e ano escolar
 */
export const lookupFPTInfantilPercentile = (rawScore: number, schoolYear: SchoolYear): number | null => {
  // Se a pontuação for muito baixa, retornar o menor percentil
  if (rawScore < 5) {
    return 1;
  }
  
  // Buscar o percentil exato ou o mais próximo inferior
  let percentile: number | null = null;
  
  for (let score = rawScore; score >= 5; score--) {
    if (FPT_INFANTIL_PERCENTILES[score]?.[schoolYear] !== undefined) {
      percentile = FPT_INFANTIL_PERCENTILES[score][schoolYear]!;
      break;
    }
  }
  
  // Se ainda não encontrou, verificar se é maior que o máximo
  if (percentile === null && rawScore > 40) {
    // Para scores muito altos, retornar 99
    return 99;
  }
  
  return percentile;
};

/**
 * Retorna a classificação baseada no percentil
 * percentil < 10 - Inferior
 * percentil 10-25 - Média Inferior
 * percentil 26-74 - Média
 * percentil 75-90 - Média Superior
 * percentil > 90 - Superior
 */
export const getFPTInfantilClassification = (percentile: number | null): string => {
  if (percentile === null) return 'Não disponível';
  
  if (percentile < 10) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 90) return 'Média Superior';
  return 'Superior';
};

/**
 * Calcula os resultados do FPT Infantil
 */
export const calculateFPTInfantilResults = (
  rawScore: number,
  schoolYear: SchoolYear
): FPTInfantilResults => {
  const percentile = lookupFPTInfantilPercentile(rawScore, schoolYear);
  const classification = getFPTInfantilClassification(percentile);
  
  return {
    schoolYear,
    rawScore,
    percentile,
    classification
  };
};

/**
 * Verifica se a idade é válida para o teste FPT Infantil
 */
export const isAgeValidForFPTInfantil = (age: number): boolean => {
  return age >= 8 && age <= 15;
};
