/**
 * Tabelas de conversão de pontuação bruta para escore padrão do PCFO
 * Baseado nas tabelas 12.2 e 12.3 do manual
 * 
 * Tabela 12.2: Educação Infantil (3-6 anos)
 * Tabela 12.3: Ensino Fundamental (6-14 anos)
 * 
 * Para crianças de 6 anos, usar Educação Infantil se ainda está no Infantil,
 * ou Ensino Fundamental se já está no 1º ano.
 * 
 * Escore bruto máximo: 40 pontos
 */

// Tabela 12.2 - Educação Infantil (idades 3, 4, 5, 6)
const PCFO_INFANTIL_TABLE: Record<number, Record<number, number>> = {
  // rawScore: { age: standardScore }
  1: { 3: 78, 4: 72, 5: 72, 6: 67 },
  2: { 3: 86, 4: 80, 5: 77, 6: 71 },
  3: { 3: 93, 4: 87, 5: 81, 6: 75 },
  4: { 3: 101, 4: 94, 5: 86, 6: 80 },
  5: { 3: 108, 4: 102, 5: 91, 6: 84 },
  6: { 3: 116, 4: 109, 5: 95, 6: 88 },
  7: { 3: 123, 4: 117, 5: 100, 6: 92 },
  8: { 3: 131, 4: 124, 5: 104, 6: 97 },
  9: { 3: 138, 4: 132, 5: 109, 6: 101 },
  10: { 3: 146, 4: 139, 5: 114, 6: 105 },
  11: { 3: 153, 4: 147, 5: 118, 6: 109 },
  12: { 3: 161, 4: 154, 5: 123, 6: 113 },
  13: { 3: 168, 4: 162, 5: 127, 6: 118 },
  14: { 3: 176, 4: 169, 5: 132, 6: 122 },
  15: { 3: 183, 4: 177, 5: 137, 6: 126 },
  16: { 3: 191, 4: 184, 5: 141, 6: 130 },
  17: { 3: 198, 4: 192, 5: 146, 6: 135 },
  18: { 3: 206, 4: 199, 5: 151, 6: 139 },
  19: { 3: 213, 4: 207, 5: 155, 6: 143 },
  20: { 3: 221, 4: 214, 5: 160, 6: 147 },
  21: { 3: 228, 4: 222, 5: 164, 6: 151 },
  22: { 3: 236, 4: 229, 5: 169, 6: 156 },
  23: { 3: 243, 4: 237, 5: 174, 6: 160 },
  24: { 3: 251, 4: 244, 5: 178, 6: 164 },
  25: { 3: 258, 4: 252, 5: 183, 6: 168 },
  26: { 3: 266, 4: 259, 5: 187, 6: 173 },
  27: { 3: 273, 4: 267, 5: 192, 6: 177 },
  28: { 3: 281, 4: 274, 5: 197, 6: 181 },
  29: { 3: 288, 4: 282, 5: 201, 6: 185 },
  30: { 3: 296, 4: 289, 5: 206, 6: 190 },
  31: { 3: 303, 4: 297, 5: 211, 6: 194 },
  32: { 3: 311, 4: 304, 5: 215, 6: 198 },
  33: { 3: 318, 4: 312, 5: 220, 6: 202 },
  34: { 3: 326, 4: 319, 5: 224, 6: 206 },
  35: { 3: 333, 4: 327, 5: 229, 6: 211 },
  36: { 3: 341, 4: 334, 5: 234, 6: 215 },
  37: { 3: 348, 4: 342, 5: 238, 6: 219 },
  38: { 3: 356, 4: 349, 5: 243, 6: 223 },
  39: { 3: 363, 4: 357, 5: 247, 6: 228 },
  40: { 3: 371, 4: 364, 5: 252, 6: 232 }
};

// Tabela 12.3 - Ensino Fundamental (idades 6-14)
const PCFO_FUNDAMENTAL_TABLE: Record<number, Record<number, number | null>> = {
  // rawScore: { age: standardScore } - null indica valor não disponível
  1: { 6: 64, 7: 54, 8: 32, 9: 9, 10: null, 11: null, 12: null, 13: null, 14: null },
  2: { 6: 66, 7: 56, 8: 34, 9: 12, 10: null, 11: null, 12: null, 13: null, 14: null },
  3: { 6: 68, 7: 59, 8: 37, 9: 15, 10: 1, 11: 3, 12: null, 13: null, 14: null },
  4: { 6: 70, 7: 61, 8: 39, 9: 19, 10: 5, 11: 7, 12: null, 13: null, 14: null },
  5: { 6: 72, 7: 63, 8: 42, 9: 22, 10: 8, 11: 10, 12: null, 13: null, 14: null },
  6: { 6: 74, 7: 65, 8: 45, 9: 25, 10: 11, 11: 14, 12: null, 13: null, 14: null },
  7: { 6: 76, 7: 67, 8: 47, 9: 28, 10: 15, 11: 17, 12: null, 13: null, 14: null },
  8: { 6: 78, 7: 69, 8: 50, 9: 31, 10: 18, 11: 21, 12: null, 13: null, 14: null },
  9: { 6: 80, 7: 71, 8: 52, 9: 34, 10: 21, 11: 25, 12: null, 13: null, 14: null },
  10: { 6: 82, 7: 73, 8: 55, 9: 38, 10: 25, 11: 28, 12: null, 13: null, 14: null },
  11: { 6: 84, 7: 75, 8: 58, 9: 41, 10: 28, 11: 32, 12: 5, 13: 4, 14: null },
  12: { 6: 86, 7: 78, 8: 60, 9: 44, 10: 32, 11: 35, 12: 1, 13: 9, 14: 8 },
  13: { 6: 88, 7: 80, 8: 63, 9: 47, 10: 35, 11: 39, 12: 5, 13: 13, 14: 12 },
  14: { 6: 90, 7: 82, 8: 66, 9: 50, 10: 38, 11: 42, 12: 10, 13: 17, 14: 16 },
  15: { 6: 92, 7: 84, 8: 68, 9: 54, 10: 42, 11: 46, 12: 14, 13: 21, 14: 20 },
  16: { 6: 94, 7: 86, 8: 71, 9: 57, 10: 45, 11: 49, 12: 18, 13: 24, 14: 24 },
  17: { 6: 96, 7: 88, 8: 73, 9: 60, 10: 48, 11: 53, 12: 23, 13: 28, 14: 27 },
  18: { 6: 98, 7: 90, 8: 76, 9: 63, 10: 52, 11: 56, 12: 27, 13: 32, 14: 31 },
  19: { 6: 100, 7: 92, 8: 79, 9: 66, 10: 55, 11: 60, 12: 31, 13: 36, 14: 35 },
  20: { 6: 102, 7: 94, 8: 81, 9: 69, 10: 58, 11: 63, 12: 36, 13: 40, 14: 39 },
  21: { 6: 104, 7: 96, 8: 84, 9: 73, 10: 62, 11: 67, 12: 40, 13: 44, 14: 43 },
  22: { 6: 106, 7: 99, 8: 86, 9: 76, 10: 65, 11: 71, 12: 44, 13: 48, 14: 47 },
  23: { 6: 108, 7: 101, 8: 89, 9: 79, 10: 68, 11: 74, 12: 49, 13: 52, 14: 51 },
  24: { 6: 110, 7: 103, 8: 92, 9: 82, 10: 72, 11: 78, 12: 53, 13: 56, 14: 55 },
  25: { 6: 112, 7: 105, 8: 94, 9: 85, 10: 75, 11: 81, 12: 57, 13: 60, 14: 59 },
  26: { 6: 114, 7: 107, 8: 97, 9: 88, 10: 78, 11: 85, 12: 62, 13: 64, 14: 63 },
  27: { 6: 116, 7: 109, 8: 99, 9: 92, 10: 82, 11: 88, 12: 66, 13: 68, 14: 67 },
  28: { 6: 118, 7: 111, 8: 102, 9: 95, 10: 85, 11: 92, 12: 70, 13: 72, 14: 71 },
  29: { 6: 120, 7: 113, 8: 105, 9: 98, 10: 88, 11: 95, 12: 75, 13: 76, 14: 75 },
  30: { 6: 122, 7: 115, 8: 107, 9: 101, 10: 92, 11: 99, 12: 79, 13: 80, 14: 79 },
  31: { 6: 124, 7: 118, 8: 110, 9: 104, 10: 95, 11: 102, 12: 83, 13: 84, 14: 83 },
  32: { 6: 126, 7: 120, 8: 113, 9: 107, 10: 98, 11: 106, 12: 87, 13: 88, 14: 87 },
  33: { 6: 128, 7: 122, 8: 115, 9: 111, 10: 102, 11: 109, 12: 92, 13: 92, 14: 91 },
  34: { 6: 130, 7: 124, 8: 118, 9: 114, 10: 105, 11: 113, 12: 96, 13: 96, 14: 95 },
  35: { 6: 132, 7: 126, 8: 120, 9: 117, 10: 108, 11: 116, 12: 100, 13: 99, 14: 99 },
  36: { 6: 134, 7: 128, 8: 123, 9: 120, 10: 112, 11: 120, 12: 105, 13: 103, 14: 103 },
  37: { 6: 136, 7: 130, 8: 126, 9: 123, 10: 115, 11: 124, 12: 109, 13: 107, 14: 107 },
  38: { 6: 138, 7: 132, 8: 128, 9: 127, 10: 118, 11: 127, 12: 113, 13: 111, 14: 111 },
  39: { 6: 140, 7: 134, 8: 131, 9: 130, 10: 122, 11: 131, 12: 118, 13: 115, 14: 115 },
  40: { 6: 142, 7: 136, 8: 133, 9: 133, 10: 125, 11: 134, 12: 122, 13: 119, 14: 119 }
};

export type PCFOSchoolingLevel = 'infantil' | 'fundamental';

/**
 * Obtém o escore padrão do PCFO baseado na pontuação bruta, idade e nível escolar
 * @param rawScore - Pontuação bruta (total de acertos, 0-40)
 * @param age - Idade da criança (3-14 anos)
 * @param schoolingLevel - Nível escolar ('infantil' ou 'fundamental')
 * @returns Escore padrão ou null se não disponível
 */
export const getPCFOStandardScore = (
  rawScore: number,
  age: number,
  schoolingLevel: PCFOSchoolingLevel
): number | null => {
  // Validar pontuação bruta
  if (rawScore < 0 || rawScore > 40) {
    return null;
  }

  // Pontuação 0 não está na tabela
  if (rawScore === 0) {
    return null;
  }

  // Usar tabela apropriada baseada no nível escolar
  if (schoolingLevel === 'infantil') {
    // Educação Infantil: apenas idades 3-6
    if (age < 3 || age > 6) {
      return null;
    }
    const ageData = PCFO_INFANTIL_TABLE[rawScore];
    if (!ageData) return null;
    return ageData[age] ?? null;
  } else {
    // Ensino Fundamental: idades 6-14
    if (age < 6 || age > 14) {
      return null;
    }
    const ageData = PCFO_FUNDAMENTAL_TABLE[rawScore];
    if (!ageData) return null;
    return ageData[age] ?? null;
  }
};

/**
 * Determina automaticamente o nível escolar baseado na idade
 * Para idade 6, assume Ensino Fundamental por padrão
 * @param age - Idade da criança
 * @returns Nível escolar sugerido
 */
export const suggestSchoolingLevel = (age: number): PCFOSchoolingLevel => {
  if (age <= 5) {
    return 'infantil';
  }
  return 'fundamental';
};
