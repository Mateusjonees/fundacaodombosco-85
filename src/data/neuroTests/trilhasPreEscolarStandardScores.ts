/**
 * Tabelas de Escores Padrão do Teste de Trilhas Pré-Escolares (TT-P)
 * Dados extraídos das Tabelas 11.2 e 11.4 do manual oficial
 * Faixa etária: 4-6 anos
 * 
 * Escore padrão: média = 100, desvio-padrão = 15
 */

type AgeKey = 4 | 5 | 6;

/**
 * Tabela 11.2: Escores padrão para Sequências na Parte A
 * Estrutura: rawScore -> { idade: escorePadrão }
 */
const TRILHAS_PRE_ESCOLAR_A_STANDARD_SCORES: Record<number, Record<AgeKey, number>> = {
  1: { 4: 92, 5: 78, 6: 74 },
  2: { 4: 101, 5: 86, 6: 84 },
  3: { 4: 109, 5: 95, 6: 93 },
  4: { 4: 117, 5: 103, 6: 102 },
  5: { 4: 125, 5: 112, 6: 111 },
};

/**
 * Tabela 11.4: Escores padrão para Sequências na Parte B
 * Estrutura: rawScore -> { idade: escorePadrão }
 */
const TRILHAS_PRE_ESCOLAR_B_STANDARD_SCORES: Record<number, Record<AgeKey, number>> = {
  1: { 4: 86, 5: 84, 6: 83 },
  2: { 4: 97, 5: 90, 6: 89 },
  3: { 4: 108, 5: 95, 6: 94 },
  4: { 4: 118, 5: 101, 6: 100 },
  5: { 4: 129, 5: 107, 6: 106 },
  6: { 4: 140, 5: 113, 6: 112 },
  7: { 4: 150, 5: 119, 6: 118 },
  8: { 4: 161, 5: 124, 6: 124 },
  9: { 4: 172, 5: 130, 6: 130 },
  10: { 4: 183, 5: 136, 6: 136 },
};

/**
 * Busca o escore padrão para Sequências A
 */
export const lookupTrilhasPreEscolarAStandardScore = (age: number, rawScore: number): number | null => {
  if (age < 4 || age > 6) return null;
  
  const ageKey = Math.floor(age) as AgeKey;
  const scoreEntry = TRILHAS_PRE_ESCOLAR_A_STANDARD_SCORES[rawScore];
  
  if (!scoreEntry) return null;
  
  return scoreEntry[ageKey] ?? null;
};

/**
 * Busca o escore padrão para Sequências B
 */
export const lookupTrilhasPreEscolarBStandardScore = (age: number, rawScore: number): number | null => {
  if (age < 4 || age > 6) return null;
  
  const ageKey = Math.floor(age) as AgeKey;
  const scoreEntry = TRILHAS_PRE_ESCOLAR_B_STANDARD_SCORES[rawScore];
  
  if (!scoreEntry) return null;
  
  return scoreEntry[ageKey] ?? null;
};

/**
 * Retorna o nome da faixa etária para exibição
 */
export const getTrilhasPreEscolarAgeGroupName = (age: number): string => {
  if (age >= 4 && age <= 6) {
    return `${Math.floor(age)} anos`;
  }
  return 'Idade não suportada';
};
