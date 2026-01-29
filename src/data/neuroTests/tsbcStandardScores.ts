/**
 * Tabelas normativas TSBC - Tarefa Span de Blocos Corsi
 * Baseado no manual - Capítulo 8
 * Escores Padrão (M=100, DP=15)
 * Separado por tipo de escola (pública/privada) e idade
 */

type NormTable = Record<number, Record<number, number>>;

/**
 * ESCOLA PÚBLICA - Ordem Direta
 * Mapeamento: idade -> (escore bruto -> escore padrão)
 */
const TSBC_OD_PUBLICA: NormTable = {
  4: {
    1: 77, 2: 86, 3: 95, 4: 104, 5: 113, 6: 122, 7: 132, 8: 141, 9: 150, 10: 159, 
    11: 168, 12: 177, 13: 187, 14: 196, 15: 205, 16: 214
  },
  5: {
    1: 65, 2: 74, 3: 83, 4: 93, 5: 102, 6: 111, 7: 121, 8: 130, 9: 139, 10: 149,
    11: 158, 12: 167, 13: 177, 14: 186, 15: 195, 16: 205
  },
  6: {
    1: 64, 2: 67, 3: 77, 4: 86, 5: 96, 6: 106, 7: 115, 8: 125, 9: 134, 10: 144,
    11: 154, 12: 163, 13: 173, 14: 182, 15: 192, 16: 202
  },
  7: {
    1: 62, 2: 63, 3: 72, 4: 80, 5: 88, 6: 96, 7: 104, 8: 112, 9: 120, 10: 128,
    11: 137, 12: 145, 13: 153, 14: 161, 15: 169, 16: 177
  },
  8: {
    1: 68, 2: 69, 3: 63, 4: 75, 5: 86, 6: 98, 7: 109, 8: 120, 9: 132, 10: 143,
    11: 155, 12: 166, 13: 177, 14: 189, 15: 200
  },
  9: {
    1: 66, 2: 66, 3: 75, 4: 82, 5: 88, 6: 94, 7: 100, 8: 107, 9: 113, 10: 119,
    11: 125, 12: 131, 13: 138, 14: 144, 15: 150
  },
  10: {
    1: 67, 2: 72, 3: 72, 4: 79, 5: 85, 6: 92, 7: 98, 8: 104, 9: 111, 10: 117,
    11: 124, 12: 130, 13: 137, 14: 143, 15: 149
  }
};

/**
 * ESCOLA PÚBLICA - Ordem Inversa
 */
const TSBC_OI_PUBLICA: NormTable = {
  4: {
    1: 106, 2: 134, 3: 163, 4: 192, 5: 220, 6: 249, 7: 278, 8: 306, 9: 335, 10: 364,
    11: 392, 12: 421, 13: 450, 14: 478, 15: 507, 16: 536
  },
  5: {
    1: 91, 2: 112, 3: 132, 4: 153, 5: 173, 6: 194, 7: 215, 8: 235, 9: 256, 10: 277,
    11: 297, 12: 318, 13: 338, 14: 359, 15: 380, 16: 400
  },
  6: {
    1: 95, 2: 107, 3: 118, 4: 130, 5: 142, 6: 153, 7: 165, 8: 176, 9: 188, 10: 199,
    11: 211, 12: 222, 13: 234, 14: 246, 15: 257, 16: 269
  },
  7: {
    1: 92, 2: 103, 3: 113, 4: 123, 5: 134, 6: 144, 7: 154, 8: 165, 9: 175, 10: 185,
    11: 196, 12: 206, 13: 216, 14: 227, 15: 237, 16: 247
  },
  8: {
    1: 74, 2: 91, 3: 108, 4: 124, 5: 141, 6: 158, 7: 174, 8: 191, 9: 208, 10: 224,
    11: 241, 12: 258, 13: 274, 14: 291, 15: 308, 16: 324
  },
  9: {
    1: 70, 2: 85, 3: 100, 4: 115, 5: 130, 6: 146, 7: 161, 8: 176, 9: 191, 10: 207,
    11: 222, 12: 237, 13: 252, 14: 267, 15: 283, 16: 298
  },
  10: {
    1: 72, 2: 84, 3: 96, 4: 108, 5: 120, 6: 132, 7: 144, 8: 156, 9: 168, 10: 180,
    11: 192, 12: 204, 13: 216, 14: 228, 15: 240, 16: 252
  }
};

/**
 * ESCOLA PRIVADA - Ordem Direta
 */
const TSBC_OD_PRIVADA: NormTable = {
  4: {
    1: 81, 2: 89, 3: 98, 4: 107, 5: 115, 6: 124, 7: 133, 8: 141, 9: 150, 10: 159,
    11: 168, 12: 176, 13: 185, 14: 194, 15: 202, 16: 211
  },
  5: {
    1: 62, 2: 74, 3: 85, 4: 96, 5: 108, 6: 119, 7: 131, 8: 142, 9: 154, 10: 165,
    11: 176, 12: 188, 13: 199, 14: 211, 15: 222, 16: 234
  },
  6: {
    1: 61, 2: 71, 3: 81, 4: 90, 5: 100, 6: 110, 7: 120, 8: 130, 9: 140, 10: 150,
    11: 160, 12: 170, 13: 179, 14: 189, 15: 199, 16: 209
  },
  7: {
    2: 70, 3: 77, 4: 85, 5: 93, 6: 101, 7: 109, 8: 117, 9: 125, 10: 133,
    11: 140, 12: 148, 13: 156, 14: 164, 15: 172, 16: 180
  },
  8: {
    3: 67, 4: 76, 5: 85, 6: 95, 7: 104, 8: 113, 9: 123, 10: 132,
    11: 141, 12: 151, 13: 160, 14: 169, 15: 179, 16: 188
  },
  9: {
    4: 62, 5: 71, 6: 81, 7: 91, 8: 101, 9: 110, 10: 120,
    11: 130, 12: 139, 13: 149, 14: 159, 15: 168, 16: 178
  },
  10: {
    5: 62, 6: 75, 7: 89, 8: 103, 9: 117, 10: 131,
    11: 145, 12: 158, 13: 172, 14: 186, 15: 200, 16: 214
  }
};

/**
 * ESCOLA PRIVADA - Ordem Inversa
 */
const TSBC_OI_PRIVADA: NormTable = {
  4: {
    1: 103, 2: 116, 3: 129, 4: 141, 5: 154, 6: 167, 7: 179, 8: 192, 9: 205, 10: 217,
    11: 230, 12: 243, 13: 256, 14: 268, 15: 281, 16: 294
  },
  5: {
    1: 89, 2: 100, 3: 111, 4: 122, 5: 133, 6: 144, 7: 155, 8: 166, 9: 177, 10: 188,
    11: 199, 12: 210, 13: 221, 14: 232, 15: 243, 16: 254
  },
  6: {
    1: 83, 2: 91, 3: 99, 4: 107, 5: 114, 6: 122, 7: 130, 8: 138, 9: 146, 10: 154,
    11: 161, 12: 169, 13: 177, 14: 185, 15: 193, 16: 200
  },
  7: {
    1: 73, 2: 84, 3: 95, 4: 107, 5: 118, 6: 129, 7: 141, 8: 152, 9: 163, 10: 175,
    11: 186, 12: 197, 13: 209, 14: 220, 15: 231, 16: 243
  },
  8: {
    1: 72, 2: 80, 3: 88, 4: 96, 5: 104, 6: 112, 7: 120, 8: 129, 9: 137, 10: 145,
    11: 153, 12: 161, 13: 169, 14: 177, 15: 185, 16: 193
  },
  9: {
    2: 67, 3: 75, 4: 83, 5: 91, 6: 99, 7: 107, 8: 115, 9: 123, 10: 131,
    11: 139, 12: 147, 13: 155, 14: 163, 15: 171, 16: 179
  },
  10: {
    3: 69, 4: 78, 5: 87, 6: 96, 7: 105, 8: 114, 9: 123, 10: 132,
    11: 141, 12: 150, 13: 159, 14: 168, 15: 177, 16: 186
  }
};

/**
 * Obtém escore padrão para Ordem Direta
 */
export const getTSBCStandardScoreOD = (
  rawScore: number, 
  age: number, 
  schoolType: 'publica' | 'privada'
): number | null => {
  const table = schoolType === 'publica' ? TSBC_OD_PUBLICA : TSBC_OD_PRIVADA;
  const ageTable = table[age];
  
  if (!ageTable) return null;
  
  // Busca direta
  if (ageTable[rawScore] !== undefined) {
    return ageTable[rawScore];
  }
  
  // Interpolação para escores não encontrados
  const scores = Object.keys(ageTable).map(Number).sort((a, b) => a - b);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  
  if (rawScore < minScore) {
    // Extrapolar para baixo
    const step = ageTable[scores[1]] - ageTable[scores[0]];
    return Math.max(40, ageTable[minScore] - (minScore - rawScore) * step);
  }
  
  if (rawScore > maxScore) {
    // Extrapolar para cima
    const step = ageTable[scores[scores.length - 1]] - ageTable[scores[scores.length - 2]];
    return Math.min(160, ageTable[maxScore] + (rawScore - maxScore) * step);
  }
  
  // Encontrar os dois valores mais próximos e interpolar
  let lower = minScore;
  let upper = maxScore;
  
  for (const score of scores) {
    if (score <= rawScore) lower = score;
    if (score >= rawScore && upper === maxScore) upper = score;
  }
  
  if (lower === upper) return ageTable[lower];
  
  const lowerValue = ageTable[lower];
  const upperValue = ageTable[upper];
  const ratio = (rawScore - lower) / (upper - lower);
  
  return Math.round(lowerValue + ratio * (upperValue - lowerValue));
};

/**
 * Obtém escore padrão para Ordem Inversa
 */
export const getTSBCStandardScoreOI = (
  rawScore: number, 
  age: number, 
  schoolType: 'publica' | 'privada'
): number | null => {
  const table = schoolType === 'publica' ? TSBC_OI_PUBLICA : TSBC_OI_PRIVADA;
  const ageTable = table[age];
  
  if (!ageTable) return null;
  
  // Busca direta
  if (ageTable[rawScore] !== undefined) {
    return ageTable[rawScore];
  }
  
  // Interpolação para escores não encontrados
  const scores = Object.keys(ageTable).map(Number).sort((a, b) => a - b);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  
  if (rawScore < minScore) {
    const step = ageTable[scores[1]] - ageTable[scores[0]];
    return Math.max(40, ageTable[minScore] - (minScore - rawScore) * step);
  }
  
  if (rawScore > maxScore) {
    const step = ageTable[scores[scores.length - 1]] - ageTable[scores[scores.length - 2]];
    return Math.min(160, ageTable[maxScore] + (rawScore - maxScore) * step);
  }
  
  let lower = minScore;
  let upper = maxScore;
  
  for (const score of scores) {
    if (score <= rawScore) lower = score;
    if (score >= rawScore && upper === maxScore) upper = score;
  }
  
  if (lower === upper) return ageTable[lower];
  
  const lowerValue = ageTable[lower];
  const upperValue = ageTable[upper];
  const ratio = (rawScore - lower) / (upper - lower);
  
  return Math.round(lowerValue + ratio * (upperValue - lowerValue));
};
