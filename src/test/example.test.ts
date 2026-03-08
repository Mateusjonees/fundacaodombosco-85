import { describe, it, expect } from "vitest";

describe("example", () => {
  it("should pass basic assertion", () => {
    expect(true).toBe(true);
  });

  it("should calculate age correctly", () => {
    const getAge = (birthDate: string): number | null => {
      if (!birthDate) return null;
      const bd = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - bd.getFullYear();
      const monthDiff = today.getMonth() - bd.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) age--;
      return age;
    };

    expect(getAge("2020-01-01")).toBeGreaterThanOrEqual(5);
    expect(getAge("2000-01-01")).toBeGreaterThanOrEqual(25);
    expect(getAge("")).toBeNull();
  });
});
