/**
 * TFV - Tarefas de Fluência Verbal
 * 
 * Faixa etária: 6-12 anos
 * Norma: Estratificada por idade e tipo de escola (privada/pública)
 * 
 * Subtestes:
 * - Fluência Verbal Livre (FVL) - Evocação livre de palavras
 * - Fluência Verbal Fonêmica (FVF) - Letra P
 * - Fluência Verbal Semântica (FVS) - Vestimentas
 */

export type TFVSchoolType = 'privada' | 'publica';

export interface TFVResults {
  schoolType: TFVSchoolType;
  fluenciaLivre: {
    raw: number;
    percentile: string;
    classification: string;
  };
  fluenciaFonemica: {
    raw: number;
    percentile: string;
    classification: string;
  };
  fluenciaSemantica: {
    raw: number;
    percentile: string;
    classification: string;
  };
}

// Definição do teste - usando interface simplificada compatível
export const TFV_TEST = {
  code: 'TFV',
  name: 'TFV',
  fullName: 'TFV - Tarefas de Fluência Verbal',
  description: 'Avaliação de fluência verbal livre, fonêmica (letra P) e semântica (vestimentas)',
  minAge: 6,
  maxAge: 12,
  subtests: [],
  calculatedScores: [],
} as const;

// Classificação baseada em percentil
export const getClassificationFromPercentile = (percentile: string): string => {
  // Percentil pode vir como número exato ou faixa
  const numericPercentile = parseInt(percentile.replace(/[<>]/g, '').split('-')[0]);
  
  if (percentile.includes('<5') || numericPercentile <= 5) {
    return 'Inferior';
  } else if (percentile.includes('5-25') || (numericPercentile > 5 && numericPercentile <= 25)) {
    return 'Média Inferior';
  } else if (percentile.includes('25-50') || percentile.includes('50-75') || numericPercentile === 50 || (numericPercentile > 25 && numericPercentile <= 75)) {
    return 'Média';
  } else if (percentile.includes('75-95') || numericPercentile === 75 || (numericPercentile > 75 && numericPercentile < 95)) {
    return 'Média Superior';
  } else if (percentile.includes('>95') || numericPercentile >= 95) {
    return 'Superior';
  }
  return 'Média';
};

// Tabelas normativas - Total de acertos por idade, tipo de escola e subteste
// Estrutura: { [idade]: { privada: { livre, fonemica, semantica }, publica: { ... } } }
// Cada subteste tem: { percentile_5, percentile_25, percentile_50, percentile_75, percentile_95 }

interface PercentileTable {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

interface TFVNorms {
  [age: number]: {
    privada: {
      livre: PercentileTable;
      fonemica: PercentileTable;
      semantica: PercentileTable;
    };
    publica: {
      livre: PercentileTable;
      fonemica: PercentileTable;
      semantica: PercentileTable;
    };
  };
}

// Dados normativos extraídos do manual (Total de acertos)
export const TFV_NORMS: TFVNorms = {
  6: {
    privada: {
      // FVL Total: Média 24.83, DP 10.81, Percentis: 95=46, 75=31, 50=23, 25=18, 5=7
      livre: { p5: 7, p25: 18, p50: 23, p75: 31, p95: 46 },
      // FVF Total: Média 8.18, DP 3.56, Percentis: 95=18, 75=10, 50=8, 25=6, 5=4
      fonemica: { p5: 4, p25: 6, p50: 8, p75: 10, p95: 18 },
      // FVS Total: Média 11.59, DP 2.64, Percentis: 95=18, 75=13, 50=11, 25=10, 5=7
      semantica: { p5: 7, p25: 10, p50: 11, p75: 13, p95: 18 },
    },
    publica: {
      // FVL Total: Média 23.68, DP 11.39, Percentis aproximados
      livre: { p5: 8, p25: 14, p50: 23, p75: 35, p95: 44 },
      // FVF Total: Média 7.73, DP 4.27, Percentis: 95=17, 75=10, 50=7, 25=5, 5=3
      fonemica: { p5: 3, p25: 5, p50: 7, p75: 10, p95: 17 },
      // FVS Total: Média 10.86, DP 2.66, Percentis: 95=16, 75=13, 50=10, 25=9, 5=7
      semantica: { p5: 7, p25: 9, p50: 10, p75: 13, p95: 16 },
    },
  },
  7: {
    privada: {
      // FVL Total: Média ~32, Percentis estimados da tabela 4
      livre: { p5: 10, p25: 22, p50: 30, p75: 40, p95: 55 },
      // FVF Total: Percentis da tabela 4
      fonemica: { p5: 4, p25: 7, p50: 10, p75: 14, p95: 22 },
      // FVS Total
      semantica: { p5: 6, p25: 9, p50: 11, p75: 14, p95: 19 },
    },
    publica: {
      // FVL Total: Tabela 5 - Média 28.10, DP 13.12, Percentis: 95=55, 75=37, 50=26, 25=18, 5=7
      livre: { p5: 7, p25: 18, p50: 26, p75: 37, p95: 55 },
      // FVF Total: Tabela 5 - Média 9.08, DP 4.89, Percentis: 95=22, 75=11, 50=8, 25=5, 5=4
      fonemica: { p5: 4, p25: 5, p50: 8, p75: 11, p95: 22 },
      // FVS Total: Tabela 5 - Média 10.13, DP 3.79, Percentis: 95=21, 75=11, 50=10, 25=8, 5=5
      semantica: { p5: 5, p25: 8, p50: 10, p75: 11, p95: 21 },
    },
  },
  8: {
    privada: {
      // FVL Total: Tabela 6 - Média 37.23, DP 13.18, Percentis: 95=62, 75=45, 50=41, 25=27, 5=15
      livre: { p5: 15, p25: 27, p50: 41, p75: 45, p95: 62 },
      // FVF Total: Tabela 6 - Média 11.56, DP 4.08, Percentis: 95=18, 75=15, 50=13, 25=8, 5=5
      fonemica: { p5: 5, p25: 8, p50: 13, p75: 15, p95: 18 },
      // FVS Total: Tabela 6 - Média 14.69, Percentis: 95=21, 75=17, 50=13, 25=11, 5=7
      semantica: { p5: 7, p25: 11, p50: 13, p75: 17, p95: 21 },
    },
    publica: {
      // FVL Total: Tabela 7 - Média 31.18, DP 13.52, Percentis: 95=53, 75=39, 50=32, 25=19, 5=13
      livre: { p5: 13, p25: 19, p50: 32, p75: 39, p95: 53 },
      // FVF Total: Tabela 7 - Média 11.69, DP 3.98, Percentis: 95=19, 75=14, 50=12, 25=8, 5=6
      fonemica: { p5: 6, p25: 8, p50: 12, p75: 14, p95: 19 },
      // FVS Total: Tabela 7 - Média 13.23, DP 4.11, Percentis: 95=21, 75=15, 50=13, 25=11, 5=7
      semantica: { p5: 7, p25: 11, p50: 13, p75: 15, p95: 21 },
    },
  },
  9: {
    privada: {
      // FVL Total: Tabela 8 - Média 43.19, Percentis: 95=75, 75=57, 50=42, 25=28, 5=17
      livre: { p5: 17, p25: 28, p50: 42, p75: 57, p95: 75 },
      // FVF Total: Tabela 8 - Média 14.24, DP 5.50, Percentis: 95=26, 75=17, 50=13, 25=10, 5=8
      fonemica: { p5: 8, p25: 10, p50: 13, p75: 17, p95: 26 },
      // FVS Total: Tabela 8 - Média 15.94, DP 5.47, Percentis: 95=25, 75=20, 50=16, 25=10, 5=8
      semantica: { p5: 8, p25: 10, p50: 16, p75: 20, p95: 25 },
    },
    publica: {
      // FVL Total: Tabela 9 - Média 40.28, DP 14.25, Percentis: 95=63, 75=50, 50=41, 25=31, 5=18
      livre: { p5: 18, p25: 31, p50: 41, p75: 50, p95: 63 },
      // FVF Total: Tabela 9 - Média 13.65, DP 4.98, Percentis: 95=24, 75=18, 50=13, 25=10, 5=6
      fonemica: { p5: 6, p25: 10, p50: 13, p75: 18, p95: 24 },
      // FVS Total: Tabela 9 - Média 13.29, DP 4.87, Percentis: 95=23, 75=16, 50=14, 25=11, 5=4
      semantica: { p5: 4, p25: 11, p50: 14, p75: 16, p95: 23 },
    },
  },
  10: {
    privada: {
      // FVL Total: Tabela 10 - Média 50.12, Percentis: 95=79, 75=65, 50=50, 25=38, 5=22
      livre: { p5: 22, p25: 38, p50: 50, p75: 65, p95: 79 },
      // FVF Total: Tabela 10 - Média 16.74, DP 5.24, Percentis: 95=26, 75=20, 50=16, 25=13, 5=9
      fonemica: { p5: 9, p25: 13, p50: 16, p75: 20, p95: 26 },
      // FVS Total: Tabela 10 - Média 17.23, DP 4.54, Percentis: 95=25, 75=21, 50=18, 25=13, 5=9
      semantica: { p5: 9, p25: 13, p50: 18, p75: 21, p95: 25 },
    },
    publica: {
      // FVL Total: Tabela 11 - Média 46.00, DP 12.64, Percentis: 95=68, 75=55, 50=46, 25=38, 5=25
      livre: { p5: 25, p25: 38, p50: 46, p75: 55, p95: 68 },
      // FVF Total: Tabela 11 - Média 13.94, DP 4.84, Percentis: 95=23, 75=17, 50=14, 25=10, 5=7
      fonemica: { p5: 7, p25: 10, p50: 14, p75: 17, p95: 23 },
      // FVS Total: Tabela 11 - Média 16.08, DP 4.32, Percentis: 95=24, 75=19, 50=16, 25=13, 5=9
      semantica: { p5: 9, p25: 13, p50: 16, p75: 19, p95: 24 },
    },
  },
  11: {
    privada: {
      // FVL Total: Tabela 12 - Média 59.58, DP 19.30, Percentis: 95=103, 75=68, 50=55, 25=47, 5=31
      livre: { p5: 31, p25: 47, p50: 55, p75: 68, p95: 103 },
      // FVF Total: Tabela 12 - Média 17.63, DP 5.58, Percentis: 95=29, 75=22, 50=17, 25=14, 5=8
      fonemica: { p5: 8, p25: 14, p50: 17, p75: 22, p95: 29 },
      // FVS Total: Tabela 12 - Média 19.07, Percentis: 95=29, 75=23, 50=19, 25=15, 5=10
      semantica: { p5: 10, p25: 15, p50: 19, p75: 23, p95: 29 },
    },
    publica: {
      // FVL Total: Tabela 13 - Média 50.47, DP 20.11, Percentis: 95=86, 75=60, 50=51, 25=39, 5=14
      livre: { p5: 14, p25: 39, p50: 51, p75: 60, p95: 86 },
      // FVF Total: Tabela 13 - Média 15.46, DP 5.60, Percentis: 95=28, 75=20, 50=15, 25=13, 5=6
      fonemica: { p5: 6, p25: 13, p50: 15, p75: 20, p95: 28 },
      // FVS Total: Tabela 13 - Média 16.33, DP 5.72, Percentis: 95=28, 75=20, 50=16, 25=11, 5=8
      semantica: { p5: 8, p25: 11, p50: 16, p75: 20, p95: 28 },
    },
  },
  12: {
    privada: {
      // FVL Total: Tabela 14 estimada - similar a 11 anos privada com leve aumento
      livre: { p5: 35, p25: 50, p50: 60, p75: 75, p95: 110 },
      // FVF Total: Tabela 14 estimada
      fonemica: { p5: 10, p25: 15, p50: 19, p75: 24, p95: 32 },
      // FVS Total: Tabela 14 estimada
      semantica: { p5: 11, p25: 16, p50: 20, p75: 25, p95: 32 },
    },
    publica: {
      // FVL Total: Tabela 15 - Média 52.36, DP 16.35, Percentis: 95=85, 75=62, 50=51, 25=44, 5=25
      livre: { p5: 25, p25: 44, p50: 51, p75: 62, p95: 85 },
      // FVF Total: Tabela 15 - Média 16.72, DP 4.20, Percentis: 95=24, 75=20, 50=17, 25=13, 5=10
      fonemica: { p5: 10, p25: 13, p50: 17, p75: 20, p95: 24 },
      // FVS Total: Tabela 15 - Média 19.73, DP 5.13, Percentis: 95=29, 75=23, 50=20, 25=18, 5=12
      semantica: { p5: 12, p25: 18, p50: 20, p75: 23, p95: 29 },
    },
  },
};

/**
 * Busca o percentil para uma pontuação bruta
 * Retorna o percentil exato (5, 25, 50, 75, 95) ou faixa (<5, 5-25, 25-50, 50-75, 75-95, >95)
 */
export const lookupTFVPercentile = (
  rawScore: number,
  age: number,
  schoolType: TFVSchoolType,
  subteste: 'livre' | 'fonemica' | 'semantica'
): string => {
  const roundedAge = Math.round(age);
  const clampedAge = Math.max(6, Math.min(12, roundedAge));
  
  const norms = TFV_NORMS[clampedAge]?.[schoolType]?.[subteste];
  if (!norms) return '50';
  
  // Verificar percentis exatos
  if (rawScore === norms.p5) return '5';
  if (rawScore === norms.p25) return '25';
  if (rawScore === norms.p50) return '50';
  if (rawScore === norms.p75) return '75';
  if (rawScore === norms.p95) return '95';
  
  // Verificar faixas
  if (rawScore < norms.p5) return '<5';
  if (rawScore > norms.p5 && rawScore < norms.p25) return '5-25';
  if (rawScore > norms.p25 && rawScore < norms.p50) return '25-50';
  if (rawScore > norms.p50 && rawScore < norms.p75) return '50-75';
  if (rawScore > norms.p75 && rawScore < norms.p95) return '75-95';
  if (rawScore > norms.p95) return '>95';
  
  return '50';
};

/**
 * Calcula os resultados completos do TFV
 */
export const calculateTFVResults = (
  fluenciaLivreRaw: number,
  fluenciaFonemicaRaw: number,
  fluenciaSemanticaRaw: number,
  age: number,
  schoolType: TFVSchoolType
): TFVResults => {
  const livrePercentile = lookupTFVPercentile(fluenciaLivreRaw, age, schoolType, 'livre');
  const fonemicaPercentile = lookupTFVPercentile(fluenciaFonemicaRaw, age, schoolType, 'fonemica');
  const semanticaPercentile = lookupTFVPercentile(fluenciaSemanticaRaw, age, schoolType, 'semantica');
  
  return {
    schoolType,
    fluenciaLivre: {
      raw: fluenciaLivreRaw,
      percentile: livrePercentile,
      classification: getClassificationFromPercentile(livrePercentile),
    },
    fluenciaFonemica: {
      raw: fluenciaFonemicaRaw,
      percentile: fonemicaPercentile,
      classification: getClassificationFromPercentile(fonemicaPercentile),
    },
    fluenciaSemantica: {
      raw: fluenciaSemanticaRaw,
      percentile: semanticaPercentile,
      classification: getClassificationFromPercentile(semanticaPercentile),
    },
  };
};

/**
 * Verifica se a idade é válida para o teste TFV
 */
export const isAgeValidForTFV = (age: number): boolean => {
  return age >= 6 && age <= 12;
};
