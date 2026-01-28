/**
 * Definição do Teste BPA-2 (Bateria Psicológica para Avaliação da Atenção)
 * Faixa etária: 6-81+ anos
 */

export interface NeuroTestSubtest {
  code: string;
  name: string;
  fields: string[];
  formula: string;
}

export interface NeuroTestDefinition {
  code: string;
  name: string;
  fullName: string;
  description: string;
  minAge: number;
  maxAge: number;
  subtests: NeuroTestSubtest[];
  calculatedScores: { code: string; name: string; formula: string }[];
}

export const BPA2_TEST: NeuroTestDefinition = {
  code: 'BPA2',
  name: 'BPA-2',
  fullName: 'Bateria Psicológica para Avaliação da Atenção - 2ª Edição',
  description: 'Avalia diferentes tipos de atenção: concentrada, dividida, alternada e atenção geral.',
  minAge: 6,
  maxAge: 81,
  subtests: [
    {
      code: 'AC',
      name: 'Atenção Concentrada',
      fields: ['acertos', 'erros', 'omissoes'],
      formula: 'acertos - (erros + omissoes)'
    },
    {
      code: 'AD',
      name: 'Atenção Dividida',
      fields: ['acertos', 'erros', 'omissoes'],
      formula: 'acertos - (erros + omissoes)'
    },
    {
      code: 'AA',
      name: 'Atenção Alternada',
      fields: ['acertos', 'erros', 'omissoes'],
      formula: 'acertos - (erros + omissoes)'
    }
  ],
  calculatedScores: [
    {
      code: 'AG',
      name: 'Atenção Geral',
      formula: 'AC + AD + AA'
    }
  ]
};

/**
 * Calcula o escore de um subteste
 */
export const calculateSubtestScore = (acertos: number, erros: number, omissoes: number): number => {
  return acertos - (erros + omissoes);
};

/**
 * Calcula a Atenção Geral (soma de AC + AD + AA)
 */
export const calculateAG = (ac: number, ad: number, aa: number): number => {
  return ac + ad + aa;
};

/**
 * Retorna a classificação baseada no percentil
 */
export const getClassification = (percentile: number): string => {
  if (percentile <= 1) return 'Muito Inferior';
  if (percentile <= 5) return 'Inferior';
  if (percentile <= 10) return 'Inferior';
  if (percentile <= 25) return 'Médio Inferior';
  if (percentile <= 75) return 'Médio';
  if (percentile <= 90) return 'Médio Superior';
  if (percentile <= 95) return 'Superior';
  return 'Muito Superior';
};

/**
 * Idades disponíveis para consulta de percentis
 */
export const AVAILABLE_AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81];
