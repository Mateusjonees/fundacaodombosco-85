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
export * from './trilhasPreEscolar';
export * from './trilhasPreEscolarStandardScores';
export * from './fas';
export * from './haylingAdulto';
export * from './haylingInfantil';
export * from './tom';
export * from './taylor';
export * from './trpp';
// FPT Infantil exports
export {
  FPT_INFANTIL_TEST,
  SCHOOL_YEAR_OPTIONS,
  calculateFPTInfantilResults,
  isAgeValidForFPTInfantil,
  lookupFPTInfantilPercentile,
  getFPTInfantilClassification
} from './fptInfantil';
export type {
  SchoolYear as FPTSchoolYear,
  FPTInfantilResults
} from './fptInfantil';
// FPT Adulto exports
export {
  FPT_ADULTO_TEST,
  AGE_GROUP_OPTIONS as FPT_ADULTO_AGE_GROUP_OPTIONS,
  calculateFPTAdultoResults,
  isAgeValidForFPTAdulto,
  getAgeGroupForFPTAdulto,
  lookupFPTAdultoPercentile,
  getFPTAdultoClassification
} from './fptAdulto';
export type {
  FPTAdultoAgeGroup,
  FPTAdultoResults
} from './fptAdulto';
// TFV exports (avoiding conflicts with SchoolType and lookupPercentile)
export { 
  TFV_TEST, 
  calculateTFVResults,
  isAgeValidForTFV,
  lookupTFVPercentile,
  getClassificationFromPercentile as getTFVClassification
} from './tfv';
export type { 
  TFVResults, 
  TFVSchoolType
} from './tfv';
// TMT Adulto exports (avoiding conflicts with getAgeGroup)
export { 
  TMT_ADULTO_TEST, 
  EDUCATION_LEVELS,
  getClassificationFromPercentile,
  type EducationLevel,
  type AgeGroup as TMTAgeGroup,
  type TMTAdultoResults
} from './tmtAdulto';
export {
  calculateTMTAdultoResults,
  getTMTAdultoAgeGroupName,
  isAgeValidForTMTAdulto,
  lookupTMTATempoPercentile,
  lookupTMTBTempoPercentile,
  lookupTMTBATempoPercentile
} from './tmtAdultoPercentiles';

import { BPA2_TEST, type NeuroTestDefinition } from './bpa2';
import { FDT_TEST } from './fdt';
import { RAVLT_TEST } from './ravlt';
import { TIN_TEST } from './tin';
import { PCFO_TEST } from './pcfo';
import { TSBC_TEST } from './tsbc';
import { FVA_TEST } from './fva';
import { BNTBR_TEST } from './bntbr';
import { TRILHAS_TEST } from './trilhas';
import { TMT_ADULTO_TEST } from './tmtAdulto';
import { TRILHAS_PRE_ESCOLAR_TEST } from './trilhasPreEscolar';
import { FAS_TEST } from './fas';
import { HAYLING_ADULTO_TEST } from './haylingAdulto';
import { HAYLING_INFANTIL_TEST } from './haylingInfantil';
import { TFV_TEST } from './tfv';
import { TOM_TEST } from './tom';
import { TAYLOR_TEST } from './taylor';
import { TRPP_TEST } from './trpp';
import { FPT_INFANTIL_TEST } from './fptInfantil';
import { FPT_ADULTO_TEST } from './fptAdulto';

// Definições de testes de cálculo manual (percentil e z-score)
const MANUAL_CALC_TESTS: NeuroTestDefinition[] = [
  // Testes baseados em Percentil
  { code: 'CALC_FVA', name: 'FVA (Cálculo Manual)', fullName: 'Fluência Verbal Animais - Cálculo Manual', description: 'Cálculo manual de percentil', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_TFV', name: 'TFV (Cálculo Manual)', fullName: 'Teste de Fluência Verbal - Cálculo Manual', description: 'Cálculo manual de percentil', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_TMT', name: 'TMT (Cálculo Manual)', fullName: 'Trail Making Test - Cálculo Manual', description: 'Cálculo manual de percentil', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_FPT_ADULTO', name: 'FPT Adulto (Cálculo Manual)', fullName: 'Five-Point Test Adulto - Cálculo Manual', description: 'Cálculo manual de percentil', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_HAYLING_INFANTIL', name: 'Hayling Infantil (Cálculo Manual)', fullName: 'Hayling Infantil - Cálculo Manual', description: 'Cálculo manual de percentil', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  // Testes baseados em Z-Score
  { code: 'CALC_BNTBR', name: 'BNT-BR (Cálculo Manual)', fullName: 'Boston Naming Test - Cálculo Manual', description: 'Cálculo manual de Z-Score', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_SPAN_DIGITOS', name: 'Span de Dígitos (Cálculo Manual)', fullName: 'Span de Dígitos - Cálculo Manual', description: 'Cálculo manual de Z-Score', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_CUBOS_CORSI', name: 'Cubos de Corsi (Cálculo Manual)', fullName: 'Cubos de Corsi - Cálculo Manual', description: 'Cálculo manual de Z-Score', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_HAYLING_ADULTO', name: 'Hayling Adulto (Cálculo Manual)', fullName: 'Hayling Adulto - Cálculo Manual', description: 'Cálculo manual de Z-Score', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_TAYLOR', name: 'Taylor (Cálculo Manual)', fullName: 'Figura Complexa de Taylor - Cálculo Manual', description: 'Cálculo manual de Z-Score', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_TOM', name: 'TOM (Cálculo Manual)', fullName: 'Teoria da Mente - Cálculo Manual', description: 'Cálculo manual de Z-Score', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
  { code: 'CALC_FAS', name: 'FAS (Cálculo Manual)', fullName: 'Fluência Fonêmica FAS - Cálculo Manual', description: 'Cálculo manual de Z-Score', minAge: 0, maxAge: 99, subtests: [], calculatedScores: [] },
];

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
  TRILHAS_TEST,
  TMT_ADULTO_TEST,
  TRILHAS_PRE_ESCOLAR_TEST,
  FAS_TEST,
  HAYLING_ADULTO_TEST,
  HAYLING_INFANTIL_TEST,
  TFV_TEST as unknown as NeuroTestDefinition,
  TOM_TEST,
  TAYLOR_TEST,
  TRPP_TEST,
  FPT_INFANTIL_TEST,
  FPT_ADULTO_TEST,
  ...MANUAL_CALC_TESTS,
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

/**
 * Verifica se o teste é de cálculo manual
 */
export const isManualCalcTest = (testCode: string): boolean => {
  return testCode.startsWith('CALC_');
};
