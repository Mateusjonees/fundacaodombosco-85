/**
 * Utilitário para conversão de escores padronizados em percentis
 * Usa a função de distribuição normal acumulada (CDF)
 */

/**
 * Converte Z-score para percentil usando a CDF da distribuição normal
 * Implementação via aproximação de Abramowitz & Stegun
 */
export const zToPercentile = (z: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absZ);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);
  const percentile = Math.round(0.5 * (1.0 + sign * y) * 100);

  return Math.max(1, Math.min(99, percentile));
};

/**
 * Converte Escore Padrão (M=100, DP=15) para percentil
 * Fórmula: Z = (EP - 100) / 15 → CDF(Z) × 100
 */
export const epToPercentile = (ep: number, mean = 100, sd = 15): number => {
  const z = (ep - mean) / sd;
  return zToPercentile(z);
};

/**
 * Converte Escore T (M=50, DP=10) para percentil
 * Fórmula: Z = (T - 50) / 10 → CDF(Z) × 100
 */
export const tScoreToPercentile = (tScore: number): number => {
  const z = (tScore - 50) / 10;
  return zToPercentile(z);
};

/**
 * Retorna a fórmula textual usada para calcular o percentil
 */
export const getPercentileFormula = (type: 'ep' | 'tscore' | 'z', value: number): string => {
  if (type === 'ep') {
    const z = ((value - 100) / 15).toFixed(2);
    const percentile = epToPercentile(value);
    return `Z = (${value} - 100) / 15 = ${z} → Percentil ${percentile}`;
  }
  if (type === 'tscore') {
    const z = ((value - 50) / 10).toFixed(2);
    const percentile = tScoreToPercentile(value);
    return `Z = (${value} - 50) / 10 = ${z} → Percentil ${percentile}`;
  }
  // z direto
  const percentile = zToPercentile(value);
  return `Z = ${value.toFixed(2)} → Percentil ${percentile}`;
};
