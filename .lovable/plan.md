
# Plano: Adicionar Testes FDT e RAVLT ao Sistema Neuropsicologico

## Resumo

Adicionar dois novos testes neuropsicologicos ao sistema de atendimento da unidade Floresta (Neuro):
1. **FDT** (Five Digit Test) - Avalia funcoes executivas
2. **RAVLT** (Teste de Aprendizagem Auditivo-Verbal de Rey) - Avalia memoria verbal

---

## Dados Extraidos do PDF RAVLT

### Faixas Etarias Disponiveis:
- 6-8 anos (Tabela 15)
- 9-11 anos (Tabela 16)
- 12-14 anos (Tabela 17)
- 15-17 anos (Tabela 18)
- 18-20 anos (Tabela 19)
- 21-30 anos (Tabela 20)
- 31-40 anos (Tabela 21)
- 41-50 anos (Tabela 22)
- 51-60 anos (Tabela 23)
- 61-70 anos (Tabela 24)
- 71-79 anos (Tabela 25)
- 80+ anos (Tabela 26)

### Percentis: 5, 25, 50, 75, 95

---

## Estrutura do Teste FDT

### Campos de Entrada (tempo em segundos):
- Leitura
- Contagem
- Escolha
- Alternancia

### Calculos Automaticos:
- **Inibicao** = Escolha - Leitura
- **Flexibilidade** = Alternancia - Leitura

---

## Estrutura do Teste RAVLT

### Campos de Entrada:
- A1, A2, A3, A4, A5 (total de palavras corretas lembradas)
- B1 (lista distratora)
- A6, A7 (evocacao tardia)
- REC (reconhecimento antes de diminuir 35)

### Calculos Automaticos:
- **Reconhecimento** = REC - 35
- **Escore Total** = A1 + A2 + A3 + A4 + A5
- **ALT** (Aprendizagem ao Longo das Tentativas) = Escore Total - (5 x A1)
- **Velocidade de Esquecimento** = A7 / A6
- **Interferencia Proativa** = B1 / A1
- **Interferencia Retroativa** = A6 / A5

### Sistema de Classificacao (igual para FDT e RAVLT):
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

### 1. `src/data/neuroTests/fdt.ts`
Definicao do teste FDT com campos e formulas

### 2. `src/data/neuroTests/ravlt.ts`
Definicao do teste RAVLT com campos, formulas e funcoes de calculo

### 3. `src/data/neuroTests/ravltPercentiles.ts`
Tabelas normativas do RAVLT extraidas do PDF para todas as faixas etarias

### 4. `src/components/NeuroTestFDTForm.tsx`
Formulario de entrada para o teste FDT com campos de tempo e calculos

### 5. `src/components/NeuroTestRAVLTForm.tsx`
Formulario de entrada para o teste RAVLT com todos os campos e calculos

---

## Arquivos a Modificar

### 1. `src/data/neuroTests/index.ts`
Adicionar exportacao dos novos testes FDT e RAVLT na lista AVAILABLE_NEURO_TESTS

### 2. `src/components/CompleteAttendanceDialog.tsx`
Integrar os formularios dos novos testes (FDT e RAVLT) na finalizacao de atendimento

---

## Detalhes Tecnicos

### Estrutura de Dados RAVLT:
```typescript
interface RAVLTScores {
  a1: number; a2: number; a3: number; a4: number; a5: number;
  b1: number; a6: number; a7: number;
  rec: number;
}

interface RAVLTResults {
  rawScores: RAVLTScores;
  calculatedScores: {
    reconhecimento: number;
    escoreTotal: number;
    alt: number;
    velocidadeEsquecimento: number;
    interferenciaProativa: number;
    interferenciaRetroativa: number;
  };
  percentiles: { ... };
  classifications: { ... };
  notes: string;
}
```

### Estrutura de Dados FDT:
```typescript
interface FDTScores {
  leitura: number;
  contagem: number;
  escolha: number;
  alternancia: number;
}

interface FDTResults {
  rawScores: FDTScores;
  calculatedScores: {
    inibicao: number;      // escolha - leitura
    flexibilidade: number; // alternancia - leitura
  };
  notes: string;
}
```

### Tabela de Percentis RAVLT (exemplo 6-8 anos):
```typescript
const TABLE_6_8 = {
  A1: [p(5, 2), p(25, 3), p(50, 4), p(75, 5), p(95, 8)],
  A2: [p(5, 3), p(25, 5), p(50, 6), p(75, 7), p(95, 10)],
  // ... demais variaveis
}
```

---

## Fluxo de Uso

```text
1. Profissional finaliza atendimento na unidade Floresta (Neuro)
2. Sistema exibe lista de testes disponiveis (BPA-2, FDT, RAVLT)
3. Profissional seleciona os testes aplicados
4. Para cada teste selecionado, aparece o formulario correspondente
5. Profissional insere os valores brutos
6. Sistema calcula escores derivados, percentis e classificacoes
7. Resultados sao salvos junto com o registro de atendimento
```

---

## Observacao sobre FDT

Para o teste FDT, sera criada a estrutura completa do formulario com os calculos de Inibicao e Flexibilidade. No entanto, **para calcular percentis automaticamente**, seria necessario o PDF do manual FDT com as tabelas normativas. Por enquanto, o formulario ficara funcional para entrada de dados e calculos, mas sem classificacao automatica por percentil ate que as tabelas sejam fornecidas.

---

## Resultado Esperado

- Testes FDT e RAVLT disponiveis para selecao na finalizacao de atendimento
- Formularios especificos para cada teste com campos apropriados
- Calculos automaticos conforme formulas especificadas
- Percentis e classificacoes automaticas para RAVLT (baseado no PDF)
- Sistema extensivel para adicionar novos testes no futuro
