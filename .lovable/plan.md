
# Plano: Corrigir Tabelas de Percentis do BPA-2

## Problema

As tabelas de percentis em `bpa2Percentiles.ts` foram criadas com valores **estimados**, nao com os dados **reais** extraidos do manual BPA-2. A logica de consulta tambem precisa ser ajustada para refletir a estrutura correta do PDF.

---

## Estrutura Correta do PDF

A tabela normativa do BPA-2 funciona assim:

- **Linhas**: Percentis fixos (1, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 99)
- **Colunas**: Idades (6 anos, 7 anos, ..., 81 anos)
- **Celulas**: Escore bruto minimo para atingir aquele percentil

### Exemplo Atencao Alternada (AA) - Idade 6 anos:

| Classificacao  | Percentil | Escore |
|----------------|-----------|--------|
| Muito inferior | 1         | -20    |
| Inferior       | 10        | 10     |
|                | 20        | 18     |
| Medio inferior | 25        | 21     |
|                | 30        | 23     |
|                | 40        | 26     |
| Medio          | 50        | 31     |
|                | 60        | 34     |
|                | 70        | 37     |
| Medio superior | 75        | 39     |
|                | 80        | 42     |
| Superior       | 90        | 49     |
| Muito superior | 99        | 78     |

---

## Alteracoes Necessarias

### 1. Reestruturar `bpa2Percentiles.ts`

Mudar a estrutura de:
```typescript
// ERRADO (atual)
AC: [
  { score: 0, percentile: 1 },
  { score: 10, percentile: 5 },
]
```

Para:
```typescript
// CORRETO (novo)
AC: [
  { percentile: 1, score: -27 },
  { percentile: 10, score: 8 },
  { percentile: 20, score: 16 },
  { percentile: 25, score: 19 },
  { percentile: 30, score: 22 },
  { percentile: 40, score: 25 },
  { percentile: 50, score: 28 },
  { percentile: 60, score: 32 },
  { percentile: 70, score: 35 },
  { percentile: 75, score: 37 },
  { percentile: 80, score: 40 },
  { percentile: 90, score: 46 },
  { percentile: 99, score: 79 },
]
```

### 2. Ajustar Funcao `lookupPercentile`

Nova logica:
```typescript
export const lookupPercentile = (age: number, subtest: string, score: number): number => {
  const table = BPA2_PERCENTILES[age];
  const entries = table[subtest]; // ordenado por score crescente
  
  // Percorrer de cima para baixo (percentil maior para menor)
  for (let i = entries.length - 1; i >= 0; i--) {
    if (score >= entries[i].score) {
      return entries[i].percentile;
    }
  }
  return 1; // abaixo do menor escore = percentil 1
};
```

### 3. Inserir Dados Reais do PDF

Tabela completa extraida do documento:

**Atencao Alternada (AA)**:
- 6 anos: P1=-20, P10=10, P20=18, P25=21, P30=23, P40=26, P50=31, P60=34, P70=37, P75=39, P80=42, P90=49, P99=78
- 7 anos: P1=-16, P10=17, P20=25, P25=28, P30=30, P40=34, P50=38, P60=42, P70=46, P75=48, P80=51, P90=59, P99=83
- (continua para todas as idades...)

**Atencao Concentrada (AC)**:
- 6 anos: P1=-27, P10=8, P20=16, P25=19, P30=22, P40=25, P50=28, P60=32, P70=35, P75=37, P80=40, P90=46, P99=79
- 7 anos: P1=-21, P10=15, P20=23, P25=26, P30=29, P40=33, P50=37, P60=40, P70=44, P75=46, P80=48, P90=55, P99=70
- (continua para todas as idades...)

**Atencao Dividida (AD)**:
- 6 anos: P1=-49, P10=-14, P20=-1, P25=2, P30=5, P40=17, P50=26, P60=22, P70=29, P75=32, P80=35, P90=44, P99=72
- (continua para todas as idades...)

**Atencao Geral (AG)**:
- 6 anos: P1=-57, P10=15, P20=34, P25=44, P30=51, P40=63, P50=73, P60=86, P70=99, P75=105, P80=111, P90=129, P99=207
- (continua para todas as idades...)

---

## Faixas Etarias do PDF

O PDF agrupa algumas idades:
- 6-14 anos: valores individuais por idade
- 15-17 anos: agrupado
- 18-20 anos: agrupado
- 21-30 anos: agrupado
- 31-40 anos: agrupado
- 41-50 anos: agrupado
- 51-60 anos: agrupado
- 61-70 anos: agrupado
- 71-80 anos: agrupado
- 81 anos: valor unico

---

## Arquivos a Modificar

### `src/data/neuroTests/bpa2Percentiles.ts`

1. Reescrever todas as tabelas com dados reais do PDF
2. Ajustar estrutura para `{ percentile, score }` ordenado por score
3. Criar mapeamento correto de faixas etarias
4. Atualizar funcao `lookupPercentile` com logica correta

---

## Logica de Consulta Corrigida

Dado um escore bruto do paciente, encontrar o percentil correspondente:

1. Pegar a tabela da idade do paciente
2. Ordenar entradas por score crescente
3. Encontrar o maior percentil cujo score minimo seja <= escore do paciente
4. Retornar esse percentil

Exemplo:
- Paciente: 8 anos, AA = 45
- Tabela 8 anos AA: P25=35, P30=37, P40=42, P50=46, P60=50
- 45 >= 42 (P40) mas 45 < 46 (P50)
- Resultado: Percentil 40, Classificacao "Medio"

---

## Resultado Esperado

Apos a correcao:
- Os percentis exibidos corresponderao exatamente aos valores do manual BPA-2
- As classificacoes serao precisas
- O sistema sera validado para uso profissional
