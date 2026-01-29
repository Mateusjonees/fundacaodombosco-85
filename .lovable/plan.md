
# Plano: Corrigir Tabelas Normativas do RAVLT e Sistema de Classificação

## Problemas Identificados

Após analisar o PDF das tabelas oficiais do RAVLT e comparar com a implementação atual, identifiquei os seguintes problemas:

### 1. Tabelas Normativas com Valores Incorretos

Comparando as tabelas oficiais do PDF com `ravltPercentiles.ts`:

| Faixa Etária | Tabela | Status |
|--------------|--------|--------|
| 6-8 anos | Tabela 15 | **INCORRETA** - valores divergem do PDF |
| 9-11 anos | Tabela 16 | **INCORRETA** - valores divergem |
| 12-14 anos | Tabela 17 | **INCORRETA** - valores divergem |
| 15-17 anos | Tabela 18 | **INCORRETA** - valores divergem |
| 18-20 anos | Tabela 19 | **INCORRETA** - valores divergem |
| 21-30 anos | Tabela 20 | **INCORRETA** - valores divergem |
| 31-40 anos | Tabela 21 | **INCORRETA** - valores divergem |
| 41-50 anos | Tabela 22 | **INCORRETA** - valores divergem |
| 51-60 anos | Tabela 23 | **INCORRETA** - valores divergem |
| 61-70 anos | Tabela 24 | **INCORRETA** - valores divergem |

**Exemplo de divergencia na Tabela 15 (6-8 anos):**

| Variavel | Pc5 PDF | Pc5 Sistema | Pc25 PDF | Pc25 Sistema |
|----------|---------|-------------|----------|--------------|
| A1 | 2 | 2 | 3 | 3 |
| A2 | 3 | 3 | 5 | 5 |
| A3 | 4 | 4 | 5 | 6 |
| A4 | 4 | 4 | 6 | 7 |
| A5 | 4 | 5 | 7 | 7 |
| B1 | 2 | 1 | 3 | 3 |
| A6 | 3 | 2 | 5 | 5 |
| A7 | 3 | 1 | 6 | 4 |
| Reconhecimento | -2 | 3 | 8 | 9 |
| Escore Total | 19 | 20 | 26 | 30 |

### 2. Sistema de Classificacao Simplificado Demais

A classificacao atual nao representa corretamente as faixas percentilicas:

**Especificacao do usuario:**
- `<5` = Inferior
- `5` = Inferior  
- `5-25` = Medio Inferior
- `25` = Medio Inferior
- `25-50` = Medio
- `50` = Medio
- `50-75` = Medio
- `75` = Medio Superior
- `75-95` = Medio Superior
- `95` = Superior
- `>95` = Superior

---

## Solucao

### Arquivo 1: `src/data/neuroTests/ravltPercentiles.ts`

Reescrever TODAS as tabelas normativas com os valores exatos do PDF oficial:

**Tabela 15 - 6-8 anos (valores do PDF):**
```typescript
const TABLE_6_8: AgeGroupTable = {
  A1: [p(5, 2), p(25, 3), p(50, 4), p(75, 5), p(95, 8)],
  A2: [p(5, 3), p(25, 5), p(50, 6), p(75, 7), p(95, 10)],
  A3: [p(5, 4), p(25, 5), p(50, 7), p(75, 9), p(95, 12)],
  A4: [p(5, 4), p(25, 6), p(50, 8), p(75, 10), p(95, 13)],
  A5: [p(5, 4), p(25, 7), p(50, 8), p(75, 10), p(95, 13)],
  B1: [p(5, 2), p(25, 3), p(50, 4), p(75, 5), p(95, 7)],
  A6: [p(5, 3), p(25, 5), p(50, 7), p(75, 8), p(95, 13)],
  A7: [p(5, 3), p(25, 6), p(50, 7), p(75, 9), p(95, 13)],
  EscoreTotal: [p(5, 19), p(25, 26), p(50, 33), p(75, 40), p(95, 52)],
  Reconhecimento: [p(5, -2), p(25, 8), p(50, 10), p(75, 15), p(95, 15)]
};
```

**Tabela 16 - 9-11 anos (valores do PDF):**
```typescript
const TABLE_9_11: AgeGroupTable = {
  A1: [p(5, 3), p(25, 4), p(50, 5), p(75, 7), p(95, 8)],
  A2: [p(5, 4), p(25, 6), p(50, 7), p(75, 9), p(95, 11)],
  A3: [p(5, 3), p(25, 6), p(50, 9), p(75, 11), p(95, 13)],
  A4: [p(5, 4), p(25, 8), p(50, 9), p(75, 11), p(95, 14)],
  A5: [p(5, 5), p(25, 8), p(50, 10), p(75, 12), p(95, 14)],
  B1: [p(5, 3), p(25, 4), p(50, 5), p(75, 6), p(95, 8)],
  A6: [p(5, 4), p(25, 7), p(50, 9), p(75, 11), p(95, 12)],
  A7: [p(5, 4), p(25, 7), p(50, 9), p(75, 11), p(95, 13)],
  EscoreTotal: [p(5, 24), p(25, 32), p(50, 40), p(75, 46), p(95, 58)],
  Reconhecimento: [p(5, 2), p(25, 11), p(50, 14), p(75, 15), p(95, 15)]
};
```

**E assim por diante para todas as 12 tabelas...**

### Arquivo 2: `src/data/neuroTests/ravlt.ts`

Corrigir a funcao `getRAVLTClassification` para usar a logica de faixas:

```typescript
export const getRAVLTClassification = (percentile: number): string => {
  if (percentile < 5) return 'Inferior';
  if (percentile === 5) return 'Inferior';
  if (percentile > 5 && percentile < 25) return 'Medio Inferior';
  if (percentile === 25) return 'Medio Inferior';
  if (percentile > 25 && percentile < 75) return 'Medio';
  if (percentile === 75) return 'Medio';
  if (percentile > 75 && percentile < 95) return 'Medio Superior';
  if (percentile === 95) return 'Superior';
  if (percentile > 95) return 'Superior';
  return 'Medio';
};
```

### Arquivo 3: `src/data/neuroTests/ravltPercentiles.ts`

Atualizar funcao `lookupRAVLTPercentile` para retornar faixas percentilicas (ex: "5-25" em vez de apenas "5"):

```typescript
export const lookupRAVLTPercentileRange = (
  age: number,
  variable: RAVLTVariable,
  score: number
): string => {
  const table = getTableForAge(age);
  const data = table[variable];
  
  if (!data || data.length === 0) return '50';
  
  const sorted = [...data].sort((a, b) => a.percentile - b.percentile);
  
  // Se menor que Pc5
  if (score < sorted[0].score) return '<5';
  
  // Se maior ou igual a Pc95
  if (score >= sorted[sorted.length - 1].score) return '>95';
  
  // Encontrar faixa
  for (let i = 0; i < sorted.length - 1; i++) {
    if (score >= sorted[i].score && score < sorted[i + 1].score) {
      // Retorna faixa se nao for exatamente o percentil
      if (score === sorted[i].score) {
        return String(sorted[i].percentile);
      }
      return `${sorted[i].percentile}-${sorted[i + 1].percentile}`;
    }
  }
  
  return String(sorted[sorted.length - 1].percentile);
};
```

---

## Tabelas Corrigidas do PDF

Vou transcrever **exatamente** os valores das tabelas do PDF:

### Tabela 15: 6-8 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 2  | 3  | 4  | 4  | 4  | 2  | 3  | 3  | -2  | 19    |
| 25 | 3  | 5  | 5  | 6  | 7  | 3  | 5  | 6  | 8   | 26    |
| 50 | 4  | 6  | 7  | 8  | 8  | 4  | 7  | 7  | 10  | 33    |
| 75 | 5  | 7  | 9  | 10 | 10 | 5  | 8  | 9  | 15  | 40    |
| 95 | 8  | 10 | 12 | 13 | 13 | 7  | 13 | 13 | 15  | 52    |

### Tabela 16: 9-11 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 3  | 4  | 3  | 4  | 5  | 3  | 4  | 4  | 2   | 24    |
| 25 | 4  | 6  | 6  | 8  | 8  | 4  | 7  | 7  | 11  | 32    |
| 50 | 5  | 7  | 9  | 9  | 10 | 5  | 9  | 9  | 14  | 40    |
| 75 | 7  | 9  | 11 | 11 | 12 | 6  | 11 | 11 | 15  | 46    |
| 95 | 8  | 11 | 13 | 14 | 14 | 8  | 12 | 13 | 15  | 58    |

### Tabela 17: 12-14 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 4  | 4  | 4  | 3  | 6  | 3  | 5  | 5  | 0   | 28    |
| 25 | 5  | 6  | 7  | 9  | 10 | 4  | 9  | 7  | 12  | 39    |
| 50 | 6  | 8  | 10 | 10 | 11 | 6  | 10 | 10 | 15  | 46    |
| 75 | 8  | 10 | 12 | 12 | 13 | 7  | 11 | 12 | 15  | 51    |
| 95 | 9  | 12 | 14 | 14 | 15 | 9  | 13 | 14 | 15  | 59    |

### Tabela 18: 15-17 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 4  | 4  | 4  | 6  | 7  | 3  | 5  | 6  | 4   | 34    |
| 25 | 5  | 7  | 8  | 10 | 10 | 4  | 9  | 9  | 11  | 41    |
| 50 | 6  | 8  | 10 | 11 | 11 | 5  | 10 | 11 | 13  | 46    |
| 75 | 7  | 9  | 11 | 13 | 14 | 6  | 13 | 12 | 15  | 53    |
| 95 | 8  | 11 | 13 | 14 | 14 | 9  | 14 | 14 | 15  | 58    |

### Tabela 19: 18-20 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 4  | 6  | 8  | 8  | 8  | 4  | 6  | 6  | -1  | 36    |
| 25 | 6  | 8  | 10 | 10 | 11 | 5  | 9  | 9  | 5   | 46    |
| 50 | 7  | 9  | 11 | 12 | 12 | 6  | 12 | 11 | 13  | 52    |
| 75 | 8  | 11 | 13 | 14 | 14 | 7  | 13 | 13 | 15  | 58    |
| 95 | 10 | 13 | 14 | 15 | 15 | 9  | 15 | 15 | 15  | 65    |

### Tabela 20: 21-30 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 4  | 5  | 6  | 7  | 8  | 3  | 6  | 6  | 1   | 34    |
| 25 | 5  | 7  | 9  | 10 | 11 | 4  | 9  | 9  | 11  | 44    |
| 50 | 7  | 9  | 11 | 12 | 13 | 6  | 11 | 11 | 13  | 50    |
| 75 | 8  | 10 | 12 | 13 | 14 | 7  | 13 | 13 | 14  | 56    |
| 95 | 9  | 12 | 14 | 15 | 15 | 9  | 15 | 15 | 15  | 63    |

### Tabela 21: 31-40 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 4  | 5  | 6  | 7  | 8  | 2  | 6  | 6  | -2  | 35    |
| 25 | 5  | 7  | 9  | 10 | 11 | 4  | 9  | 9  | 10  | 43    |
| 50 | 6  | 9  | 10 | 11 | 12 | 5  | 11 | 11 | 13  | 49    |
| 75 | 7  | 10 | 12 | 12 | 14 | 6  | 12 | 12 | 14  | 54    |
| 95 | 9  | 12 | 14 | 15 | 15 | 8  | 14 | 14 | 15  | 60    |

### Tabela 22: 41-50 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 4  | 5  | 5  | 6  | 7  | 3  | 5  | 5  | -3  | 29    |
| 25 | 5  | 7  | 8  | 9  | 10 | 4  | 8  | 7  | 8   | 40    |
| 50 | 6  | 8  | 10 | 11 | 12 | 5  | 10 | 10 | 12  | 49    |
| 75 | 7  | 10 | 11 | 12 | 14 | 6  | 12 | 11 | 14  | 53    |
| 95 | 9  | 12 | 14 | 15 | 15 | 8  | 14 | 14 | 15  | 61    |

### Tabela 23: 51-60 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 3  | 5  | 5  | 7  | 8  | 2  | 5  | 4  | -2  | 31    |
| 25 | 5  | 6  | 8  | 9  | 10 | 4  | 7  | 8  | 10  | 37    |
| 50 | 6  | 8  | 10 | 11 | 12 | 5  | 10 | 10 | 12  | 47    |
| 75 | 7  | 10 | 11 | 12 | 14 | 6  | 12 | 12 | 14  | 53    |
| 95 | 9  | 12 | 14 | 14 | 15 | 8  | 14 | 14 | 15  | 61    |

### Tabela 24: 61-70 anos
| Pc | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Rec | Total |
|----|----|----|----|----|----|----|----|----|-----|-------|
| 5  | 3  | 5  | 6  | 7  | 8  | 2  | 4  | 5  | 3   | 30    |
| 25 | 5  | 6  | 8  | 9  | 10 | 4  | 8  | 8  | 9   | 40    |
| 50 | 5  | 8  | 9  | 10 | 11 | 5  | 10 | 10 | 11  | 44    |
| 75 | 6  | 9  | 10 | 11 | 12 | 5  | 11 | 11 | 13  | 49    |
| 95 | 8  | 11 | 12 | 13 | 14 | 7  | 13 | 14 | 15  | 58    |

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `ravltPercentiles.ts` | Reescrever TODAS as 12 tabelas com valores corretos do PDF |
| `ravltPercentiles.ts` | Adicionar funcao `lookupRAVLTPercentileRange` para retornar faixas |
| `ravlt.ts` | Corrigir `getRAVLTClassification` para interpretar faixas corretamente |

## Resultado Esperado

- Percentis corretos de acordo com as tabelas oficiais do manual
- Faixas percentilicas exibidas corretamente (ex: "5-25" quando entre dois percentis)
- Classificacoes corretas seguindo a especificacao do usuario
