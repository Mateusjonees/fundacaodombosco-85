/**
 * Classificação unificada por percentil — usada por todos os testes neuro
 * que reportam percentis (TFV, BPA-2, FDT) e pelos que derivam percentil
 * a partir do Escore Padrão (TIN, TSBC, Trilhas).
 *
 * Regra (acordada com a equipe clínica):
 *   < 5  => Inferior
 *   = 5  => Inferior
 *   5-25 (aberto) => Média Inferior
 *   = 25 => Média Inferior
 *   25-50 (aberto) => Média
 *   = 50 => Média
 *   50-75 (aberto) => Média
 *   = 75 => Média Superior
 *   75-95 (aberto) => Média Superior
 *   = 95 => Superior
 *   > 95 => Superior
 */

export type PercentileClassification =
  | 'Inferior'
  | 'Média Inferior'
  | 'Média'
  | 'Média Superior'
  | 'Superior'
  | 'Não classificado';

/**
 * Aceita número (50), string com faixa ("25-50"), ou modificadores ("<5", ">95").
 */
export const classifyPercentile = (
  input: number | string | null | undefined
): PercentileClassification => {
  if (input === null || input === undefined || input === '') return 'Não classificado';

  // String com modificadores ou faixa
  if (typeof input === 'string') {
    const s = input.trim();
    if (s.startsWith('<')) {
      const n = parseFloat(s.replace('<', ''));
      if (!isNaN(n) && n <= 5) return 'Inferior';
      return classifyPercentile(n - 0.01);
    }
    if (s.startsWith('>')) {
      const n = parseFloat(s.replace('>', ''));
      if (!isNaN(n) && n >= 95) return 'Superior';
      return classifyPercentile(n + 0.01);
    }
    if (s.includes('-')) {
      // Faixa "a-b" — classifica pelo limite SUPERIOR aberto da faixa.
      // Ex: "5-25" => intervalo aberto (5,25) => Média Inferior
      // Ex: "25-50" => intervalo aberto (25,50) => Média
      const [aStr, bStr] = s.split('-');
      const a = parseFloat(aStr);
      const b = parseFloat(bStr);
      if (isNaN(a) || isNaN(b)) return 'Não classificado';
      // Usa o ponto médio aberto para classificar
      const mid = (a + b) / 2;
      return classifyPercentile(mid);
    }
    const n = parseFloat(s);
    if (isNaN(n)) return 'Não classificado';
    return classifyPercentile(n);
  }

  const p = input;
  if (p < 5) return 'Inferior';
  if (p === 5) return 'Inferior';
  if (p > 5 && p < 25) return 'Média Inferior';
  if (p === 25) return 'Média Inferior';
  if (p > 25 && p < 75) return 'Média';
  if (p === 75) return 'Média Superior';
  if (p > 75 && p < 95) return 'Média Superior';
  if (p === 95) return 'Superior';
  return 'Superior';
};

/**
 * Cor semântica (Tailwind) para cada classificação.
 */
export const getPercentileClassificationColor = (
  classification: string
): string => {
  switch (classification) {
    case 'Superior':
      return 'text-green-600 dark:text-green-400';
    case 'Média Superior':
      return 'text-blue-600 dark:text-blue-400';
    case 'Média':
      return 'text-gray-600 dark:text-gray-400';
    case 'Média Inferior':
      return 'text-orange-600 dark:text-orange-400';
    case 'Inferior':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

/**
 * Converte um percentil numérico para a faixa textual padrão usada nos laudos.
 * Útil para exibir "variação de percentil" ao lado do valor exato.
 */
export const percentileToRange = (p: number): string => {
  if (p < 5) return '<5';
  if (p === 5) return '5';
  if (p < 25) return '5-25';
  if (p === 25) return '25';
  if (p < 50) return '25-50';
  if (p === 50) return '50';
  if (p < 75) return '50-75';
  if (p === 75) return '75';
  if (p < 95) return '75-95';
  if (p === 95) return '95';
  return '>95';
};

/**
 * Recebe um Escore Padrão (M=100, DP=15) e classifica via percentil derivado.
 * Mantém compatibilidade com testes que reportam EP (TIN, TSBC, Trilhas).
 */
export const classifyFromStandardScore = (
  ep: number | null | undefined,
  mean = 100,
  sd = 15
): PercentileClassification => {
  if (ep === null || ep === undefined || isNaN(ep)) return 'Não classificado';
  // Conversão EP → percentil (CDF da normal) — duplicada aqui para evitar
  // dependência circular com src/utils/neuroPercentile.ts em alguns bundlers.
  const z = (ep - mean) / sd;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, pConst = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + pConst * absZ);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);
  const percentile = Math.max(1, Math.min(99, Math.round(0.5 * (1 + sign * y) * 100)));
  return classifyPercentile(percentile);
};
