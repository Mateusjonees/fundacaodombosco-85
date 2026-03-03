/**
 * Tabelas Normativas do RAVLT
 * Dados extraídos do manual oficial (Tabelas 15-26)
 * Percentis disponíveis: 5, 25, 50, 75, 95
 */

type PercentileEntry = { percentile: number; score: number };
type VariableData = PercentileEntry[];

interface AgeGroupTable {
  A1: VariableData;
  A2: VariableData;
  A3: VariableData;
  A4: VariableData;
  A5: VariableData;
  B1: VariableData;
  A6: VariableData;
  A7: VariableData;
  EscoreTotal: VariableData;
  Reconhecimento: VariableData;
  ALT: VariableData;
  VelocidadeEsquecimento: VariableData;
  InterferenciaProativa: VariableData;
  InterferenciaRetroativa: VariableData;
}

// Helper para criar entrada de percentil
const p = (percentile: number, score: number): PercentileEntry => ({ percentile, score });

// ========== TABELAS POR FAIXA ETÁRIA (Valores do manual oficial) ==========

// Tabela 15: 6-8 anos
const TABLE_6_8: AgeGroupTable = {
  A1: [p(5, 2), p(25, 3), p(50, 4), p(75, 5), p(95, 8)],
  A2: [p(5, 3), p(25, 5), p(50, 6), p(75, 7), p(95, 10)],
  A3: [p(5, 4), p(25, 5), p(50, 7), p(75, 9), p(95, 12)],
  A4: [p(5, 4), p(25, 6), p(50, 8), p(75, 10), p(95, 13)],
  A5: [p(5, 4), p(25, 7), p(50, 8), p(75, 10), p(95, 13)],
  B1: [p(5, 2), p(25, 3), p(50, 4), p(75, 5), p(95, 7)],
  A6: [p(5, 3), p(25, 5), p(50, 7), p(75, 8), p(95, 13)],
  A7: [p(5, 3), p(25, 6), p(50, 7), p(75, 9), p(95, 13)],
  EscoreTotal: [p(5, 19), p(25, 26), p(50, 33), p(75, 40), p(95, 52)],
  Reconhecimento: [p(5, -2), p(25, 8), p(50, 10), p(75, 15), p(95, 15)],
  ALT: [p(5, -4), p(25, 6), p(50, 12), p(75, 16), p(95, 23)],
  VelocidadeEsquecimento: [p(5, 0.67), p(25, 0.89), p(50, 1.00), p(75, 1.20), p(95, 1.75)],
  InterferenciaProativa: [p(5, 0.50), p(25, 0.75), p(50, 1.00), p(75, 1.29), p(95, 2.00)],
  InterferenciaRetroativa: [p(5, 0.50), p(25, 0.71), p(50, 0.88), p(75, 1.00), p(95, 1.25)]
};

// Tabela 16: 9-11 anos
const TABLE_9_11: AgeGroupTable = {
  A1: [p(5, 3), p(25, 4), p(50, 5), p(75, 7), p(95, 8)],
  A2: [p(5, 4), p(25, 6), p(50, 7), p(75, 9), p(95, 11)],
  A3: [p(5, 3), p(25, 6), p(50, 9), p(75, 11), p(95, 13)],
  A4: [p(5, 4), p(25, 8), p(50, 9), p(75, 11), p(95, 14)],
  A5: [p(5, 5), p(25, 8), p(50, 10), p(75, 12), p(95, 14)],
  B1: [p(5, 3), p(25, 4), p(50, 5), p(75, 6), p(95, 8)],
  A6: [p(5, 4), p(25, 7), p(50, 9), p(75, 11), p(95, 12)],
  A7: [p(5, 4), p(25, 7), p(50, 9), p(75, 11), p(95, 13)],
  EscoreTotal: [p(5, 24), p(25, 32), p(50, 40), p(75, 46), p(95, 58)],
  Reconhecimento: [p(5, 2), p(25, 11), p(50, 14), p(75, 15), p(95, 15)],
  ALT: [p(5, -1), p(25, 8), p(50, 13), p(75, 19), p(95, 26)],
  VelocidadeEsquecimento: [p(5, 0.75), p(25, 0.90), p(50, 1.00), p(75, 1.11), p(95, 1.33)],
  InterferenciaProativa: [p(5, 0.50), p(25, 0.71), p(50, 0.86), p(75, 1.20), p(95, 2.00)],
  InterferenciaRetroativa: [p(5, 0.56), p(25, 0.73), p(50, 0.85), p(75, 1.00), p(95, 1.38)]
};

// Tabela 17: 12-14 anos
const TABLE_12_14: AgeGroupTable = {
  A1: [p(5, 4), p(25, 5), p(50, 6), p(75, 8), p(95, 9)],
  A2: [p(5, 4), p(25, 6), p(50, 8), p(75, 10), p(95, 12)],
  A3: [p(5, 4), p(25, 7), p(50, 10), p(75, 12), p(95, 14)],
  A4: [p(5, 3), p(25, 9), p(50, 10), p(75, 12), p(95, 14)],
  A5: [p(5, 6), p(25, 10), p(50, 11), p(75, 13), p(95, 15)],
  B1: [p(5, 3), p(25, 4), p(50, 6), p(75, 7), p(95, 9)],
  A6: [p(5, 5), p(25, 9), p(50, 10), p(75, 11), p(95, 13)],
  A7: [p(5, 5), p(25, 7), p(50, 10), p(75, 12), p(95, 14)],
  EscoreTotal: [p(5, 28), p(25, 39), p(50, 46), p(75, 51), p(95, 59)],
  Reconhecimento: [p(5, 0), p(25, 12), p(50, 15), p(75, 15), p(95, 15)],
  ALT: [p(5, -2), p(25, 7), p(50, 13), p(75, 20), p(95, 25)],
  VelocidadeEsquecimento: [p(5, 0.60), p(25, 0.89), p(50, 1.00), p(75, 1.11), p(95, 1.40)],
  InterferenciaProativa: [p(5, 0.50), p(25, 0.73), p(50, 0.88), p(75, 1.13), p(95, 1.50)],
  InterferenciaRetroativa: [p(5, 0.60), p(25, 0.80), p(50, 0.90), p(75, 1.00), p(95, 1.22)]
};

// Tabela 18: 15-17 anos
const TABLE_15_17: AgeGroupTable = {
  A1: [p(5, 4), p(25, 5), p(50, 6), p(75, 7), p(95, 8)],
  A2: [p(5, 4), p(25, 7), p(50, 8), p(75, 9), p(95, 11)],
  A3: [p(5, 4), p(25, 8), p(50, 10), p(75, 11), p(95, 13)],
  A4: [p(5, 6), p(25, 10), p(50, 11), p(75, 13), p(95, 14)],
  A5: [p(5, 7), p(25, 10), p(50, 11), p(75, 14), p(95, 14)],
  B1: [p(5, 3), p(25, 4), p(50, 5), p(75, 6), p(95, 9)],
  A6: [p(5, 5), p(25, 9), p(50, 10), p(75, 13), p(95, 14)],
  A7: [p(5, 6), p(25, 9), p(50, 11), p(75, 12), p(95, 14)],
  EscoreTotal: [p(5, 34), p(25, 41), p(50, 46), p(75, 53), p(95, 58)],
  Reconhecimento: [p(5, 4), p(25, 11), p(50, 13), p(75, 15), p(95, 15)],
  ALT: [p(5, 2), p(25, 13), p(50, 17), p(75, 21), p(95, 26)],
  VelocidadeEsquecimento: [p(5, 0.79), p(25, 0.90), p(50, 1.00), p(75, 1.11), p(95, 1.35)],
  InterferenciaProativa: [p(5, 0.54), p(25, 0.69), p(50, 0.86), p(75, 1.06), p(95, 1.42)],
  InterferenciaRetroativa: [p(5, 0.64), p(25, 0.82), p(50, 0.93), p(75, 1.00), p(95, 1.23)]
};

// Tabela 19: 18-20 anos
const TABLE_18_20: AgeGroupTable = {
  A1: [p(5, 4), p(25, 6), p(50, 7), p(75, 8), p(95, 10)],
  A2: [p(5, 6), p(25, 8), p(50, 9), p(75, 11), p(95, 13)],
  A3: [p(5, 8), p(25, 10), p(50, 11), p(75, 13), p(95, 14)],
  A4: [p(5, 8), p(25, 10), p(50, 12), p(75, 14), p(95, 15)],
  A5: [p(5, 8), p(25, 11), p(50, 12), p(75, 14), p(95, 15)],
  B1: [p(5, 4), p(25, 5), p(50, 6), p(75, 7), p(95, 9)],
  A6: [p(5, 6), p(25, 9), p(50, 12), p(75, 13), p(95, 15)],
  A7: [p(5, 6), p(25, 9), p(50, 11), p(75, 13), p(95, 15)],
  EscoreTotal: [p(5, 36), p(25, 46), p(50, 52), p(75, 58), p(95, 65)],
  Reconhecimento: [p(5, -1), p(25, 5), p(50, 13), p(75, 15), p(95, 15)],
  ALT: [p(5, 6), p(25, 12), p(50, 18), p(75, 22), p(95, 29)],
  VelocidadeEsquecimento: [p(5, 0.75), p(25, 0.91), p(50, 1.00), p(75, 1.10), p(95, 1.33)],
  InterferenciaProativa: [p(5, 0.56), p(25, 0.73), p(50, 0.89), p(75, 1.10), p(95, 1.50)],
  InterferenciaRetroativa: [p(5, 0.63), p(25, 0.82), p(50, 0.92), p(75, 1.00), p(95, 1.18)]
};

// Tabela 20: 21-30 anos
const TABLE_21_30: AgeGroupTable = {
  A1: [p(5, 4), p(25, 5), p(50, 7), p(75, 8), p(95, 9)],
  A2: [p(5, 5), p(25, 7), p(50, 9), p(75, 10), p(95, 12)],
  A3: [p(5, 6), p(25, 9), p(50, 11), p(75, 12), p(95, 14)],
  A4: [p(5, 7), p(25, 10), p(50, 12), p(75, 13), p(95, 15)],
  A5: [p(5, 8), p(25, 11), p(50, 13), p(75, 14), p(95, 15)],
  B1: [p(5, 3), p(25, 4), p(50, 6), p(75, 7), p(95, 9)],
  A6: [p(5, 6), p(25, 9), p(50, 11), p(75, 13), p(95, 15)],
  A7: [p(5, 6), p(25, 9), p(50, 11), p(75, 13), p(95, 15)],
  EscoreTotal: [p(5, 34), p(25, 44), p(50, 50), p(75, 56), p(95, 63)],
  Reconhecimento: [p(5, 1), p(25, 11), p(50, 13), p(75, 14), p(95, 15)],
  ALT: [p(5, 5), p(25, 13), p(50, 17), p(75, 21), p(95, 27)],
  VelocidadeEsquecimento: [p(5, 0.75), p(25, 0.91), p(50, 1.00), p(75, 1.09), p(95, 1.33)],
  InterferenciaProativa: [p(5, 0.50), p(25, 0.68), p(50, 0.86), p(75, 1.00), p(95, 1.50)],
  InterferenciaRetroativa: [p(5, 0.63), p(25, 0.80), p(50, 0.91), p(75, 1.00), p(95, 1.10)]
};

// Tabela 21: 31-40 anos
const TABLE_31_40: AgeGroupTable = {
  A1: [p(5, 4), p(25, 5), p(50, 6), p(75, 7), p(95, 9)],
  A2: [p(5, 5), p(25, 7), p(50, 9), p(75, 10), p(95, 12)],
  A3: [p(5, 6), p(25, 9), p(50, 10), p(75, 12), p(95, 14)],
  A4: [p(5, 7), p(25, 10), p(50, 11), p(75, 12), p(95, 15)],
  A5: [p(5, 8), p(25, 11), p(50, 12), p(75, 14), p(95, 15)],
  B1: [p(5, 2), p(25, 4), p(50, 5), p(75, 6), p(95, 8)],
  A6: [p(5, 6), p(25, 9), p(50, 11), p(75, 12), p(95, 14)],
  A7: [p(5, 6), p(25, 9), p(50, 11), p(75, 12), p(95, 14)],
  EscoreTotal: [p(5, 35), p(25, 43), p(50, 49), p(75, 54), p(95, 60)],
  Reconhecimento: [p(5, -2), p(25, 10), p(50, 13), p(75, 14), p(95, 15)],
  ALT: [p(5, 6), p(25, 14), p(50, 18), p(75, 23), p(95, 30)],
  VelocidadeEsquecimento: [p(5, 0.75), p(25, 0.86), p(50, 1.08), p(75, 1.29), p(95, 1.50)],
  InterferenciaProativa: [p(5, 0.50), p(25, 0.67), p(50, 0.91), p(75, 1.00), p(95, 1.18)],
  InterferenciaRetroativa: [p(5, 0.58), p(25, 0.80), p(50, 0.91), p(75, 0.94), p(95, 1.18)]
};

// Tabela 22: 41-50 anos
const TABLE_41_50: AgeGroupTable = {
  A1: [p(5, 4), p(25, 5), p(50, 6), p(75, 7), p(95, 9)],
  A2: [p(5, 5), p(25, 7), p(50, 8), p(75, 10), p(95, 12)],
  A3: [p(5, 5), p(25, 8), p(50, 10), p(75, 11), p(95, 14)],
  A4: [p(5, 6), p(25, 9), p(50, 11), p(75, 12), p(95, 15)],
  A5: [p(5, 7), p(25, 10), p(50, 12), p(75, 14), p(95, 15)],
  B1: [p(5, 3), p(25, 4), p(50, 5), p(75, 6), p(95, 8)],
  A6: [p(5, 5), p(25, 8), p(50, 10), p(75, 12), p(95, 14)],
  A7: [p(5, 5), p(25, 7), p(50, 10), p(75, 11), p(95, 14)],
  EscoreTotal: [p(5, 29), p(25, 40), p(50, 49), p(75, 53), p(95, 61)],
  Reconhecimento: [p(5, -3), p(25, 8), p(50, 12), p(75, 14), p(95, 15)],
  ALT: [p(5, 5), p(25, 12), p(50, 16.5), p(75, 22), p(95, 27)],
  VelocidadeEsquecimento: [p(5, 0.71), p(25, 0.85), p(50, 1.00), p(75, 1.10), p(95, 1.38)],
  InterferenciaProativa: [p(5, 0.40), p(25, 0.67), p(50, 0.80), p(75, 1.00), p(95, 1.50)],
  InterferenciaRetroativa: [p(5, 0.54), p(25, 0.73), p(50, 0.86), p(75, 0.97), p(95, 1.13)]
};

// Tabela 23: 51-60 anos
const TABLE_51_60: AgeGroupTable = {
  A1: [p(5, 3), p(25, 5), p(50, 6), p(75, 7), p(95, 9)],
  A2: [p(5, 5), p(25, 6), p(50, 8), p(75, 10), p(95, 12)],
  A3: [p(5, 5), p(25, 8), p(50, 10), p(75, 11), p(95, 14)],
  A4: [p(5, 7), p(25, 9), p(50, 11), p(75, 12), p(95, 14)],
  A5: [p(5, 8), p(25, 10), p(50, 12), p(75, 14), p(95, 15)],
  B1: [p(5, 2), p(25, 4), p(50, 5), p(75, 6), p(95, 8)],
  A6: [p(5, 5), p(25, 7), p(50, 10), p(75, 12), p(95, 14)],
  A7: [p(5, 4), p(25, 8), p(50, 10), p(75, 12), p(95, 14)],
  EscoreTotal: [p(5, 31), p(25, 37), p(50, 47), p(75, 53), p(95, 61)],
  Reconhecimento: [p(5, -2), p(25, 10), p(50, 12), p(75, 14), p(95, 15)],
  ALT: [p(5, 4), p(25, 12), p(50, 15), p(75, 19), p(95, 26)],
  VelocidadeEsquecimento: [p(5, 0.80), p(25, 0.90), p(50, 1.00), p(75, 1.11), p(95, 1.38)],
  InterferenciaProativa: [p(5, 0.40), p(25, 0.63), p(50, 0.80), p(75, 1.00), p(95, 1.40)],
  InterferenciaRetroativa: [p(5, 0.45), p(25, 0.67), p(50, 0.84), p(75, 1.00), p(95, 1.08)]
};

// Tabela 24: 61-70 anos
const TABLE_61_70: AgeGroupTable = {
  A1: [p(5, 3), p(25, 5), p(50, 5), p(75, 6), p(95, 8)],
  A2: [p(5, 5), p(25, 6), p(50, 8), p(75, 9), p(95, 11)],
  A3: [p(5, 6), p(25, 8), p(50, 9), p(75, 10), p(95, 12)],
  A4: [p(5, 7), p(25, 9), p(50, 10), p(75, 11), p(95, 13)],
  A5: [p(5, 8), p(25, 10), p(50, 11), p(75, 12), p(95, 14)],
  B1: [p(5, 2), p(25, 4), p(50, 5), p(75, 5), p(95, 7)],
  A6: [p(5, 4), p(25, 8), p(50, 10), p(75, 11), p(95, 13)],
  A7: [p(5, 5), p(25, 8), p(50, 10), p(75, 11), p(95, 14)],
  EscoreTotal: [p(5, 30), p(25, 40), p(50, 44), p(75, 49), p(95, 58)],
  Reconhecimento: [p(5, 3), p(25, 9), p(50, 11), p(75, 13), p(95, 15)],
  ALT: [p(5, 6), p(25, 13), p(50, 17), p(75, 20), p(95, 27)],
  VelocidadeEsquecimento: [p(5, 0.78), p(25, 0.90), p(50, 1.00), p(75, 1.10), p(95, 1.38)],
  InterferenciaProativa: [p(5, 0.50), p(25, 0.67), p(50, 0.83), p(75, 1.00), p(95, 1.40)],
  InterferenciaRetroativa: [p(5, 0.55), p(25, 0.74), p(50, 0.86), p(75, 0.93), p(95, 1.04)]
};

// Tabela 25: 71-79 anos
const TABLE_71_79: AgeGroupTable = {
  A1: [p(5, 3), p(25, 5), p(50, 5), p(75, 6), p(95, 8)],
  A2: [p(5, 5), p(25, 5), p(50, 7), p(75, 8), p(95, 10)],
  A3: [p(5, 5), p(25, 7), p(50, 8), p(75, 9), p(95, 11)],
  A4: [p(5, 5), p(25, 8), p(50, 9), p(75, 11), p(95, 13)],
  A5: [p(5, 7), p(25, 9), p(50, 10), p(75, 12), p(95, 14)],
  B1: [p(5, 1), p(25, 3), p(50, 4), p(75, 5), p(95, 7)],
  A6: [p(5, 3), p(25, 5), p(50, 7), p(75, 9), p(95, 12)],
  A7: [p(5, 4), p(25, 6), p(50, 8), p(75, 10), p(95, 14)],
  EscoreTotal: [p(5, 25), p(25, 35), p(50, 39), p(75, 44), p(95, 55)],
  Reconhecimento: [p(5, 1), p(25, 6), p(50, 7), p(75, 10), p(95, 14)],
  ALT: [p(5, 4), p(25, 10), p(50, 14), p(75, 18), p(95, 24)],
  VelocidadeEsquecimento: [p(5, 0.25), p(25, 0.60), p(50, 0.80), p(75, 1.00), p(95, 1.75)],
  InterferenciaProativa: [p(5, 0.46), p(25, 0.73), p(50, 0.80), p(75, 0.91), p(95, 1.11)],
  InterferenciaRetroativa: [p(5, 0.73), p(25, 0.88), p(50, 1.00), p(75, 1.11), p(95, 1.50)]
};

// Tabela 26: 80+ anos
const TABLE_80_PLUS: AgeGroupTable = {
  A1: [p(5, 2), p(25, 3), p(50, 4), p(75, 5), p(95, 9)],
  A2: [p(5, 4), p(25, 5), p(50, 6), p(75, 7), p(95, 10)],
  A3: [p(5, 5), p(25, 6), p(50, 7), p(75, 8), p(95, 11)],
  A4: [p(5, 6), p(25, 7), p(50, 8), p(75, 9), p(95, 11)],
  A5: [p(5, 6), p(25, 8), p(50, 10), p(75, 11), p(95, 14)],
  B1: [p(5, 0), p(25, 2), p(50, 3), p(75, 4), p(95, 8)],
  A6: [p(5, 4), p(25, 6), p(50, 7), p(75, 8), p(95, 11)],
  A7: [p(5, 4), p(25, 6), p(50, 6), p(75, 8), p(95, 10)],
  EscoreTotal: [p(5, 24), p(25, 31), p(50, 34), p(75, 36), p(95, 47)],
  Reconhecimento: [p(5, -2), p(25, 3), p(50, 6), p(75, 9), p(95, 14)],
  ALT: [p(5, 5), p(25, 11), p(50, 13), p(75, 17), p(95, 22)],
  VelocidadeEsquecimento: [p(5, 0.64), p(25, 0.75), p(50, 0.89), p(75, 1.00), p(95, 1.20)],
  InterferenciaProativa: [p(5, 0.00), p(25, 0.57), p(50, 0.80), p(75, 1.00), p(95, 1.50)],
  InterferenciaRetroativa: [p(5, 0.45), p(25, 0.67), p(50, 0.78), p(75, 0.89), p(95, 1.13)]
};

/**
 * Retorna a tabela normativa para uma idade específica
 */
export const getTableForAge = (age: number): AgeGroupTable => {
  if (age >= 6 && age <= 8) return TABLE_6_8;
  if (age >= 9 && age <= 11) return TABLE_9_11;
  if (age >= 12 && age <= 14) return TABLE_12_14;
  if (age >= 15 && age <= 17) return TABLE_15_17;
  if (age >= 18 && age <= 20) return TABLE_18_20;
  if (age >= 21 && age <= 30) return TABLE_21_30;
  if (age >= 31 && age <= 40) return TABLE_31_40;
  if (age >= 41 && age <= 50) return TABLE_41_50;
  if (age >= 51 && age <= 60) return TABLE_51_60;
  if (age >= 61 && age <= 70) return TABLE_61_70;
  if (age >= 71 && age <= 79) return TABLE_71_79;
  return TABLE_80_PLUS; // 80+ anos
};

/**
 * Retorna o nome da faixa etária
 */
export const getAgeGroupName = (age: number): string => {
  if (age >= 6 && age <= 8) return '6-8 anos';
  if (age >= 9 && age <= 11) return '9-11 anos';
  if (age >= 12 && age <= 14) return '12-14 anos';
  if (age >= 15 && age <= 17) return '15-17 anos';
  if (age >= 18 && age <= 20) return '18-20 anos';
  if (age >= 21 && age <= 30) return '21-30 anos';
  if (age >= 31 && age <= 40) return '31-40 anos';
  if (age >= 41 && age <= 50) return '41-50 anos';
  if (age >= 51 && age <= 60) return '51-60 anos';
  if (age >= 61 && age <= 70) return '61-70 anos';
  if (age >= 71 && age <= 79) return '71-79 anos';
  return '80+ anos';
};

export type RAVLTVariable = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'B1' | 'A6' | 'A7' | 'EscoreTotal' | 'Reconhecimento' | 'ALT' | 'VelocidadeEsquecimento' | 'InterferenciaProativa' | 'InterferenciaRetroativa';

/**
 * Busca o percentil para uma variável e escore (retorna número)
 */
export const lookupRAVLTPercentile = (
  age: number,
  variable: RAVLTVariable,
  score: number
): number => {
  const table = getTableForAge(age);
  const data = table[variable];
  
  if (!data || data.length === 0) return 50;
  
  // Ordena por percentil (menor para maior)
  const sorted = [...data].sort((a, b) => a.percentile - b.percentile);
  
  // Se o escore for menor que o menor benchmark, retorna 1 (<5)
  if (score < sorted[0].score) return 1;
  
  // Se o escore for maior ou igual ao maior benchmark, retorna 99 (>95)
  if (score >= sorted[sorted.length - 1].score) return 99;
  
  // Encontra o maior percentil cujo score mínimo foi alcançado
  let resultPercentile = 1;
  for (const entry of sorted) {
    if (score >= entry.score) {
      resultPercentile = entry.percentile;
    } else {
      break;
    }
  }
  
  return resultPercentile;
};

/**
 * Busca a faixa percentílica para uma variável e escore (retorna string com faixa)
 * Ex: "<5", "5", "5-25", "25", "25-50", "50", "50-75", "75", "75-95", "95", ">95"
 */
export const lookupRAVLTPercentileRange = (
  age: number,
  variable: RAVLTVariable,
  score: number
): string => {
  const table = getTableForAge(age);
  const data = table[variable];
  
  if (!data || data.length === 0) return '50';
  
  // Ordena por percentil (menor para maior)
  const sorted = [...data].sort((a, b) => a.percentile - b.percentile);
  
  // Se o escore for menor que Pc5, retorna <5
  if (score < sorted[0].score) return '<5';
  
  // Se o escore for maior ou igual a Pc95, retorna >95
  if (score >= sorted[sorted.length - 1].score) return '>95';
  
  // Encontra a faixa
  for (let i = 0; i < sorted.length - 1; i++) {
    if (score >= sorted[i].score && score < sorted[i + 1].score) {
      // Se for exatamente igual ao escore do percentil, retorna o percentil exato
      if (score === sorted[i].score) {
        return String(sorted[i].percentile);
      }
      // Caso contrário, retorna a faixa
      return `${sorted[i].percentile}-${sorted[i + 1].percentile}`;
    }
  }
  
  // Se chegou aqui, é exatamente o último valor antes do 95
  return String(sorted[sorted.length - 1].percentile);
};

/**
 * Classifica com base na faixa percentílica (string)
 * <5 = Inferior
 * 5 = Inferior
 * 5-25 = Médio Inferior
 * 25 = Médio Inferior
 * 25-50 = Médio
 * 50 = Médio
 * 50-75 = Médio
 * 75 = Médio Superior
 * 75-95 = Médio Superior
 * 95 = Superior
 * >95 = Superior
 */
export const getClassificationFromRange = (range: string): string => {
  if (range === '<5' || range === '5') return 'Inferior';
  if (range === '5-25' || range === '25') return 'Médio Inferior';
  if (range === '25-50' || range === '50' || range === '50-75') return 'Médio';
  if (range === '75' || range === '75-95') return 'Médio Superior';
  if (range === '95' || range === '>95') return 'Superior';
  return 'Médio';
};
