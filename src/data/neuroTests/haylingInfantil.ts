/**
 * Hayling Infantil - Teste de Inibição Verbal (6-12 anos)
 * Referência: Siqueira et al. - Teste Hayling Infantil
 * 
 * Avalia componentes de iniciação (Parte A) e inibição (Parte B)
 * Normas estratificadas por idade (6-12 anos) e tipo de escola (Privada/Pública)
 */

import { NeuroTestDefinition } from './bpa2';

export const HAYLING_INFANTIL_TEST: NeuroTestDefinition = {
  code: 'HAYLING_INFANTIL',
  name: 'Hayling Infantil',
  fullName: 'Teste Hayling de Inibição Verbal - Versão Infantil',
  description: 'Avalia iniciação (Parte A) e inibição verbal (Parte B) em crianças de 6 a 12 anos',
  minAge: 6,
  maxAge: 12,
  subtests: [
    { code: 'parteATempo', name: 'Parte A - Tempo', fields: ['tempo'], formula: 'tempo' },
    { code: 'parteBTempo', name: 'Parte B - Tempo', fields: ['tempo'], formula: 'tempo' },
    { code: 'parteBErros', name: 'Parte B - Erros', fields: ['erros'], formula: 'erros' },
  ],
  calculatedScores: [
    { code: 'inibicaoBA', name: 'Inibição B-A', formula: 'parteBTempo - parteATempo' },
  ],
};

export type SchoolType = 'privada' | 'publica';
export type HaylingInfantilAge = 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface HaylingInfantilResults {
  parteATempo: { raw: number; percentile: number; classification: string };
  parteBTempo: { raw: number; percentile: number; classification: string };
  parteBErros: { raw: number; percentile: number; classification: string };
  inibicaoBA: { raw: number; percentile: number; classification: string };
  schoolType: SchoolType;
  age: number;
}

// Estrutura das tabelas normativas
// Percentis: [P95, P75, P50, P25, P5] (de melhor para pior desempenho em tempo)
interface NormData {
  parteATempo: number[];
  parteBTempo: number[];
  parteBErros: number[];
  diferencaTempos: number[];
}

// Tabelas normativas por idade e tipo de escola
const NORMS: Record<SchoolType, Record<HaylingInfantilAge, NormData>> = {
  privada: {
    6: { // Tabela 2
      parteATempo: [13, 19, 22, 27, 30],
      parteBTempo: [24, 36, 40, 55, 70],
      parteBErros: [1, 3, 4, 5, 8],
      diferencaTempos: [1, 12, 19, 29, 54],
    },
    7: { // Tabela 4
      parteATempo: [11, 13, 17, 20, 26],
      parteBTempo: [25, 35, 39, 43, 55],
      parteBErros: [1, 3, 4, 5, 6],
      diferencaTempos: [13, 15, 21, 26, 36],
    },
    8: { // Tabela 6
      parteATempo: [8, 10, 15, 19, 27],
      parteBTempo: [19, 32, 41, 44, 51],
      parteBErros: [1, 3, 5, 6, 7],
      diferencaTempos: [7, 16, 22, 30, 40],
    },
    9: { // Tabela 8
      parteATempo: [7, 11, 15, 18, 32],
      parteBTempo: [15, 27, 32, 42, 94],
      parteBErros: [1, 2, 4, 5, 8],
      diferencaTempos: [5, 13, 21, 27, 77],
    },
    10: { // Tabela 10
      parteATempo: [8, 12, 14, 15, 22],
      parteBTempo: [14, 24, 32, 34, 45],
      parteBErros: [1, 3, 4, 4, 7],
      diferencaTempos: [6, 12, 18, 21, 26],
    },
    11: { // Tabela 12
      parteATempo: [4, 8, 11, 14, 20],
      parteBTempo: [12, 20, 28, 32, 48],
      parteBErros: [1, 2, 4, 4, 6],
      diferencaTempos: [2, 14, 19, 21, 28],
    },
    12: { // Tabela 14
      parteATempo: [5, 9, 11, 13, 17],
      parteBTempo: [10, 23, 28, 33, 39],
      parteBErros: [1, 1, 3, 4, 7],
      diferencaTempos: [3, 14, 18, 21, 32],
    },
  },
  publica: {
    6: { // Tabela 3
      parteATempo: [19, 23, 31, 36, 41],
      parteBTempo: [37, 45, 54, 64, 109],
      parteBErros: [5, 6, 7, 8, 9],
      diferencaTempos: [5, 13, 20, 40, 90],
    },
    7: { // Tabela 5
      parteATempo: [9, 18, 21, 29, 52],
      parteBTempo: [29, 30, 36, 50, 105],
      parteBErros: [1, 5, 6, 7, 8],
      diferencaTempos: [7, 12, 15, 21, 54],
    },
    8: { // Tabela 7
      parteATempo: [10, 16, 19, 31, 49],
      parteBTempo: [29, 43, 49, 62, 84],
      parteBErros: [3, 4, 6, 7, 8],
      diferencaTempos: [9, 23, 31, 38, 57],
    },
    9: { // Tabela 9
      parteATempo: [9, 13, 15, 21, 34],
      parteBTempo: [17, 31, 36, 51, 82],
      parteBErros: [2, 3, 5, 6, 8],
      diferencaTempos: [1, 15, 20, 33, 56],
    },
    10: { // Tabela 11
      parteATempo: [12, 16, 20, 28, 42],
      parteBTempo: [23, 34, 38, 48, 93],
      parteBErros: [1, 3, 5, 6, 8],
      diferencaTempos: [3, 12, 20, 26, 52],
    },
    11: { // Tabela 13
      parteATempo: [10, 15, 17, 20, 34],
      parteBTempo: [27, 35, 38, 42, 67],
      parteBErros: [1, 3, 5, 6, 8],
      diferencaTempos: [8, 17, 21, 25, 36],
    },
    12: { // Tabela 15
      parteATempo: [8, 11, 15, 18, 25],
      parteBTempo: [18, 30, 34, 45, 57],
      parteBErros: [0, 3, 4, 5, 7],
      diferencaTempos: [5, 18, 20, 25, 53],
    },
  },
};

/**
 * Lookup de percentil baseado nas tabelas normativas
 * Para tempos e erros: valores menores são melhores (percentis mais altos)
 */
const lookupPercentile = (value: number, norms: number[]): number => {
  // norms = [P95, P75, P50, P25, P5]
  // Se valor <= P95, percentil >= 95
  // Se valor <= P75, percentil >= 75
  // etc.
  
  if (value <= norms[0]) return 95;
  if (value <= norms[1]) return 75;
  if (value <= norms[2]) return 50;
  if (value <= norms[3]) return 25;
  if (value <= norms[4]) return 5;
  return 2; // Abaixo de P5
};

/**
 * Classificação baseada no percentil
 */
export const getHaylingInfantilClassification = (percentile: number): string => {
  if (percentile >= 95) return 'Superior';
  if (percentile >= 75) return 'Média Superior';
  if (percentile >= 26) return 'Média';
  if (percentile >= 6) return 'Média Inferior';
  return 'Inferior';
};

/**
 * Calcula resultados do Hayling Infantil
 */
export const calculateHaylingInfantilResults = (
  parteATempo: number,
  parteBTempo: number,
  parteBErros: number,
  age: number,
  schoolType: SchoolType
): HaylingInfantilResults | null => {
  const roundedAge = Math.round(age) as HaylingInfantilAge;
  
  if (roundedAge < 6 || roundedAge > 12) {
    return null;
  }
  
  const norms = NORMS[schoolType][roundedAge];
  if (!norms) return null;
  
  const inibicaoBA = parteBTempo - parteATempo;
  
  const parteATempoPercentile = lookupPercentile(parteATempo, norms.parteATempo);
  const parteBTempoPercentile = lookupPercentile(parteBTempo, norms.parteBTempo);
  const parteBErrosPercentile = lookupPercentile(parteBErros, norms.parteBErros);
  const inibicaoBAPercentile = lookupPercentile(inibicaoBA, norms.diferencaTempos);
  
  return {
    parteATempo: {
      raw: parteATempo,
      percentile: parteATempoPercentile,
      classification: getHaylingInfantilClassification(parteATempoPercentile),
    },
    parteBTempo: {
      raw: parteBTempo,
      percentile: parteBTempoPercentile,
      classification: getHaylingInfantilClassification(parteBTempoPercentile),
    },
    parteBErros: {
      raw: parteBErros,
      percentile: parteBErrosPercentile,
      classification: getHaylingInfantilClassification(parteBErrosPercentile),
    },
    inibicaoBA: {
      raw: inibicaoBA,
      percentile: inibicaoBAPercentile,
      classification: getHaylingInfantilClassification(inibicaoBAPercentile),
    },
    schoolType,
    age: roundedAge,
  };
};

/**
 * Verifica se a idade é válida para o Hayling Infantil
 */
export const isAgeValidForHaylingInfantil = (age: number): boolean => {
  return age >= 6 && age <= 12;
};
