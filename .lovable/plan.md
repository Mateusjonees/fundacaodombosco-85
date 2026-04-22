

## Adicionar Erros ao Cálculo do TMT Adulto

Atualmente o formulário do TMT Adulto só coleta Tempo A e Tempo B. O teste também registra **erros** nas partes A e B, que devem ser incluídos na entrada e nos resultados.

### Alterações

#### 1. Dados e tipos (`src/data/neuroTests/tmtAdulto.ts`)
- Adicionar subtestes `errosA` e `errosB` à definição do teste
- Adicionar campo `errosTotalAB` (calculado: errosA + errosB) em `calculatedScores`
- Atualizar a interface `TMTAdultoResults` para incluir `errosA`, `errosB` nos rawScores e `errosTotalAB` nos calculatedScores

#### 2. Cálculo (`src/data/neuroTests/tmtAdultoPercentiles.ts`)
- Atualizar `calculateTMTAdultoResults` para receber `errosA` e `errosB` como parâmetros
- Incluir `errosA`, `errosB` e `errosTotalAB` nos scores calculados retornados
- Erros não possuem tabela normativa de percentis no manual, então serão registrados como valores brutos (sem percentil/classificação por tabela), mas com nota qualitativa: 0 erros = "Adequado", 1-2 = "Limítrofe", 3+ = "Elevado"

#### 3. Formulário (`src/components/NeuroTestTMTAdultoForm.tsx`)
- Adicionar dois campos `Input` (type number, min 0, step 1) para Erros A e Erros B, em grid 2 colunas abaixo dos tempos
- Exibir nos resultados calculados: Erros A, Erros B, Total de Erros (A+B) com badge de classificação qualitativa
- Passar os valores de erros para `calculateTMTAdultoResults` e para `onResultsChange`

### Arquivos alterados
- `src/data/neuroTests/tmtAdulto.ts`
- `src/data/neuroTests/tmtAdultoPercentiles.ts`
- `src/components/NeuroTestTMTAdultoForm.tsx`

