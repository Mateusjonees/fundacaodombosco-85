/**
 * Definição do Teste Taylor (Figura Complexa Modificada de Taylor - MTCF)
 * Avalia habilidades visuoconstrutivas e memória visual
 * Faixa etária: 18-92 anos (dois grupos: <50 e ≥50)
 * 
 * Referência: NEURONORMA-Plus Project (Pérez-Enríquez et al., 2024)
 */

import type { NeuroTestDefinition } from './bpa2';

export interface TaylorScores {
  copia: number;           // Pontos na cópia (0-36)
  reproducaoMemoria: number; // Pontos da reprodução da memória (0-36)
}

export interface TaylorResults {
  rawScores: TaylorScores;
  zScores: {
    copia: number;
    reproducaoMemoria: number;
  };
  percentiles: {
    copia: number;
    reproducaoMemoria: number;
  };
  classifications: {
    copia: string;
    reproducaoMemoria: string;
  };
  ageGroup: string;
  notes: string;
}

export const TAYLOR_TEST: NeuroTestDefinition = {
  code: 'TAYLOR',
  name: 'Taylor',
  fullName: 'Figura Complexa Modificada de Taylor (MTCF)',
  description: 'Avalia habilidades visuoconstrutivas (cópia) e memória visual (reprodução da memória).',
  minAge: 18,
  maxAge: 92,
  subtests: [
    { code: 'COPIA', name: 'Cópia', fields: ['pontos'], formula: 'Pontos na cópia' },
    { code: 'REPROD', name: 'Reprodução da Memória', fields: ['pontos'], formula: 'Pontos da reprodução' }
  ],
  calculatedScores: [
    { code: 'COPIA_PERC', name: 'Percentil Cópia', formula: 'Z-score → Percentil' },
    { code: 'REPROD_PERC', name: 'Percentil Reprodução', formula: 'Z-score → Percentil' }
  ]
};

/**
 * Dados normativos por faixa etária
 * Fonte: NEURONORMA-Plus Project (Tabela 2)
 * 
 * Copy accuracy: Immediate recall e Delayed recall - usando Delayed Recall como "Reprodução da Memória"
 */
interface AgeGroupNorms {
  copia: { mean: number; sd: number };
  reproducaoMemoria: { mean: number; sd: number };
}

const TAYLOR_NORMS: Record<string, AgeGroupNorms> = {
  '<50': {
    copia: { mean: 34.86, sd: 2.03 },
    reproducaoMemoria: { mean: 23.87, sd: 5.17 }
  },
  '>=50': {
    copia: { mean: 32.86, sd: 3.67 },
    reproducaoMemoria: { mean: 16.96, sd: 5.95 }
  }
};

/**
 * Determina o grupo etário
 */
export const getTaylorAgeGroup = (age: number): string => {
  return age < 50 ? '<50' : '>=50';
};

/**
 * Verifica se a idade é válida para o teste
 */
export const isAgeValidForTaylor = (age: number): boolean => {
  return age >= 18 && age <= 92;
};

/**
 * Converte Z-score para percentil usando aproximação da distribuição normal
 */
const zScoreToPercentile = (z: number): number => {
  // Usando a fórmula de aproximação de Abramowitz e Stegun
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  const percentile = 0.5 * (1.0 + sign * y) * 100;
  // Arredonda para número inteiro (91.49 → 91, 91.55 → 92)
  return Math.round(percentile);
};

/**
 * Sistema de Classificação por Percentil
 * 
 * ≤5 = Inferior
 * 6-25 = Média Inferior
 * 26-74 = Média
 * 75-94 = Média Superior
 * ≥95 = Superior
 */
export const getTaylorClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 25) return 'Média Inferior';
  if (percentile <= 74) return 'Média';
  if (percentile <= 94) return 'Média Superior';
  return 'Superior';
};

/**
 * Calcula os resultados completos do teste Taylor
 */
export const calculateTaylorResults = (
  scores: TaylorScores,
  age: number
): TaylorResults | null => {
  if (!isAgeValidForTaylor(age)) {
    return null;
  }

  const ageGroup = getTaylorAgeGroup(age);
  const norms = TAYLOR_NORMS[ageGroup];

  // Calcular Z-scores: Z = (Pontuação - Média) / Desvio Padrão
  const zCopia = (scores.copia - norms.copia.mean) / norms.copia.sd;
  const zReproducao = (scores.reproducaoMemoria - norms.reproducaoMemoria.mean) / norms.reproducaoMemoria.sd;

  // Converter Z-scores para percentis
  const percCopia = zScoreToPercentile(zCopia);
  const percReproducao = zScoreToPercentile(zReproducao);

  // Determinar classificações
  const classCopia = getTaylorClassification(percCopia);
  const classReproducao = getTaylorClassification(percReproducao);

  return {
    rawScores: scores,
    zScores: {
      copia: Math.round(zCopia * 100) / 100,
      reproducaoMemoria: Math.round(zReproducao * 100) / 100
    },
    percentiles: {
      copia: percCopia,
      reproducaoMemoria: percReproducao
    },
    classifications: {
      copia: classCopia,
      reproducaoMemoria: classReproducao
    },
    ageGroup: ageGroup === '<50' ? 'Menores de 50 anos' : '50 anos ou mais',
    notes: ''
  };
};

/**
 * Retorna a descrição do grupo etário
 */
export const getTaylorAgeGroupDescription = (age: number): string => {
  if (age < 50) {
    return 'Menores de 50 anos (18-49)';
  }
  return '50 anos ou mais (50-92)';
};
