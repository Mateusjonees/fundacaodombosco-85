/**
 * Tabelas normativas para o teste FVA (Fluência Verbal Alternada)
 * 
 * Fontes:
 * - Adolescentes/Adultos (13-70 anos): de Paula et al. (2017)
 * - Crianças (7-10 anos): Malloy-Diniz et al. (2007)
 */

interface FVANormData {
  pc5?: number;
  pc10?: number;
  pc25: number;
  pc50: number;
  pc75: number;
  pc90?: number;
  pc95?: number;
}

interface FVAAgeNorms {
  animais: FVANormData;
  frutas?: FVANormData;
  pares?: FVANormData;
}

// Normas para crianças (apenas animais disponível)
const CHILDREN_NORMS: Record<number, FVAAgeNorms> = {
  7: {
    animais: { pc10: 7, pc25: 10, pc50: 13, pc75: 14, pc90: 15 }
  },
  8: {
    animais: { pc10: 9, pc25: 11, pc50: 12, pc75: 15, pc90: 18 }
  },
  9: {
    animais: { pc10: 10, pc25: 12, pc50: 14, pc75: 16, pc90: 19 }
  },
  10: {
    animais: { pc10: 11, pc25: 12, pc50: 14, pc75: 17, pc90: 18 }
  }
};

// Normas para adolescentes e adultos
interface AdultAgeRange {
  minAge: number;
  maxAge: number;
  norms: FVAAgeNorms;
}

const ADULT_NORMS: AdultAgeRange[] = [
  {
    minAge: 13,
    maxAge: 18,
    norms: {
      animais: { pc5: 11, pc25: 14, pc50: 17, pc75: 21, pc95: 27 },
      frutas: { pc5: 8, pc25: 12, pc50: 14, pc75: 18, pc95: 21 },
      pares: { pc5: 5, pc25: 6, pc50: 7, pc75: 9, pc95: 11 }
    }
  },
  {
    minAge: 19,
    maxAge: 25,
    norms: {
      animais: { pc5: 11, pc25: 18, pc50: 22, pc75: 25, pc95: 31 },
      frutas: { pc5: 11, pc25: 14, pc50: 17, pc75: 20, pc95: 23 },
      pares: { pc5: 6, pc25: 8, pc50: 9, pc75: 10, pc95: 12 }
    }
  },
  {
    minAge: 26,
    maxAge: 40,
    norms: {
      animais: { pc5: 8, pc25: 15, pc50: 20, pc75: 23, pc95: 30 },
      frutas: { pc5: 9, pc25: 13, pc50: 16, pc75: 20, pc95: 23 },
      pares: { pc5: 4, pc25: 7, pc50: 9, pc75: 10, pc95: 11 }
    }
  },
  {
    minAge: 41,
    maxAge: 55,
    norms: {
      animais: { pc5: 7, pc25: 14, pc50: 19, pc75: 23, pc95: 28 },
      frutas: { pc5: 7, pc25: 13, pc50: 16, pc75: 18, pc95: 23 },
      pares: { pc5: 3, pc25: 6, pc50: 8, pc75: 10, pc95: 12 }
    }
  },
  {
    minAge: 56,
    maxAge: 70,
    norms: {
      animais: { pc5: 7, pc25: 13, pc50: 17, pc75: 21, pc95: 29 },
      frutas: { pc5: 8, pc25: 12, pc50: 15, pc75: 18, pc95: 21 },
      pares: { pc5: 3, pc25: 6, pc50: 8, pc75: 9, pc95: 12 }
    }
  }
];

/**
 * Obtém as normas para uma idade específica
 */
const getNormsForAge = (age: number): FVAAgeNorms | null => {
  // Crianças (7-10 anos)
  if (age >= 7 && age <= 10) {
    return CHILDREN_NORMS[age] || null;
  }
  
  // Adolescentes e adultos (13-70 anos)
  // Para idades 11-12, usamos normas de 13-18
  if (age >= 11 && age <= 12) {
    return ADULT_NORMS[0].norms;
  }
  
  const adultNorm = ADULT_NORMS.find(
    range => age >= range.minAge && age <= range.maxAge
  );
  
  return adultNorm?.norms || null;
};

/**
 * Calcula o percentil baseado na pontuação bruta e normas
 * Retorna string com percentil exato ou faixa
 */
const calculatePercentile = (score: number, norms: FVANormData): string => {
  // Verifica percentis exatos primeiro
  if (norms.pc95 !== undefined && score >= norms.pc95) return '>95';
  if (norms.pc90 !== undefined && score >= norms.pc90) {
    if (norms.pc95 !== undefined) return '90-95';
    return '>90';
  }
  if (score >= norms.pc75) {
    if (norms.pc90 !== undefined) return '75-90';
    if (norms.pc95 !== undefined) return '75-95';
    return '75';
  }
  if (score >= norms.pc50) return '50-75';
  if (score >= norms.pc25) return '25-50';
  if (norms.pc10 !== undefined && score >= norms.pc10) return '10-25';
  if (norms.pc5 !== undefined && score >= norms.pc5) return '5-25';
  if (norms.pc10 !== undefined && score < norms.pc10) return '<10';
  if (norms.pc5 !== undefined && score < norms.pc5) return '<5';
  
  return '<25';
};

/**
 * Calcula os percentis do FVA para uma idade específica
 */
export const calculateFVAPercentiles = (
  age: number,
  animais: number,
  frutas: number,
  pares: number
): {
  percentilAnimais: string;
  percentilFrutas: string;
  percentilPares: string;
} | null => {
  const norms = getNormsForAge(age);
  
  if (!norms) {
    return null;
  }
  
  // Calcula percentil de animais (sempre disponível)
  const percentilAnimais = calculatePercentile(animais, norms.animais);
  
  // Para crianças (7-10 anos), frutas e pares não têm normas
  const isChild = age >= 7 && age <= 10;
  
  const percentilFrutas = !isChild && norms.frutas 
    ? calculatePercentile(frutas, norms.frutas) 
    : 'N/A';
    
  const percentilPares = !isChild && norms.pares 
    ? calculatePercentile(pares, norms.pares) 
    : 'N/A';
  
  return {
    percentilAnimais,
    percentilFrutas,
    percentilPares
  };
};

/**
 * Verifica se a idade tem normas para frutas e pares
 */
export const hasFruitAndPairsNorms = (age: number): boolean => {
  return age >= 11; // Apenas a partir de 11 anos
};
