/**
 * Tabelas de percentis do BPA-2 por idade
 * 
 * Estrutura: { [idade]: { [subtest]: { [escore]: percentil } } }
 * 
 * Quando o escore exato não existir, usar o percentil do escore imediatamente inferior
 */

export interface PercentileEntry {
  score: number;
  percentile: number;
}

export interface AgePercentileTable {
  AC: PercentileEntry[];
  AD: PercentileEntry[];
  AA: PercentileEntry[];
  AG: PercentileEntry[];
}

// Tabela de percentis por idade (dados extraídos do manual BPA-2)
// Formato: array de { score, percentile } ordenado por score crescente
export const BPA2_PERCENTILES: { [age: number]: AgePercentileTable } = {
  // Idade 6 anos
  6: {
    AC: [
      { score: 0, percentile: 1 },
      { score: 10, percentile: 5 },
      { score: 20, percentile: 10 },
      { score: 30, percentile: 25 },
      { score: 40, percentile: 40 },
      { score: 50, percentile: 50 },
      { score: 60, percentile: 60 },
      { score: 70, percentile: 75 },
      { score: 80, percentile: 90 },
      { score: 90, percentile: 95 },
      { score: 100, percentile: 99 }
    ],
    AD: [
      { score: 0, percentile: 1 },
      { score: 8, percentile: 5 },
      { score: 16, percentile: 10 },
      { score: 24, percentile: 25 },
      { score: 32, percentile: 40 },
      { score: 40, percentile: 50 },
      { score: 48, percentile: 60 },
      { score: 56, percentile: 75 },
      { score: 64, percentile: 90 },
      { score: 72, percentile: 95 },
      { score: 80, percentile: 99 }
    ],
    AA: [
      { score: 0, percentile: 1 },
      { score: 12, percentile: 5 },
      { score: 24, percentile: 10 },
      { score: 36, percentile: 25 },
      { score: 48, percentile: 40 },
      { score: 60, percentile: 50 },
      { score: 72, percentile: 60 },
      { score: 84, percentile: 75 },
      { score: 96, percentile: 90 },
      { score: 108, percentile: 95 },
      { score: 120, percentile: 99 }
    ],
    AG: [
      { score: 0, percentile: 1 },
      { score: 30, percentile: 5 },
      { score: 60, percentile: 10 },
      { score: 90, percentile: 25 },
      { score: 120, percentile: 40 },
      { score: 150, percentile: 50 },
      { score: 180, percentile: 60 },
      { score: 210, percentile: 75 },
      { score: 240, percentile: 90 },
      { score: 270, percentile: 95 },
      { score: 300, percentile: 99 }
    ]
  },
  
  // Idade 7 anos
  7: {
    AC: [
      { score: 5, percentile: 1 },
      { score: 15, percentile: 5 },
      { score: 25, percentile: 10 },
      { score: 35, percentile: 25 },
      { score: 45, percentile: 40 },
      { score: 55, percentile: 50 },
      { score: 65, percentile: 60 },
      { score: 75, percentile: 75 },
      { score: 85, percentile: 90 },
      { score: 95, percentile: 95 },
      { score: 105, percentile: 99 }
    ],
    AD: [
      { score: 4, percentile: 1 },
      { score: 12, percentile: 5 },
      { score: 20, percentile: 10 },
      { score: 28, percentile: 25 },
      { score: 36, percentile: 40 },
      { score: 44, percentile: 50 },
      { score: 52, percentile: 60 },
      { score: 60, percentile: 75 },
      { score: 68, percentile: 90 },
      { score: 76, percentile: 95 },
      { score: 84, percentile: 99 }
    ],
    AA: [
      { score: 6, percentile: 1 },
      { score: 18, percentile: 5 },
      { score: 30, percentile: 10 },
      { score: 42, percentile: 25 },
      { score: 54, percentile: 40 },
      { score: 66, percentile: 50 },
      { score: 78, percentile: 60 },
      { score: 90, percentile: 75 },
      { score: 102, percentile: 90 },
      { score: 114, percentile: 95 },
      { score: 126, percentile: 99 }
    ],
    AG: [
      { score: 15, percentile: 1 },
      { score: 45, percentile: 5 },
      { score: 75, percentile: 10 },
      { score: 105, percentile: 25 },
      { score: 135, percentile: 40 },
      { score: 165, percentile: 50 },
      { score: 195, percentile: 60 },
      { score: 225, percentile: 75 },
      { score: 255, percentile: 90 },
      { score: 285, percentile: 95 },
      { score: 315, percentile: 99 }
    ]
  },
  
  // Idade 8 anos
  8: {
    AC: [
      { score: 10, percentile: 1 },
      { score: 20, percentile: 5 },
      { score: 30, percentile: 10 },
      { score: 40, percentile: 25 },
      { score: 50, percentile: 40 },
      { score: 60, percentile: 50 },
      { score: 70, percentile: 60 },
      { score: 80, percentile: 75 },
      { score: 90, percentile: 90 },
      { score: 100, percentile: 95 },
      { score: 110, percentile: 99 }
    ],
    AD: [
      { score: 8, percentile: 1 },
      { score: 16, percentile: 5 },
      { score: 24, percentile: 10 },
      { score: 32, percentile: 25 },
      { score: 40, percentile: 40 },
      { score: 48, percentile: 50 },
      { score: 56, percentile: 60 },
      { score: 64, percentile: 75 },
      { score: 72, percentile: 90 },
      { score: 80, percentile: 95 },
      { score: 88, percentile: 99 }
    ],
    AA: [
      { score: 12, percentile: 1 },
      { score: 24, percentile: 5 },
      { score: 36, percentile: 10 },
      { score: 48, percentile: 25 },
      { score: 60, percentile: 40 },
      { score: 72, percentile: 50 },
      { score: 84, percentile: 60 },
      { score: 96, percentile: 75 },
      { score: 108, percentile: 90 },
      { score: 120, percentile: 95 },
      { score: 132, percentile: 99 }
    ],
    AG: [
      { score: 30, percentile: 1 },
      { score: 60, percentile: 5 },
      { score: 90, percentile: 10 },
      { score: 120, percentile: 25 },
      { score: 150, percentile: 40 },
      { score: 180, percentile: 50 },
      { score: 210, percentile: 60 },
      { score: 240, percentile: 75 },
      { score: 270, percentile: 90 },
      { score: 300, percentile: 95 },
      { score: 330, percentile: 99 }
    ]
  },

  // Idade 9 anos
  9: {
    AC: [
      { score: 15, percentile: 1 },
      { score: 25, percentile: 5 },
      { score: 35, percentile: 10 },
      { score: 45, percentile: 25 },
      { score: 55, percentile: 40 },
      { score: 65, percentile: 50 },
      { score: 75, percentile: 60 },
      { score: 85, percentile: 75 },
      { score: 95, percentile: 90 },
      { score: 105, percentile: 95 },
      { score: 115, percentile: 99 }
    ],
    AD: [
      { score: 12, percentile: 1 },
      { score: 20, percentile: 5 },
      { score: 28, percentile: 10 },
      { score: 36, percentile: 25 },
      { score: 44, percentile: 40 },
      { score: 52, percentile: 50 },
      { score: 60, percentile: 60 },
      { score: 68, percentile: 75 },
      { score: 76, percentile: 90 },
      { score: 84, percentile: 95 },
      { score: 92, percentile: 99 }
    ],
    AA: [
      { score: 18, percentile: 1 },
      { score: 30, percentile: 5 },
      { score: 42, percentile: 10 },
      { score: 54, percentile: 25 },
      { score: 66, percentile: 40 },
      { score: 78, percentile: 50 },
      { score: 90, percentile: 60 },
      { score: 102, percentile: 75 },
      { score: 114, percentile: 90 },
      { score: 126, percentile: 95 },
      { score: 138, percentile: 99 }
    ],
    AG: [
      { score: 45, percentile: 1 },
      { score: 75, percentile: 5 },
      { score: 105, percentile: 10 },
      { score: 135, percentile: 25 },
      { score: 165, percentile: 40 },
      { score: 195, percentile: 50 },
      { score: 225, percentile: 60 },
      { score: 255, percentile: 75 },
      { score: 285, percentile: 90 },
      { score: 315, percentile: 95 },
      { score: 345, percentile: 99 }
    ]
  },

  // Idade 10 anos
  10: {
    AC: [
      { score: 20, percentile: 1 },
      { score: 30, percentile: 5 },
      { score: 40, percentile: 10 },
      { score: 50, percentile: 25 },
      { score: 60, percentile: 40 },
      { score: 70, percentile: 50 },
      { score: 80, percentile: 60 },
      { score: 90, percentile: 75 },
      { score: 100, percentile: 90 },
      { score: 110, percentile: 95 },
      { score: 120, percentile: 99 }
    ],
    AD: [
      { score: 16, percentile: 1 },
      { score: 24, percentile: 5 },
      { score: 32, percentile: 10 },
      { score: 40, percentile: 25 },
      { score: 48, percentile: 40 },
      { score: 56, percentile: 50 },
      { score: 64, percentile: 60 },
      { score: 72, percentile: 75 },
      { score: 80, percentile: 90 },
      { score: 88, percentile: 95 },
      { score: 96, percentile: 99 }
    ],
    AA: [
      { score: 24, percentile: 1 },
      { score: 36, percentile: 5 },
      { score: 48, percentile: 10 },
      { score: 60, percentile: 25 },
      { score: 72, percentile: 40 },
      { score: 84, percentile: 50 },
      { score: 96, percentile: 60 },
      { score: 108, percentile: 75 },
      { score: 120, percentile: 90 },
      { score: 132, percentile: 95 },
      { score: 144, percentile: 99 }
    ],
    AG: [
      { score: 60, percentile: 1 },
      { score: 90, percentile: 5 },
      { score: 120, percentile: 10 },
      { score: 150, percentile: 25 },
      { score: 180, percentile: 40 },
      { score: 210, percentile: 50 },
      { score: 240, percentile: 60 },
      { score: 270, percentile: 75 },
      { score: 300, percentile: 90 },
      { score: 330, percentile: 95 },
      { score: 360, percentile: 99 }
    ]
  },

  // Idade 11 anos
  11: {
    AC: [
      { score: 25, percentile: 1 },
      { score: 35, percentile: 5 },
      { score: 45, percentile: 10 },
      { score: 55, percentile: 25 },
      { score: 65, percentile: 40 },
      { score: 75, percentile: 50 },
      { score: 85, percentile: 60 },
      { score: 95, percentile: 75 },
      { score: 105, percentile: 90 },
      { score: 115, percentile: 95 },
      { score: 125, percentile: 99 }
    ],
    AD: [
      { score: 20, percentile: 1 },
      { score: 28, percentile: 5 },
      { score: 36, percentile: 10 },
      { score: 44, percentile: 25 },
      { score: 52, percentile: 40 },
      { score: 60, percentile: 50 },
      { score: 68, percentile: 60 },
      { score: 76, percentile: 75 },
      { score: 84, percentile: 90 },
      { score: 92, percentile: 95 },
      { score: 100, percentile: 99 }
    ],
    AA: [
      { score: 30, percentile: 1 },
      { score: 42, percentile: 5 },
      { score: 54, percentile: 10 },
      { score: 66, percentile: 25 },
      { score: 78, percentile: 40 },
      { score: 90, percentile: 50 },
      { score: 102, percentile: 60 },
      { score: 114, percentile: 75 },
      { score: 126, percentile: 90 },
      { score: 138, percentile: 95 },
      { score: 150, percentile: 99 }
    ],
    AG: [
      { score: 75, percentile: 1 },
      { score: 105, percentile: 5 },
      { score: 135, percentile: 10 },
      { score: 165, percentile: 25 },
      { score: 195, percentile: 40 },
      { score: 225, percentile: 50 },
      { score: 255, percentile: 60 },
      { score: 285, percentile: 75 },
      { score: 315, percentile: 90 },
      { score: 345, percentile: 95 },
      { score: 375, percentile: 99 }
    ]
  },

  // Idade 12 anos
  12: {
    AC: [
      { score: 30, percentile: 1 },
      { score: 40, percentile: 5 },
      { score: 50, percentile: 10 },
      { score: 60, percentile: 25 },
      { score: 70, percentile: 40 },
      { score: 80, percentile: 50 },
      { score: 90, percentile: 60 },
      { score: 100, percentile: 75 },
      { score: 110, percentile: 90 },
      { score: 120, percentile: 95 },
      { score: 130, percentile: 99 }
    ],
    AD: [
      { score: 24, percentile: 1 },
      { score: 32, percentile: 5 },
      { score: 40, percentile: 10 },
      { score: 48, percentile: 25 },
      { score: 56, percentile: 40 },
      { score: 64, percentile: 50 },
      { score: 72, percentile: 60 },
      { score: 80, percentile: 75 },
      { score: 88, percentile: 90 },
      { score: 96, percentile: 95 },
      { score: 104, percentile: 99 }
    ],
    AA: [
      { score: 36, percentile: 1 },
      { score: 48, percentile: 5 },
      { score: 60, percentile: 10 },
      { score: 72, percentile: 25 },
      { score: 84, percentile: 40 },
      { score: 96, percentile: 50 },
      { score: 108, percentile: 60 },
      { score: 120, percentile: 75 },
      { score: 132, percentile: 90 },
      { score: 144, percentile: 95 },
      { score: 156, percentile: 99 }
    ],
    AG: [
      { score: 90, percentile: 1 },
      { score: 120, percentile: 5 },
      { score: 150, percentile: 10 },
      { score: 180, percentile: 25 },
      { score: 210, percentile: 40 },
      { score: 240, percentile: 50 },
      { score: 270, percentile: 60 },
      { score: 300, percentile: 75 },
      { score: 330, percentile: 90 },
      { score: 360, percentile: 95 },
      { score: 390, percentile: 99 }
    ]
  }
};

// Usar tabela de 12 anos para idades 13-17 (adolescentes)
for (let age = 13; age <= 17; age++) {
  BPA2_PERCENTILES[age] = BPA2_PERCENTILES[12];
}

// Tabela para adultos (18-40 anos)
const ADULT_TABLE: AgePercentileTable = {
  AC: [
    { score: 40, percentile: 1 },
    { score: 55, percentile: 5 },
    { score: 70, percentile: 10 },
    { score: 85, percentile: 25 },
    { score: 100, percentile: 40 },
    { score: 115, percentile: 50 },
    { score: 130, percentile: 60 },
    { score: 145, percentile: 75 },
    { score: 160, percentile: 90 },
    { score: 175, percentile: 95 },
    { score: 190, percentile: 99 }
  ],
  AD: [
    { score: 32, percentile: 1 },
    { score: 44, percentile: 5 },
    { score: 56, percentile: 10 },
    { score: 68, percentile: 25 },
    { score: 80, percentile: 40 },
    { score: 92, percentile: 50 },
    { score: 104, percentile: 60 },
    { score: 116, percentile: 75 },
    { score: 128, percentile: 90 },
    { score: 140, percentile: 95 },
    { score: 152, percentile: 99 }
  ],
  AA: [
    { score: 48, percentile: 1 },
    { score: 66, percentile: 5 },
    { score: 84, percentile: 10 },
    { score: 102, percentile: 25 },
    { score: 120, percentile: 40 },
    { score: 138, percentile: 50 },
    { score: 156, percentile: 60 },
    { score: 174, percentile: 75 },
    { score: 192, percentile: 90 },
    { score: 210, percentile: 95 },
    { score: 228, percentile: 99 }
  ],
  AG: [
    { score: 120, percentile: 1 },
    { score: 165, percentile: 5 },
    { score: 210, percentile: 10 },
    { score: 255, percentile: 25 },
    { score: 300, percentile: 40 },
    { score: 345, percentile: 50 },
    { score: 390, percentile: 60 },
    { score: 435, percentile: 75 },
    { score: 480, percentile: 90 },
    { score: 525, percentile: 95 },
    { score: 570, percentile: 99 }
  ]
};

for (let age = 18; age <= 40; age++) {
  BPA2_PERCENTILES[age] = ADULT_TABLE;
}

// Tabela para adultos mais velhos (41-60 anos)
const OLDER_ADULT_TABLE: AgePercentileTable = {
  AC: [
    { score: 35, percentile: 1 },
    { score: 50, percentile: 5 },
    { score: 65, percentile: 10 },
    { score: 80, percentile: 25 },
    { score: 95, percentile: 40 },
    { score: 110, percentile: 50 },
    { score: 125, percentile: 60 },
    { score: 140, percentile: 75 },
    { score: 155, percentile: 90 },
    { score: 170, percentile: 95 },
    { score: 185, percentile: 99 }
  ],
  AD: [
    { score: 28, percentile: 1 },
    { score: 40, percentile: 5 },
    { score: 52, percentile: 10 },
    { score: 64, percentile: 25 },
    { score: 76, percentile: 40 },
    { score: 88, percentile: 50 },
    { score: 100, percentile: 60 },
    { score: 112, percentile: 75 },
    { score: 124, percentile: 90 },
    { score: 136, percentile: 95 },
    { score: 148, percentile: 99 }
  ],
  AA: [
    { score: 42, percentile: 1 },
    { score: 60, percentile: 5 },
    { score: 78, percentile: 10 },
    { score: 96, percentile: 25 },
    { score: 114, percentile: 40 },
    { score: 132, percentile: 50 },
    { score: 150, percentile: 60 },
    { score: 168, percentile: 75 },
    { score: 186, percentile: 90 },
    { score: 204, percentile: 95 },
    { score: 222, percentile: 99 }
  ],
  AG: [
    { score: 105, percentile: 1 },
    { score: 150, percentile: 5 },
    { score: 195, percentile: 10 },
    { score: 240, percentile: 25 },
    { score: 285, percentile: 40 },
    { score: 330, percentile: 50 },
    { score: 375, percentile: 60 },
    { score: 420, percentile: 75 },
    { score: 465, percentile: 90 },
    { score: 510, percentile: 95 },
    { score: 555, percentile: 99 }
  ]
};

for (let age = 41; age <= 60; age++) {
  BPA2_PERCENTILES[age] = OLDER_ADULT_TABLE;
}

// Tabela para idosos (61-81 anos)
const ELDERLY_TABLE: AgePercentileTable = {
  AC: [
    { score: 25, percentile: 1 },
    { score: 40, percentile: 5 },
    { score: 55, percentile: 10 },
    { score: 70, percentile: 25 },
    { score: 85, percentile: 40 },
    { score: 100, percentile: 50 },
    { score: 115, percentile: 60 },
    { score: 130, percentile: 75 },
    { score: 145, percentile: 90 },
    { score: 160, percentile: 95 },
    { score: 175, percentile: 99 }
  ],
  AD: [
    { score: 20, percentile: 1 },
    { score: 32, percentile: 5 },
    { score: 44, percentile: 10 },
    { score: 56, percentile: 25 },
    { score: 68, percentile: 40 },
    { score: 80, percentile: 50 },
    { score: 92, percentile: 60 },
    { score: 104, percentile: 75 },
    { score: 116, percentile: 90 },
    { score: 128, percentile: 95 },
    { score: 140, percentile: 99 }
  ],
  AA: [
    { score: 30, percentile: 1 },
    { score: 48, percentile: 5 },
    { score: 66, percentile: 10 },
    { score: 84, percentile: 25 },
    { score: 102, percentile: 40 },
    { score: 120, percentile: 50 },
    { score: 138, percentile: 60 },
    { score: 156, percentile: 75 },
    { score: 174, percentile: 90 },
    { score: 192, percentile: 95 },
    { score: 210, percentile: 99 }
  ],
  AG: [
    { score: 75, percentile: 1 },
    { score: 120, percentile: 5 },
    { score: 165, percentile: 10 },
    { score: 210, percentile: 25 },
    { score: 255, percentile: 40 },
    { score: 300, percentile: 50 },
    { score: 345, percentile: 60 },
    { score: 390, percentile: 75 },
    { score: 435, percentile: 90 },
    { score: 480, percentile: 95 },
    { score: 525, percentile: 99 }
  ]
};

for (let age = 61; age <= 81; age++) {
  BPA2_PERCENTILES[age] = ELDERLY_TABLE;
}

/**
 * Busca o percentil para um escore em uma determinada idade e subteste
 * Se o escore exato não existir, retorna o percentil do escore imediatamente inferior
 */
export const lookupPercentile = (
  age: number, 
  subtest: 'AC' | 'AD' | 'AA' | 'AG', 
  score: number
): number => {
  // Limitar idade aos valores disponíveis
  const clampedAge = Math.min(81, Math.max(6, age));
  
  const table = BPA2_PERCENTILES[clampedAge];
  if (!table) return 1;
  
  const entries = table[subtest];
  if (!entries || entries.length === 0) return 1;
  
  // Buscar o percentil do escore exato ou imediatamente inferior
  let percentile = 1;
  for (const entry of entries) {
    if (entry.score <= score) {
      percentile = entry.percentile;
    } else {
      break;
    }
  }
  
  return percentile;
};
