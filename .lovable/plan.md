

## Plano: Adicionar fórmulas e percentis a todos os testes neuropsicológicos

### Contexto
Atualmente, apenas ~12 de ~40 testes têm seções de "Dados de Entrada" e "Cálculos" no componente `NeuroTestResults.tsx`. Os demais mostram apenas a tabela final sem explicar como chegou no resultado. Além disso, vários testes não exibem percentil.

### Categorização dos testes

**Grupo A - Já têm percentil nos dados, falta exibir fórmula no resultado (20 testes):**
TMT_ADULTO, FAS, HAYLING_ADULTO, HAYLING_INFANTIL, TFV, TOM, TAYLOR, FPT_INFANTIL, FPT_ADULTO, REY, STROOP, D2, BDI, BAI, RAVEN, WCST, TOL, CANCELAMENTO, WECHSLER, NEUPSILIN

**Grupo B - Usam Escore Padrão (M=100, DP=15), precisa converter para percentil (6 testes):**
TIN, PCFO, TSBC, TRILHAS, TRILHAS_PRE_ESCOLAR, TRPP
- Fórmula: `Z = (EP - 100) / 15` → percentil via distribuição normal

**Grupo C - Usam Escore Padrão, já na interface mas sem percentil exibido (4 testes):**
WMS, VINELAND, WECHSLER (QI), BRIEF2
- Mesma fórmula do Grupo B

**Grupo D - Usam Escore T (M=50, DP=10), converter para percentil (3 testes):**
CONNERS, CBCL, BRIEF2
- Fórmula: `Z = (T - 50) / 10` → percentil

**Grupo E - Testes de rastreamento/corte, sem percentil normativo (7 testes):**
SNAPIV, MCHAT, MOCA, MEEM, GDS, ACE3, SDQ
- Estes usam pontos de corte, não percentis. Mostraremos a fórmula de classificação e nota "Teste de rastreamento - não utiliza percentil normativo"

### Alterações

#### 1. Criar função utilitária `zToPercentile` compartilhada
- Arquivo: `src/utils/neuroPercentile.ts`
- Função reutilizável para converter Z-score em percentil
- Função `epToPercentile(ep, mean=100, sd=15)` e `tScoreToPercentile(t)`

#### 2. Atualizar arquivos de dados dos testes do Grupo B
- Em cada `calculate*Results`, adicionar campo `percentiles` usando a conversão EP → percentil
- Testes: TIN, PCFO, TSBC, TRILHAS, TRILHAS_PRE_ESCOLAR, TRPP

#### 3. Atualizar arquivos de dados dos testes dos Grupos C e D
- WMS, VINELAND, WECHSLER: converter EP (M=100, DP=15) → percentil
- CONNERS, CBCL, BRIEF2: converter T-score (M=50, DP=10) → percentil

#### 4. Adicionar seções de fórmula em `NeuroTestResults.tsx`
Para cada teste sem seção de cálculo, adicionar:
- Bloco "Dados de Entrada" mostrando os valores brutos inseridos
- Bloco "Cálculos" mostrando a fórmula e o passo a passo

Exemplo para D2:
```
Dados de Entrada: Total=450, Acertos=200, E1=5, E2=10
Cálculos:
  RL = 450 - (5+10) = 435
  IC = 200 - 5 = 195
  Z(RL) = (435 - 420) / 55 = 0.27 → Percentil 61
```

#### 5. Testes de rastreamento (Grupo E)
- Mostrar fórmula de classificação (ex: "Escore 24/30 ≥ 26 = Normal")
- Na coluna de percentil, exibir "N/A (rastreamento)" com tooltip explicativo

### Escopo por arquivo

| Arquivo | Mudança |
|---------|---------|
| `src/utils/neuroPercentile.ts` | NOVO - funções de conversão |
| `src/data/neuroTests/tin.ts` | Adicionar percentile no resultado |
| `src/data/neuroTests/pcfo.ts` | Adicionar percentile no resultado |
| `src/data/neuroTests/tsbc.ts` | Adicionar percentile no resultado (OD e OI) |
| `src/data/neuroTests/trilhas.ts` | Adicionar percentile |
| `src/data/neuroTests/trilhasPreEscolar.ts` | Adicionar percentile |
| `src/data/neuroTests/trpp.ts` | Adicionar percentile |
| `src/data/neuroTests/wms.ts` | Adicionar percentile |
| `src/data/neuroTests/vineland.ts` | Adicionar percentile |
| `src/data/neuroTests/wais.ts` | Adicionar percentile |
| `src/data/neuroTests/conners.ts` | Adicionar percentile via T-score |
| `src/data/neuroTests/cbcl.ts` | Adicionar percentile via T-score |
| `src/data/neuroTests/brief2.ts` | Adicionar percentile via T-score |
| `src/data/neuroTests/snapiv.ts` | Marcar como rastreamento |
| `src/data/neuroTests/mchat.ts` | Marcar como rastreamento |
| `src/data/neuroTests/moca.ts` | Marcar como rastreamento |
| `src/data/neuroTests/meem.ts` | Marcar como rastreamento |
| `src/data/neuroTests/gds.ts` | Marcar como rastreamento |
| `src/data/neuroTests/ace3.ts` | Marcar como rastreamento |
| `src/data/neuroTests/sdq.ts` | Marcar como rastreamento |
| `src/components/NeuroTestResults.tsx` | Adicionar ~28 render functions de input/cálculo |
| Formulários (NeuroTest*Form.tsx) | Passar percentiles nos resultados salvos |

### Resultado esperado
- Todo teste mostra "Dados de Entrada" com valores brutos
- Todo teste mostra "Cálculos" com fórmula detalhada
- Todo teste com norma mostra percentil e como foi calculado
- Testes de rastreamento indicam claramente que usam ponto de corte, não percentil

