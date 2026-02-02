/**
 * TMT - Teste de Trilhas Adulto (19-75 anos)
 * Avalia flexibilidade cognitiva e atenção alternada
 * 
 * Requer seleção de escolaridade:
 * - Ensino Fundamental (5-8 anos)
 * - Ensino Médio (9-11 anos)
 * - Ensino Superior (12+ anos)
 * 
 * Mede tempo em segundos para as partes A e B
 */

import type { NeuroTestDefinition } from './bpa2';

export const TMT_ADULTO_TEST: NeuroTestDefinition = {
  code: 'TMT_ADULTO',
  name: 'TMT Adulto',
  fullName: 'TMT - Teste de Trilhas Adulto',
  description: 'Avalia velocidade de processamento, atenção visual e flexibilidade cognitiva em adultos (19-75 anos)',
  minAge: 19,
  maxAge: 75,
  subtests: [
    { code: 'A', name: 'Tempo A', fields: ['tempoA'], formula: 'tempo em segundos' },
    { code: 'B', name: 'Tempo B', fields: ['tempoB'], formula: 'tempo em segundos' }
  ],
  calculatedScores: [
    { code: 'BA', name: 'Tempo B-A', formula: 'tempoB - tempoA' }
  ]
};

// Níveis de escolaridade
export type EducationLevel = 'fundamental' | 'medio' | 'superior';

export const EDUCATION_LEVELS = [
  { value: 'fundamental' as EducationLevel, label: 'Ensino Fundamental (5-8 anos)', years: '5-8' },
  { value: 'medio' as EducationLevel, label: 'Ensino Médio (9-11 anos)', years: '9-11' },
  { value: 'superior' as EducationLevel, label: 'Ensino Superior (12+ anos)', years: '12+' }
];

// Grupos etários
export type AgeGroup = '19-39' | '40-59' | '60-75';

export const getAgeGroup = (age: number): AgeGroup | null => {
  if (age >= 19 && age <= 39) return '19-39';
  if (age >= 40 && age <= 59) return '40-59';
  if (age >= 60 && age <= 75) return '60-75';
  return null;
};

// Classificações baseadas em percentil
export const getClassificationFromPercentile = (percentile: string): string => {
  // Se é um percentil exato
  if (percentile === '<5') return 'Muito Inferior';
  if (percentile === '5' || percentile === '5-10' || percentile === '10') return 'Inferior';
  if (percentile === '10-25' || percentile === '25') return 'Média Inferior';
  if (percentile === '25-50' || percentile === '50' || percentile === '50-75') return 'Média';
  if (percentile === '75' || percentile === '75-90') return 'Média Superior';
  if (percentile === '90' || percentile === '90-95') return 'Superior';
  if (percentile === '>95' || percentile === '95') return 'Muito Superior';
  
  // Tentar interpretar valor numérico
  const numValue = parseFloat(percentile);
  if (!isNaN(numValue)) {
    if (numValue < 5) return 'Muito Inferior';
    if (numValue <= 10) return 'Inferior';
    if (numValue <= 25) return 'Média Inferior';
    if (numValue <= 75) return 'Média';
    if (numValue <= 90) return 'Média Superior';
    if (numValue <= 95) return 'Superior';
    return 'Muito Superior';
  }
  
  return 'Indeterminada';
};

// Interface para resultados
export interface TMTAdultoResults {
  rawScores: {
    tempoA: number;
    tempoB: number;
    educationLevel: EducationLevel;
  };
  calculatedScores: {
    tempoA: number;
    tempoB: number;
    tempoBA: number;
  };
  percentiles: {
    tempoA: string;
    tempoB: string;
    tempoBA: string;
  };
  classifications: {
    tempoA: string;
    tempoB: string;
    tempoBA: string;
  };
  notes?: string;
}
