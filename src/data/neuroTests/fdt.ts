/**
 * Definição do Teste FDT (Five Digit Test)
 * Avalia funções executivas: velocidade de processamento, atenção e controle inibitório
 * Faixa etária: 6-81 anos
 */

import type { NeuroTestDefinition } from './bpa2';

export interface FDTScores {
  leitura: number;
  contagem: number;
  escolha: number;
  alternancia: number;
}

export interface FDTCalculatedScores {
  inibicao: number;       // escolha - leitura
  flexibilidade: number;  // alternancia - leitura
}

export interface FDTPercentiles {
  inibicao: number;
  flexibilidade: number;
}

export interface FDTClassifications {
  inibicao: string;
  flexibilidade: string;
}

export interface FDTResults {
  rawScores: FDTScores;
  calculatedScores: FDTCalculatedScores;
  percentiles: FDTPercentiles;
  classifications: FDTClassifications;
  notes: string;
}

export const FDT_TEST: NeuroTestDefinition = {
  code: 'FDT',
  name: 'FDT',
  fullName: 'Five Digit Test - Teste dos Cinco Dígitos',
  description: 'Avalia funções executivas: velocidade de processamento, atenção, controle inibitório e flexibilidade cognitiva.',
  minAge: 6,
  maxAge: 99,
  subtests: [
    {
      code: 'LEIT',
      name: 'Leitura',
      fields: ['tempo'],
      formula: 'tempo em segundos'
    },
    {
      code: 'CONT',
      name: 'Contagem',
      fields: ['tempo'],
      formula: 'tempo em segundos'
    },
    {
      code: 'ESC',
      name: 'Escolha',
      fields: ['tempo'],
      formula: 'tempo em segundos'
    },
    {
      code: 'ALT',
      name: 'Alternância',
      fields: ['tempo'],
      formula: 'tempo em segundos'
    }
  ],
  calculatedScores: [
    {
      code: 'INI',
      name: 'Inibição',
      formula: 'Escolha - Leitura'
    },
    {
      code: 'FLEX',
      name: 'Flexibilidade',
      formula: 'Alternância - Leitura'
    }
  ]
};

/**
 * Calcula o escore de Inibição
 */
export const calculateInibicao = (escolha: number, leitura: number): number => {
  return escolha - leitura;
};

/**
 * Calcula o escore de Flexibilidade
 */
export const calculateFlexibilidade = (alternancia: number, leitura: number): number => {
  return alternancia - leitura;
};
