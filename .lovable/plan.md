
# Plano: Adicionar Tabelas de Percentis ao Teste FDT

## Resumo

Adicionar tabelas normativas completas ao teste FDT (Five Digit Test) extraidas do PDF do manual oficial, permitindo calculo automatico de percentis e classificacoes clinicas para os escores de Inibicao e Flexibilidade.

---

## Dados Extraidos do PDF (Tabelas 6.3 a 6.11)

### Faixas Etarias e Variaveis

O PDF fornece dados normativos para as seguintes variaveis:
- **Leitura** (tempo em segundos)
- **Contagem** (tempo em segundos)
- **Escolha** (tempo em segundos)
- **Alternancia** (tempo em segundos)
- **Inibicao** (calculado: Escolha - Leitura)
- **Flexibilidade** (calculado: Alternancia - Leitura)

**Importante**: No FDT, valores MENORES sao melhores (tempo mais rapido = melhor desempenho). Por isso os percentis estao invertidos comparado ao RAVLT.

### Tabelas Normativas Extraidas:

**Tabela 6.3: 6-8 anos (N=44)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 25 | 29 | 34 | 39 | 48 |
| Contagem | 32 | 40 | 48 | 56 | 83 |
| Escolha | 41 | 66 | 79 | 94 | 109 |
| Alternancia | 58 | 75 | 91 | 113 | 133 |
| Inibicao | 17 | 31 | 43 | 55 | 76 |
| Flexibilidade | 26 | 41 | 55 | 75 | 92 |

**Tabela 6.4: 9-10 anos (N=129)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 22 | 26 | 29 | 32 | 38 |
| Contagem | 28 | 34 | 39 | 43 | 52 |
| Escolha | 46 | 56 | 63 | 73 | 88 |
| Alternancia | 54 | 67 | 75 | 87 | 101 |
| Inibicao | 19 | 28 | 35 | 42 | 57 |
| Flexibilidade | 28 | 39 | 46 | 57 | 73 |

**Tabela 6.5: 11-12 anos (N=59)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 20 | 24 | 27 | 32 | 47 |
| Contagem | 25 | 32 | 36 | 44 | 54 |
| Escolha | 38 | 48 | 56 | 62 | 93 |
| Alternancia | 46 | 55 | 66 | 73 | 96 |
| Inibicao | 12 | 20 | 28 | 35 | 51 |
| Flexibilidade | 16 | 30 | 39 | 44 | 68 |

**Tabela 6.6: 13-15 anos (N=46)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 17 | 20 | 23 | 26 | 34 |
| Contagem | 21 | 24 | 28 | 35 | 44 |
| Escolha | 33 | 40 | 45 | 53 | 68 |
| Alternancia | 36 | 46 | 53 | 67 | 81 |
| Inibicao | 8 | 19 | 23.5 | 29 | 42 |
| Flexibilidade | 14 | 25 | 32 | 41 | 53 |

**Tabela 6.7: 16-18 anos (N=44)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 16 | 17 | 20 | 23 | 29 |
| Contagem | 19 | 21 | 24 | 26 | 30 |
| Escolha | 25 | 29 | 33 | 39 | 44 |
| Alternancia | 34 | 38 | 42 | 51 | 63 |
| Inibicao | 6 | 10.5 | 13 | 16.5 | 22 |
| Flexibilidade | 16 | 19 | 22 | 27 | 44 |

**Tabela 6.8: 19-34 anos (N=349)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 16 | 19 | 21 | 25 | 31 |
| Contagem | 19 | 22 | 24 | 27 | 34 |
| Escolha | 27 | 31 | 35 | 40 | 52 |
| Alternancia | 33 | 38 | 44 | 50 | 64 |
| Inibicao | 5 | 11 | 14 | 18 | 28 |
| Flexibilidade | 10 | 17 | 22 | 29 | 42 |

**Tabela 6.9: 35-59 anos (N=261)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 17 | 20 | 23 | 26 | 37 |
| Contagem | 19 | 22 | 26 | 30 | 40 |
| Escolha | 28 | 32 | 39 | 46 | 65 |
| Alternancia | 34 | 43 | 48 | 60 | 89 |
| Inibicao | 5 | 11 | 15 | 21 | 38 |
| Flexibilidade | 14 | 20 | 26 | 34 | 55 |

**Tabela 6.10: 60-75 anos (N=146)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 18 | 22 | 25 | 30 | 37 |
| Contagem | 21 | 25 | 28 | 33 | 41 |
| Escolha | 30 | 39 | 46 | 53 | 68 |
| Alternancia | 41 | 52 | 62 | 78 | 93 |
| Inibicao | 9 | 15 | 19.5 | 26 | 39 |
| Flexibilidade | 18 | 28 | 35 | 49 | 63 |

**Tabela 6.11: 76+ anos (N=55)**
| Variavel | Pc.95 | Pc.75 | Pc.50 | Pc.25 | Pc.5 |
|----------|-------|-------|-------|-------|------|
| Leitura | 20 | 25 | 29 | 34 | 38 |
| Contagem | 21 | 26 | 31 | 36 | 46 |
| Escolha | 33 | 44 | 49 | 62 | 96 |
| Alternancia | 48 | 61 | 74 | 89 | 108 |
| Inibicao | 7 | 16 | 21 | 29 | 63 |
| Flexibilidade | 22 | 35 | 43 | 56 | 71 |

---

## Sistema de Classificacao

Usando a mesma escala do RAVLT:

| Percentil | Classificacao |
|-----------|---------------|
| menos que 5 | Inferior |
| 5 | Inferior |
| 5-25 | Medio Inferior |
| 25 | Medio Inferior |
| 25-50 | Medio |
| 50 | Medio |
| 50-75 | Medio |
| 75 | Medio Superior |
| 75-95 | Medio Superior |
| 95 | Superior |
| maior que 95 | Superior |

---

## Arquivos a Criar

### 1. `src/data/neuroTests/fdtPercentiles.ts`

Arquivo contendo todas as tabelas normativas do FDT com:
- Interface `FDTAgeGroupTable` para estrutura de dados
- Constantes para cada faixa etaria (TABLE_6_8, TABLE_9_10, etc.)
- Funcao `getTableForAge()` para selecionar tabela correta
- Funcao `getAgeGroupName()` para nome da faixa etaria
- Funcao `lookupFDTPercentile()` para buscar percentil (logica invertida - tempo menor = percentil maior)
- Funcao `getClassification()` para obter classificacao clinica

---

## Arquivos a Modificar

### 1. `src/data/neuroTests/fdt.ts`

Atualizar interface `FDTResults` para incluir percentis e classificacoes:
```typescript
export interface FDTResults {
  rawScores: FDTScores;
  calculatedScores: FDTCalculatedScores;
  percentiles: {
    inibicao: number;
    flexibilidade: number;
  };
  classifications: {
    inibicao: string;
    flexibilidade: string;
  };
  notes: string;
}
```

### 2. `src/components/NeuroTestFDTForm.tsx`

Atualizar formulario para:
- Importar funcoes de percentil do novo arquivo
- Calcular e exibir percentis automaticamente
- Mostrar classificacao clinica (Inferior, Medio Inferior, Medio, Medio Superior, Superior)
- Exibir faixa etaria utilizada para referencia

### 3. `src/data/neuroTests/index.ts`

Adicionar exportacao do novo arquivo de percentis:
```typescript
export * from './fdtPercentiles';
```

---

## Detalhes Tecnicos

### Logica de Percentil Invertida

No FDT, diferente do RAVLT, valores MENORES sao melhores (tempo mais rapido). A funcao de lookup deve:

```typescript
export const lookupFDTPercentile = (
  age: number,
  variable: FDTVariable,
  score: number
): number => {
  const table = getTableForAge(age);
  const data = table[variable];
  
  // Ordenar do maior percentil (menor score) para menor percentil (maior score)
  const sorted = [...data].sort((a, b) => b.percentile - a.percentile);
  
  // Se score for menor ou igual ao benchmark do Pc.95, retorna 99
  if (score <= sorted[0].score) return 99;
  
  // Se score for maior que o benchmark do Pc.5, retorna 1
  if (score > sorted[sorted.length - 1].score) return 1;
  
  // Encontra o percentil onde o score se encaixa
  for (const entry of sorted) {
    if (score <= entry.score) {
      return entry.percentile;
    }
  }
  
  return 1;
};
```

### Estrutura de Dados

```typescript
interface FDTAgeGroupTable {
  leitura: PercentileEntry[];
  contagem: PercentileEntry[];
  escolha: PercentileEntry[];
  alternancia: PercentileEntry[];
  inibicao: PercentileEntry[];
  flexibilidade: PercentileEntry[];
}

type FDTVariable = 'leitura' | 'contagem' | 'escolha' | 'alternancia' | 'inibicao' | 'flexibilidade';
```

---

## Resultado Esperado

- Percentis calculados automaticamente para Inibicao e Flexibilidade
- Classificacoes clinicas exibidas no formulario
- Faixa etaria de referencia mostrada ao usuario
- Sistema consistente com a interpretacao do RAVLT
- Dados validados conforme manual oficial do FDT
