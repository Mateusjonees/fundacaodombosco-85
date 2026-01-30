/**
 * Exportações centralizadas dos testes neuropsicológicos
 */

export * from './bpa2';
export * from './bpa2Percentiles';
export * from './fdt';
export * from './fdtPercentiles';
export * from './ravlt';
export * from './ravltPercentiles';

import { BPA2_TEST, type NeuroTestDefinition } from './bpa2';
import { FDT_TEST } from './fdt';
import { RAVLT_TEST } from './ravlt';

// Lista de todos os testes disponíveis
export const AVAILABLE_NEURO_TESTS: NeuroTestDefinition[] = [
  BPA2_TEST,
  FDT_TEST,
  RAVLT_TEST
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
