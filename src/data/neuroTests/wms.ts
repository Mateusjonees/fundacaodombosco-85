/**
 * WMS - Wechsler Memory Scale
 * Avalia memória em múltiplos domínios
 * Faixa etária: 16-89 anos
 * Referência: Wechsler (2009) - WMS-IV
 */

import type { NeuroTestDefinition } from './bpa2';

export interface WMSResults {
  rawScores: {
    memoriaImediata: number;
    memoriaTargia: number;
    memoriaTrabalho: number;
    reconhecimentoVisual: number;
  };
  classifications: {
    memoriaImediata: string;
    memoriaTargia: string;
    memoriaTrabalho: string;
    reconhecimentoVisual: string;
  };
  notes: string;
}

export const WMS_TEST: NeuroTestDefinition = {
  code: 'WMS',
  name: 'WMS (Memória Wechsler)',
  fullName: 'WMS-IV - Escala de Memória Wechsler',
  description: 'Avalia memória em múltiplos domínios: imediata, tardia, de trabalho e reconhecimento visual.',
  minAge: 16,
  maxAge: 89,
  subtests: [
    { code: 'MI', name: 'Memória Imediata', fields: ['score'], formula: 'Índice padronizado (M=100, DP=15)' },
    { code: 'MT', name: 'Memória Tardia', fields: ['score'], formula: 'Índice padronizado (M=100, DP=15)' },
    { code: 'MTRAB', name: 'Memória de Trabalho', fields: ['score'], formula: 'Índice padronizado (M=100, DP=15)' },
    { code: 'RV', name: 'Reconhecimento Visual', fields: ['score'], formula: 'Índice padronizado (M=100, DP=15)' }
  ],
  calculatedScores: [
    { code: 'CLASS', name: 'Classificação', formula: 'Classificação por faixa de índice (M=100, DP=15)' }
  ]
};

export const getWMSClassification = (score: number): string => {
  if (score <= 69) return 'Extremamente Baixo';
  if (score <= 79) return 'Limítrofe';
  if (score <= 89) return 'Médio Inferior';
  if (score <= 109) return 'Médio';
  if (score <= 119) return 'Médio Superior';
  if (score <= 129) return 'Superior';
  return 'Muito Superior';
};

export const calculateWMSResults = (
  memoriaImediata: number,
  memoriaTargia: number,
  memoriaTrabalho: number,
  reconhecimentoVisual: number
): WMSResults => {
  return {
    rawScores: { memoriaImediata, memoriaTargia, memoriaTrabalho, reconhecimentoVisual },
    classifications: {
      memoriaImediata: getWMSClassification(memoriaImediata),
      memoriaTargia: getWMSClassification(memoriaTargia),
      memoriaTrabalho: getWMSClassification(memoriaTrabalho),
      reconhecimentoVisual: getWMSClassification(reconhecimentoVisual)
    },
    notes: `MI=${memoriaImediata} | MT=${memoriaTargia} | MTrab=${memoriaTrabalho} | RV=${reconhecimentoVisual}`
  };
};
