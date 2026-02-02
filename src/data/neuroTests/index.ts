/**
 * Exportações centralizadas dos testes neuropsicológicos
 */

export * from './bpa2';
export * from './bpa2Percentiles';
export * from './fdt';
export * from './fdtPercentiles';
export * from './ravlt';
export * from './ravltPercentiles';
export * from './tin';
export * from './tinStandardScores';
export * from './pcfo';
export * from './pcfoStandardScores';
export * from './tsbc';
export * from './tsbcStandardScores';
export * from './fva';
export * from './fvaPercentiles';
export * from './bntbr';
export * from './bntbrNorms';
export * from './trilhas';
export * from './trilhasStandardScores';

import { BPA2_TEST, type NeuroTestDefinition } from './bpa2';
import { FDT_TEST } from './fdt';
import { RAVLT_TEST } from './ravlt';
import { TIN_TEST } from './tin';
import { PCFO_TEST } from './pcfo';
import { TSBC_TEST } from './tsbc';
import { FVA_TEST } from './fva';
import { BNTBR_TEST } from './bntbr';
import { TRILHAS_TEST } from './trilhas';

// Lista de todos os testes disponíveis
export const AVAILABLE_NEURO_TESTS: NeuroTestDefinition[] = [
  BPA2_TEST,
  FDT_TEST,
  RAVLT_TEST,
  TIN_TEST,
  PCFO_TEST,
  TSBC_TEST,
  FVA_TEST,
  BNTBR_TEST,
  TRILHAS_TEST
];

/**
 * Busca um teste pelo código
 */
export const getTestByCode = (code: string): NeuroTestDefinition | undefined => {
  return AVAILABLE_NEURO_TESTS.find(test => test.code === code);
};

/**
 * Filtra testes disponíveis para uma determinada idade
 */
export const getTestsForAge = (age: number): NeuroTestDefinition[] => {
  return AVAILABLE_NEURO_TESTS.filter(
    test => age >= test.minAge && age <= test.maxAge
  );
};
