import { describe, it, expect } from 'vitest';
import {
  calculateFPTInfantilResults,
  SCHOOL_YEAR_OPTIONS,
  type SchoolYear
} from '@/data/neuroTests/fptInfantil';
import {
  calculateFPTAdultoResults,
  AGE_GROUP_OPTIONS,
  type FPTAdultoAgeGroup
} from '@/data/neuroTests/fptAdulto';

const VALID_CLASSIFICATIONS = [
  'Inferior', 'Média Inferior', 'Média', 'Média Superior', 'Superior'
];

const VALID_METHODS = ['exact', 'floor', 'ceil', 'below_min', 'above_max', 'adjacent'];

describe('FPT Infantil – todas as combinações pontuação × ano escolar', () => {
  const schoolYears = SCHOOL_YEAR_OPTIONS.map(o => o.value);
  const scores = Array.from({ length: 51 }, (_, i) => i);

  for (const year of schoolYears) {
    describe(`Ano escolar: ${year}`, () => {
      for (const score of scores) {
        it(`score=${score} → percentil != null, classificação válida, lookupInfo presente`, () => {
          const result = calculateFPTInfantilResults(score, year);

          expect(result.rawScore).toBe(score);
          expect(result.schoolYear).toBe(year);
          expect(result.percentile).not.toBeNull();
          expect(result.percentile!).toBeGreaterThanOrEqual(1);
          expect(result.percentile!).toBeLessThanOrEqual(99);
          expect(VALID_CLASSIFICATIONS).toContain(result.classification);
          expect(result.lookupInfo).toBeDefined();
          expect(VALID_METHODS).toContain(result.lookupInfo.method);
          expect(result.lookupInfo.description.length).toBeGreaterThan(0);
        });
      }
    });
  }
});

describe('FPT Adulto – todas as combinações pontuação × faixa etária', () => {
  const ageGroups = AGE_GROUP_OPTIONS.map(o => o.value);
  const scores = Array.from({ length: 61 }, (_, i) => i);

  for (const group of ageGroups) {
    describe(`Faixa etária: ${group}`, () => {
      for (const score of scores) {
        it(`score=${score} → percentil != null, classificação válida, lookupInfo presente`, () => {
          const result = calculateFPTAdultoResults(score, group);

          expect(result.rawScore).toBe(score);
          expect(result.ageGroup).toBe(group);
          expect(result.percentile).not.toBeNull();
          expect(result.percentile!).toBeGreaterThanOrEqual(1);
          expect(result.percentile!).toBeLessThanOrEqual(99);
          expect(VALID_CLASSIFICATIONS).toContain(result.classification);
          expect(result.lookupInfo).toBeDefined();
          expect(VALID_METHODS).toContain(result.lookupInfo.method);
          expect(result.lookupInfo.description.length).toBeGreaterThan(0);
        });
      }
    });
  }
});
