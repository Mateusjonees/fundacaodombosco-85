/**
 * Tabelas normativas para o teste BNT-BR (Teste de Nomeação de Boston - 30 itens)
 * 
 * Fontes:
 * - Adultos (n=150, idade média 29 anos): de Paula et al. (em preparo)
 * - Várias idades: Mioto et al. (2010) / de Paula et al. (em preparo)
 */

interface BNTBRNormData {
  mean: number;  // Média
  sd: number;    // Desvio Padrão
}

interface BNTBRAgeRange {
  minAge: number;
  maxAge: number;
  norms: BNTBRNormData;
}

// Normas por faixa etária (BNT-BR 30 itens)
// Dados extraídos da tabela do manual (colunas para 30 itens)
const AGE_NORMS: BNTBRAgeRange[] = [
  { minAge: 6, maxAge: 9, norms: { mean: 17.7, sd: 6.5 } },
  { minAge: 10, maxAge: 14, norms: { mean: 20.8, sd: 7.95 } },
  { minAge: 15, maxAge: 19, norms: { mean: 23.9, sd: 6.05 } },
  { minAge: 20, maxAge: 24, norms: { mean: 21.1, sd: 10.3 } },
  { minAge: 25, maxAge: 34, norms: { mean: 22.1, sd: 9.5 } },
  { minAge: 35, maxAge: 44, norms: { mean: 24.25, sd: 7.65 } },
  { minAge: 45, maxAge: 54, norms: { mean: 22.2, sd: 9.2 } },
  { minAge: 55, maxAge: 64, norms: { mean: 25.85, sd: 4.45 } },
  { minAge: 65, maxAge: 74, norms: { mean: 24.3, sd: 5 } },
  { minAge: 75, maxAge: 99, norms: { mean: 20.4, sd: 6.05 } }
];

/**
 * Obtém as normas para uma idade específica
 */
export const getNormsForAge = (age: number): BNTBRNormData | null => {
  const ageNorm = AGE_NORMS.find(
    range => age >= range.minAge && age <= range.maxAge
  );
  
  return ageNorm?.norms || null;
};

/**
 * Converte Z-score para percentil usando a tabela normal padrão
 * Aproximação baseada na função de distribuição cumulativa normal
 */
const zScoreToPercentile = (z: number): number => {
  // Usando aproximação polinomial para a CDF normal
  // Limita o z-score para evitar valores extremos
  const clampedZ = Math.max(-4, Math.min(4, z));
  
  // Constantes para a aproximação
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = clampedZ < 0 ? -1 : 1;
  const absZ = Math.abs(clampedZ) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);
  
  const cdf = 0.5 * (1.0 + sign * y);
  
  // Converte para percentil (1-99)
  return Math.round(Math.max(1, Math.min(99, cdf * 100)));
};

/**
 * Calcula os resultados do BNT-BR para uma idade específica
 */
export const calculateBNTBRResults = (
  age: number,
  acertos: number
): {
  pontuacao: number;
  zScore: number;
  percentil: number;
} | null => {
  const norms = getNormsForAge(age);
  
  if (!norms) {
    return null;
  }
  
  // Pontuação = Total de acertos
  const pontuacao = acertos;
  
  // Z-score = (Acertos - Média) / Desvio Padrão
  const zScore = (acertos - norms.mean) / norms.sd;
  
  // Converte Z-score para percentil
  const percentil = zScoreToPercentile(zScore);
  
  return {
    pontuacao,
    zScore: Math.round(zScore * 100) / 100, // Arredonda para 2 casas decimais
    percentil
  };
};

/**
 * Retorna informações sobre a faixa etária usada para o cálculo
 */
export const getAgeRangeInfo = (age: number): string => {
  const ageRange = AGE_NORMS.find(
    range => age >= range.minAge && age <= range.maxAge
  );
  
  if (ageRange) {
    return `${ageRange.minAge}-${ageRange.maxAge} anos (M=${ageRange.norms.mean}, DP=${ageRange.norms.sd})`;
  }
  
  return 'Faixa etária não encontrada';
};
