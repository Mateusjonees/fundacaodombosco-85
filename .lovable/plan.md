## Objetivo

Você listou a mesma regra de faixas para todos os testes mencionados, então vou unificar a classificação por percentil em **uma única função compartilhada** e aplicá-la consistentemente em TFV, TIN, TSBC, Trilhas, FDT e BPA-2. Hoje cada teste tem sua própria lógica, com divergências (TFV usa 25-50 = "Média", BPA-2 usa 25 = "Médio Inferior", etc.).

## Regra única de classificação por percentil

| Percentil | Classificação |
|---|---|
| < 5 | Inferior |
| = 5 | Inferior |
| 5–25 (exclusive) | Média Inferior |
| = 25 | Média Inferior |
| 25–50 (exclusive) | Média |
| = 50 | Média |
| 50–75 (exclusive) | Média |
| = 75 | Média Superior |
| 75–95 (exclusive) | Média Superior |
| = 95 | Superior |
| > 95 | Superior |

## Mudanças por teste

### 1. Criar helper compartilhado
- Novo arquivo `src/data/neuroTests/percentileClassification.ts` com:
  - `classifyPercentile(p: number | string): string` — aceita número (`50`), faixa (`"25-50"`), ou modificadores (`"<5"`, `">95"`).
  - `getClassificationColor(classification): string` — cores semânticas reusáveis.

### 2. TFV (`tfv.ts`)
- Substituir `getClassificationFromPercentile` por wrapper que delega para `classifyPercentile`.
- Corrige o bug atual onde `25-50` retornava "Média" (passa a retornar "Média Inferior" no limite `=25`, e "Média" no intervalo aberto).

### 3. BPA-2 (`bpa2.ts`)
- Reescrever `getClassification(percentile)` para usar `classifyPercentile`.
- Hoje há linhas duplicadas (`<= 5` e `<= 10` ambas retornam "Inferior") e nomenclatura inconsistente ("Médio Inferior" vs "Média Inferior").

### 4. FDT (`fdt.ts`)
- Adicionar `getFDTClassification(percentile)` e `getFDTClassificationColor` usando o helper compartilhado.
- Esses helpers serão consumidos pelo componente de exibição do FDT (a interpretação hoje não aparece para o usuário — vou conectar nos cards de resultado).

### 5. Trilhas (`trilhas.ts`), TSBC (`tsbc.ts`), TIN (`tin.ts`)
Esses três usam **Escore Padrão (M=100, DP=15)**, não percentil. Para alinhar à regra do livro:
- Manter `getXClassification(standardScore)` baseado em EP (esse cálculo segue o manual padrão), MAS
- Adicionar `getXClassificationByPercentile(p)` para quando o card exibir percentil derivado.
- Converter EP → percentil aproximado (tabela padrão da curva normal: EP 70=2, 85=16, 100=50, 115=84, 130=98) e exibir a faixa de percentil ao lado do EP nos cards do TIN, conforme você pediu ("variação de percentil").

### 6. Auditoria visual dos cards
Vou abrir os componentes que renderizam cada teste e garantir que estão chamando a nova função e exibindo o label correto. Arquivos a revisar (sem alteração de dados, só de classificação/cores):
- `src/components/neuro/results/*` (cards de cada teste)
- `src/components/neuro/forms/*` (preview inline, se houver)

## O que NÃO será alterado neste plano

- **Tabelas normativas** (TSBC infantil, Trilhas, BPA-2) — você optou por não enviar os PDFs. Se algum valor numérico de tabela estiver errado, preciso da página do manual para corrigir com segurança. Sinalize os valores específicos depois e eu aplico em um segundo passo.
- Cálculos brutos (Inibição = Escolha − Leitura, AG = AC+AD+AA, etc.) seguem como estão.

## Arquivos afetados

```text
src/data/neuroTests/
├── percentileClassification.ts   (NOVO)
├── tfv.ts                        (refactor classifier)
├── bpa2.ts                       (refactor classifier)
├── fdt.ts                        (add classifier + color)
├── trilhas.ts                    (add percentile classifier)
├── tsbc.ts                       (add percentile classifier)
└── tin.ts                        (add percentile classifier + EP→percentil)

src/components/neuro/results/*    (usar novos helpers)
```

## Validação

- Conferir no preview cada card de teste com escores de exemplo nas faixas 4 / 5 / 15 / 25 / 40 / 75 / 90 / 95 / 99 e validar o label exibido.
- Build limpo (sem quebrar imports antigos via re-export de compat).
