

## Plano: Adicionar Card de Percentil com Formula nos Testes Neuropsicologicos

### Problema
6 testes calculam o Escore Padrao (EP) mas nao mostram o percentil correspondente nem a formula usada para calcula-lo:
- TIN
- PCFO
- Trilhas A e B (6-14 anos)
- Trilhas Pre-Escolares (4-6 anos)
- TRPP
- Cubos de Corsi (ja calcula percentil mas nao mostra a formula)

### Solucao
Usar a utilidade ja existente `epToPercentile` e `getPercentileFormula` de `src/utils/neuroPercentile.ts` para converter EP em percentil e exibir a formula. Para Corsi, que usa tabela fixa (nao EP), mostrar a formula descritiva.

### Implementacao

**Cada formulario recebera um novo Card "Percentil" na secao de resultados, mostrando:**
1. O valor do percentil calculado
2. A formula usada: `Z = (EP - 100) / 15 = X → Percentil Y`

#### Arquivo 1: `src/components/NeuroTestTINForm.tsx`
- Importar `epToPercentile`, `getPercentileFormula` de `neuroPercentile.ts`
- Apos o card de Classificacao (linha ~148-156), adicionar um 4o card com Percentil e formula
- Atualizar `percentiles` no resultado para incluir o valor calculado

#### Arquivo 2: `src/components/NeuroTestPCFOForm.tsx`
- Importar utilitarios de percentil
- Na secao "Resultados Calculados" (linha ~149-183), adicionar linha com Percentil e formula

#### Arquivo 3: `src/components/NeuroTestTrilhasForm.tsx`
- Importar utilitarios de percentil
- Para cada subteste (A, B, B-A), adicionar uma 4a coluna com Percentil + formula abaixo da tabela

#### Arquivo 4: `src/components/NeuroTestTrilhasPreEscolarForm.tsx`
- Importar utilitarios de percentil
- Para cada subteste (A, B), adicionar Percentil com formula nos cards de resultado

#### Arquivo 5: `src/components/NeuroTestTRPPForm.tsx`
- Importar utilitarios de percentil
- Adicionar coluna "Percentil" na tabela de resultados para o Total

#### Arquivo 6: `src/components/NeuroTestCorsiForm.tsx`
- Ja calcula percentil via tabela fixa, mas nao exibe no UI
- Adicionar card mostrando os percentis calculados com descricao: "Percentil baseado em tabela normativa (M~5, DP~1.1)"

### Nota sobre "Digitos (4-5 anos)"
Este teste nao existe no sistema. Sera necessario criar o formulario separadamente se desejado.

### Padrao visual do card de percentil
```
┌─────────────────────────────────┐
│ Percentil                       │
│        75                       │
│ Z = (110 - 100) / 15 = 0.67    │
│ → Percentil 75                  │
└─────────────────────────────────┘
```

