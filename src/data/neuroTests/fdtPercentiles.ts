/**
 * Tabelas normativas do FDT (Five Digit Test)
 * Dados extraídos do manual oficial - Tabelas 6.3 a 6.11
 * Faixa etária: 6-76+ anos
 * 
 * IMPORTANTE: No FDT, valores MENORES são melhores (tempo mais rápido = melhor desempenho)
 * Por isso os percentis estão invertidos comparado ao RAVLT
 */

interface PercentileEntry {
  percentile: number;
  score: number;
}

interface FDTAgeGroupTable {
  leitura: PercentileEntry[];
  contagem: PercentileEntry[];
  escolha: PercentileEntry[];
  alternancia: PercentileEntry[];
  inibicao: PercentileEntry[];
  flexibilidade: PercentileEntry[];
}

export type FDTVariable = 'leitura' | 'contagem' | 'escolha' | 'alternancia' | 'inibicao' | 'flexibilidade';

// Helper para criar entrada de percentil
const p = (percentile: number, score: number): PercentileEntry => ({ percentile, score });

// Tabela 6.3: 6-8 anos (N=44)
const TABLE_6_8: FDTAgeGroupTable = {
  leitura: [p(95, 25), p(75, 29), p(50, 34), p(25, 39), p(5, 48)],
  contagem: [p(95, 32), p(75, 40), p(50, 48), p(25, 56), p(5, 83)],
  escolha: [p(95, 41), p(75, 66), p(50, 79), p(25, 94), p(5, 109)],
  alternancia: [p(95, 58), p(75, 75), p(50, 91), p(25, 113), p(5, 133)],
  inibicao: [p(95, 17), p(75, 31), p(50, 43), p(25, 55), p(5, 76)],
  flexibilidade: [p(95, 26), p(75, 41), p(50, 55), p(25, 75), p(5, 92)]
};

// Tabela 6.4: 9-10 anos (N=129)
const TABLE_9_10: FDTAgeGroupTable = {
  leitura: [p(95, 22), p(75, 26), p(50, 29), p(25, 32), p(5, 38)],
  contagem: [p(95, 28), p(75, 34), p(50, 39), p(25, 43), p(5, 52)],
  escolha: [p(95, 46), p(75, 56), p(50, 63), p(25, 73), p(5, 88)],
  alternancia: [p(95, 54), p(75, 67), p(50, 75), p(25, 87), p(5, 101)],
  inibicao: [p(95, 19), p(75, 28), p(50, 35), p(25, 42), p(5, 57)],
  flexibilidade: [p(95, 28), p(75, 39), p(50, 46), p(25, 57), p(5, 73)]
};

// Tabela 6.5: 11-12 anos (N=59)
const TABLE_11_12: FDTAgeGroupTable = {
  leitura: [p(95, 20), p(75, 24), p(50, 27), p(25, 32), p(5, 47)],
  contagem: [p(95, 25), p(75, 32), p(50, 36), p(25, 44), p(5, 54)],
  escolha: [p(95, 38), p(75, 48), p(50, 56), p(25, 62), p(5, 93)],
  alternancia: [p(95, 46), p(75, 55), p(50, 66), p(25, 73), p(5, 96)],
  inibicao: [p(95, 12), p(75, 20), p(50, 28), p(25, 35), p(5, 51)],
  flexibilidade: [p(95, 16), p(75, 30), p(50, 39), p(25, 44), p(5, 68)]
};

// Tabela 6.6: 13-15 anos (N=46)
const TABLE_13_15: FDTAgeGroupTable = {
  leitura: [p(95, 17), p(75, 20), p(50, 23), p(25, 26), p(5, 34)],
  contagem: [p(95, 21), p(75, 24), p(50, 28), p(25, 35), p(5, 44)],
  escolha: [p(95, 33), p(75, 40), p(50, 45), p(25, 53), p(5, 68)],
  alternancia: [p(95, 36), p(75, 46), p(50, 53), p(25, 67), p(5, 81)],
  inibicao: [p(95, 8), p(75, 19), p(50, 23.5), p(25, 29), p(5, 42)],
  flexibilidade: [p(95, 14), p(75, 25), p(50, 32), p(25, 41), p(5, 53)]
};

// Tabela 6.7: 16-18 anos (N=44)
const TABLE_16_18: FDTAgeGroupTable = {
  leitura: [p(95, 16), p(75, 17), p(50, 20), p(25, 23), p(5, 29)],
  contagem: [p(95, 19), p(75, 21), p(50, 24), p(25, 26), p(5, 30)],
  escolha: [p(95, 25), p(75, 29), p(50, 33), p(25, 39), p(5, 44)],
  alternancia: [p(95, 34), p(75, 38), p(50, 42), p(25, 51), p(5, 63)],
  inibicao: [p(95, 6), p(75, 10.5), p(50, 13), p(25, 16.5), p(5, 22)],
  flexibilidade: [p(95, 16), p(75, 19), p(50, 22), p(25, 27), p(5, 44)]
};

// Tabela 6.8: 19-34 anos (N=349)
const TABLE_19_34: FDTAgeGroupTable = {
  leitura: [p(95, 16), p(75, 19), p(50, 21), p(25, 25), p(5, 31)],
  contagem: [p(95, 19), p(75, 22), p(50, 24), p(25, 27), p(5, 34)],
  escolha: [p(95, 27), p(75, 31), p(50, 35), p(25, 40), p(5, 52)],
  alternancia: [p(95, 33), p(75, 38), p(50, 44), p(25, 50), p(5, 64)],
  inibicao: [p(95, 5), p(75, 11), p(50, 14), p(25, 18), p(5, 28)],
  flexibilidade: [p(95, 10), p(75, 17), p(50, 22), p(25, 29), p(5, 42)]
};

// Tabela 6.9: 35-59 anos (N=261)
const TABLE_35_59: FDTAgeGroupTable = {
  leitura: [p(95, 17), p(75, 20), p(50, 23), p(25, 26), p(5, 37)],
  contagem: [p(95, 19), p(75, 22), p(50, 26), p(25, 30), p(5, 40)],
  escolha: [p(95, 28), p(75, 32), p(50, 39), p(25, 46), p(5, 65)],
  alternancia: [p(95, 34), p(75, 43), p(50, 48), p(25, 60), p(5, 89)],
  inibicao: [p(95, 5), p(75, 11), p(50, 15), p(25, 21), p(5, 38)],
  flexibilidade: [p(95, 14), p(75, 20), p(50, 26), p(25, 34), p(5, 55)]
};

// Tabela 6.10: 60-75 anos (N=146)
const TABLE_60_75: FDTAgeGroupTable = {
  leitura: [p(95, 18), p(75, 22), p(50, 25), p(25, 30), p(5, 37)],
  contagem: [p(95, 21), p(75, 25), p(50, 28), p(25, 33), p(5, 41)],
  escolha: [p(95, 30), p(75, 39), p(50, 46), p(25, 53), p(5, 68)],
  alternancia: [p(95, 41), p(75, 52), p(50, 62), p(25, 78), p(5, 93)],
  inibicao: [p(95, 9), p(75, 15), p(50, 19.5), p(25, 26), p(5, 39)],
  flexibilidade: [p(95, 18), p(75, 28), p(50, 35), p(25, 49), p(5, 63)]
};

// Tabela 6.11: 76+ anos (N=55)
const TABLE_76_PLUS: FDTAgeGroupTable = {
  leitura: [p(95, 20), p(75, 25), p(50, 29), p(25, 34), p(5, 38)],
  contagem: [p(95, 21), p(75, 26), p(50, 31), p(25, 36), p(5, 46)],
  escolha: [p(95, 33), p(75, 44), p(50, 49), p(25, 62), p(5, 96)],
  alternancia: [p(95, 48), p(75, 61), p(50, 74), p(25, 89), p(5, 108)],
  inibicao: [p(95, 7), p(75, 16), p(50, 21), p(25, 29), p(5, 63)],
  flexibilidade: [p(95, 22), p(75, 35), p(50, 43), p(25, 56), p(5, 71)]
};

/**
 * Retorna a tabela normativa apropriada para a idade
 */
export const getFDTTableForAge = (age: number): FDTAgeGroupTable => {
  if (age >= 6 && age <= 8) return TABLE_6_8;
  if (age >= 9 && age <= 10) return TABLE_9_10;
  if (age >= 11 && age <= 12) return TABLE_11_12;
  if (age >= 13 && age <= 15) return TABLE_13_15;
  if (age >= 16 && age <= 18) return TABLE_16_18;
  if (age >= 19 && age <= 34) return TABLE_19_34;
  if (age >= 35 && age <= 59) return TABLE_35_59;
  if (age >= 60 && age <= 75) return TABLE_60_75;
  if (age >= 76) return TABLE_76_PLUS;
  
  // Default para idades fora do range (usa tabela adulta)
  return TABLE_19_34;
};

/**
 * Retorna o nome da faixa etária para exibição
 */
export const getFDTAgeGroupName = (age: number): string => {
  if (age >= 6 && age <= 8) return '6-8 anos';
  if (age >= 9 && age <= 10) return '9-10 anos';
  if (age >= 11 && age <= 12) return '11-12 anos';
  if (age >= 13 && age <= 15) return '13-15 anos';
  if (age >= 16 && age <= 18) return '16-18 anos';
  if (age >= 19 && age <= 34) return '19-34 anos';
  if (age >= 35 && age <= 59) return '35-59 anos';
  if (age >= 60 && age <= 75) return '60-75 anos';
  if (age >= 76) return '76+ anos';
  return 'Idade não suportada';
};

/**
 * Busca o percentil para um escore no FDT
 * LÓGICA INVERTIDA: valores menores = melhor desempenho = percentil maior
 */
export const lookupFDTPercentile = (
  age: number,
  variable: FDTVariable,
  score: number
): number => {
  const table = getFDTTableForAge(age);
  const data = table[variable];
  
  // Ordenar do maior percentil (menor score) para menor percentil (maior score)
  const sorted = [...data].sort((a, b) => b.percentile - a.percentile);
  
  // Se score for menor ou igual ao benchmark do Pc.95, retorna 99
  if (score <= sorted[0].score) return 99;
  
  // Se score for maior que o benchmark do Pc.5, retorna 1
  if (score > sorted[sorted.length - 1].score) return 1;
  
  // Encontra o percentil onde o score se encaixa
  for (let i = 0; i < sorted.length; i++) {
    if (score <= sorted[i].score) {
      return sorted[i].percentile;
    }
  }
  
  return 1;
};

/**
 * Retorna a classificação clínica baseada no percentil
 * Mesma escala do RAVLT
 */
export const getFDTClassification = (percentile: number): string => {
  if (percentile < 5) return 'Inferior';
  if (percentile <= 5) return 'Inferior';
  if (percentile > 5 && percentile < 25) return 'Médio Inferior';
  if (percentile === 25) return 'Médio Inferior';
  if (percentile > 25 && percentile < 75) return 'Médio';
  if (percentile === 75) return 'Médio Superior';
  if (percentile > 75 && percentile < 95) return 'Médio Superior';
  if (percentile >= 95) return 'Superior';
  return 'Médio';
};

/**
 * Retorna cor CSS para a classificação
 */
export const getFDTClassificationColor = (classification: string): string => {
  switch (classification) {
    case 'Superior':
      return 'text-green-600 dark:text-green-400';
    case 'Médio Superior':
      return 'text-blue-600 dark:text-blue-400';
    case 'Médio':
      return 'text-gray-600 dark:text-gray-400';
    case 'Médio Inferior':
      return 'text-orange-600 dark:text-orange-400';
    case 'Inferior':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};
