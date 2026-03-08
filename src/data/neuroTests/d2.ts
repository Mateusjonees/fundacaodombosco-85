/**
 * D2 - Teste de Atenção Concentrada
 * Avalia atenção sustentada e concentrada
 * Faixa etária: 9-52 anos
 * Referência: Brickenkamp (2000) - Adaptação brasileira
 */

import type { NeuroTestDefinition } from './bpa2';

export interface D2Results {
  rawScores: {
    totalProcessados: number;
    acertos: number;
    errosE1: number; // comissão
    errosE2: number; // omissão
  };
  calculatedScores: {
    rl: number;      // resultado líquido = total - (E1 + E2)
    erroPerc: number; // E% = ((E1 + E2) / total) * 100
    ic: number;       // índice concentração = acertos - E1
    totalErros: number;
  };
  percentiles: {
    rl: number;
    ic: number;
  };
  classifications: {
    rl: string;
    ic: string;
  };
  ageGroup: string;
  notes: string;
}

export const D2_TEST: NeuroTestDefinition = {
  code: 'D2',
  name: 'D2 - Atenção Concentrada',
  fullName: 'D2 - Teste de Atenção Concentrada',
  description: 'Avalia atenção sustentada e concentrada, velocidade de processamento e precisão.',
  minAge: 9,
  maxAge: 52,
  subtests: [
    { code: 'RL', name: 'Resultado Líquido', fields: ['total', 'erros'], formula: 'Total processados - (E1 + E2)' },
    { code: 'IC', name: 'Índice de Concentração', fields: ['acertos', 'E1'], formula: 'Acertos - E1' }
  ],
  calculatedScores: [
    { code: 'RL_PERC', name: 'Percentil RL', formula: 'Lookup por faixa etária' },
    { code: 'IC_PERC', name: 'Percentil IC', formula: 'Lookup por faixa etária' }
  ]
};

interface D2Norms { rl: { mean: number; sd: number }; ic: { mean: number; sd: number } }

// Normas brasileiras por faixa etária (Brickenkamp, adaptação brasileira)
const D2_NORMS: Record<string, D2Norms> = {
  '9-10':  { rl: { mean: 220, sd: 55 }, ic: { mean: 85, sd: 28 } },
  '11-12': { rl: { mean: 280, sd: 60 }, ic: { mean: 110, sd: 30 } },
  '13-14': { rl: { mean: 330, sd: 65 }, ic: { mean: 130, sd: 32 } },
  '15-17': { rl: { mean: 380, sd: 60 }, ic: { mean: 155, sd: 30 } },
  '18-25': { rl: { mean: 420, sd: 55 }, ic: { mean: 175, sd: 28 } },
  '26-35': { rl: { mean: 410, sd: 58 }, ic: { mean: 170, sd: 30 } },
  '36-45': { rl: { mean: 390, sd: 60 }, ic: { mean: 160, sd: 32 } },
  '46-52': { rl: { mean: 370, sd: 62 }, ic: { mean: 148, sd: 34 } },
};

const getAgeGroup = (age: number): string => {
  if (age <= 10) return '9-10';
  if (age <= 12) return '11-12';
  if (age <= 14) return '13-14';
  if (age <= 17) return '15-17';
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  return '46-52';
};

const zToPercentile = (z: number): number => {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return Math.round(0.5 * (1.0 + sign * y) * 100);
};

const getClassification = (percentile: number): string => {
  if (percentile <= 5) return 'Muito Baixo';
  if (percentile <= 10) return 'Baixo';
  if (percentile <= 25) return 'Médio Inferior';
  if (percentile <= 75) return 'Médio';
  if (percentile <= 90) return 'Médio Superior';
  if (percentile <= 95) return 'Alto';
  return 'Muito Alto';
};

export const calculateD2Results = (
  totalProcessados: number,
  acertos: number,
  errosE1: number,
  errosE2: number,
  age: number
): D2Results => {
  const ageGroup = getAgeGroup(age);
  const norms = D2_NORMS[ageGroup];

  const totalErros = errosE1 + errosE2;
  const rl = totalProcessados - totalErros;
  const erroPerc = totalProcessados > 0 ? ((totalErros / totalProcessados) * 100) : 0;
  const ic = acertos - errosE1;

  const zRL = (rl - norms.rl.mean) / norms.rl.sd;
  const zIC = (ic - norms.ic.mean) / norms.ic.sd;

  const percRL = zToPercentile(zRL);
  const percIC = zToPercentile(zIC);

  return {
    rawScores: { totalProcessados, acertos, errosE1, errosE2 },
    calculatedScores: { rl, erroPerc: Math.round(erroPerc * 10) / 10, ic, totalErros },
    percentiles: { rl: percRL, ic: percIC },
    classifications: { rl: getClassification(percRL), ic: getClassification(percIC) },
    ageGroup,
    notes: `Faixa: ${ageGroup} anos | RL: M=${norms.rl.mean} DP=${norms.rl.sd}`
  };
};
