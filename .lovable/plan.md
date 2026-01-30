
# Plano: Exibição Completa dos Testes Neuropsicológicos com Dados de Entrada e Cálculos

## Problema Identificado

A exibição atual dos testes neuropsicológicos mostra apenas os resultados finais (bruto, percentil, classificação), mas **não exibe os dados de entrada originais** que foram digitados. Cada teste tem estruturas diferentes de entrada que precisam ser exibidas.

| Teste | Dados de Entrada (Inputs) | Cálculos Intermediários | Resultados Finais |
|-------|---------------------------|-------------------------|-------------------|
| **RAVLT** | A1-A7, B1, REC (valores digitados) | ALT, Vel. Esquecimento, Int. Proativa, Int. Retroativa | Escore Total, Reconhecimento |
| **FDT** | Leitura, Contagem, Escolha, Alternância (tempos) | Inibição = Escolha - Leitura, Flexibilidade = Alternância - Leitura | Inibição, Flexibilidade |
| **BPA-2** | Acertos, Erros, Omissões para cada subteste | AC = A - E - O, AD, AA | AC, AD, AA, AG |

---

## Solução

Criar uma exibição completa e específica para cada tipo de teste, mostrando:

1. **Seção "Dados de Entrada"** - O que foi digitado pelo profissional
2. **Seção "Cálculos Intermediários"** - Fórmulas aplicadas (quando existirem)
3. **Seção "Resultados"** - Escores, Percentis e Classificações

---

## Arquivos a Modificar

### 1. `src/components/PatientNeuroTestHistory.tsx`

**Alterações principais:**

- Adicionar função `renderInputSection()` que exibe os dados de entrada específicos de cada teste
- Adicionar função `renderCalculationsSection()` para mostrar cálculos intermediários
- Criar layout em seções colapsáveis (dados entrada → cálculos → resultados)
- Melhorar a função de "Copiar para Laudo" incluindo todas as informações

---

## Layout Proposto (Por Teste)

### RAVLT - Estrutura de Exibição

```text
┌─────────────────────────────────────────────────────────────┐
│  RAVLT - Teste de Aprendizagem Auditivo-Verbal de Rey       │
│  📅 28/01/2026 • 7 anos                    [Total: 90]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📥 DADOS DE ENTRADA                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Tentativas: A1=2  A2=2  A3=18  A4=20  A5=48         │    │
│  │ Lista B: B1=24                                       │    │
│  │ Evocações: A6=12  A7=20                             │    │
│  │ Reconhecimento (bruto): 12                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  🧮 CÁLCULOS                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Escore Total: A1+A2+A3+A4+A5 = 90                   │    │
│  │ Reconhecimento: 12 - 35 = -23                       │    │
│  │ ALT (Aprendizagem): 90 - (5×2) = 80                 │    │
│  │ Vel. Esquecimento: 20/12 = 1.67                     │    │
│  │ Int. Proativa: 24/2 = 12.00                         │    │
│  │ Int. Retroativa: 12/48 = 0.25                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  📊 RESULTADOS                                              │
│  ┌────────────┬───────┬──────────┬─────────────────┐       │
│  │ Variável   │ Bruto │ Percentil│ Classificação   │       │
│  ├────────────┼───────┼──────────┼─────────────────┤       │
│  │ A1         │   2   │    5     │ Inferior        │       │
│  │ A2         │   2   │    1     │ Inferior        │       │
│  │ ...        │       │          │                 │       │
│  │ ⭐ Total   │  90   │   99     │ Superior        │       │
│  │ Reconhec.  │  -23  │    1     │ Inferior        │       │
│  └────────────┴───────┴──────────┴─────────────────┘       │
│                                                             │
│  📝 Observações: teste                                      │
│  👤 Aplicado por: Dev                                       │
│                                                             │
│  [📋 Copiar para Laudo]                                     │
└─────────────────────────────────────────────────────────────┘
```

### FDT - Estrutura de Exibição

```text
┌─────────────────────────────────────────────────────────────┐
│  FDT - Five Digits Test                                     │
│  📅 28/01/2026 • 25 anos                   [Inib.: 15.2]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📥 DADOS DE ENTRADA (Tempos em segundos)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Leitura: 28.5s    Contagem: 32.0s                   │    │
│  │ Escolha: 43.7s    Alternância: 52.3s                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  🧮 CÁLCULOS                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Inibição: 43.7 - 28.5 = 15.2                        │    │
│  │ Flexibilidade: 52.3 - 28.5 = 23.8                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  📊 RESULTADOS                                              │
│  ┌────────────────┬───────┬──────────┬────────────────┐    │
│  │ Variável       │ Score │ Percentil│ Classificação  │    │
│  ├────────────────┼───────┼──────────┼────────────────┤    │
│  │ ⭐ Inibição    │ 15.2  │   75     │ Médio Superior │    │
│  │ Flexibilidade  │ 23.8  │   50     │ Médio          │    │
│  └────────────────┴───────┴──────────┴────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### BPA-2 - Estrutura de Exibição

```text
┌─────────────────────────────────────────────────────────────┐
│  BPA-2 - Bateria Psicológica para Avaliação da Atenção      │
│  📅 28/01/2026 • 15 anos                   [AG: 180]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📥 DADOS DE ENTRADA                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ AC: Acertos=85  Erros=3   Omissões=12  → Score: 70  │    │
│  │ AD: Acertos=78  Erros=5   Omissões=8   → Score: 65  │    │
│  │ AA: Acertos=72  Erros=2   Omissões=15  → Score: 55  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  🧮 CÁLCULOS                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Fórmula: Score = Acertos - Erros - Omissões         │    │
│  │ AG = AC + AD + AA = 70 + 65 + 55 = 190              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  📊 RESULTADOS                                              │
│  ┌────────────────┬───────┬──────────┬────────────────┐    │
│  │ Variável       │ Score │ Percentil│ Classificação  │    │
│  ├────────────────┼───────┼──────────┼────────────────┤    │
│  │ At. Concentrada│  70   │   60     │ Médio          │    │
│  │ At. Dividida   │  65   │   55     │ Médio          │    │
│  │ At. Alternada  │  55   │   45     │ Médio          │    │
│  │ ⭐ At. Geral   │ 190   │   55     │ Médio          │    │
│  └────────────────┴───────┴──────────┴────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Configuração Expandida por Teste

```typescript
interface TestConfig {
  subtests: string[];
  names: Record<string, string>;
  mainSubtest: string;
  useRawScores?: string[];
  
  // NOVO: Configuração de exibição de entrada
  inputConfig: {
    type: 'ravlt' | 'fdt' | 'bpa2';
    fields: {
      key: string;
      label: string;
      group?: string; // Para agrupar campos
    }[];
  };
  
  // NOVO: Cálculos intermediários a exibir
  calculations?: {
    key: string;
    label: string;
    formula: string; // Ex: "A1 + A2 + A3 + A4 + A5"
  }[];
}
```

### Funções de Renderização por Teste

```typescript
// Renderiza dados de entrada do RAVLT
const renderRAVLTInputs = (rawScores: RAVLTRawScores) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="p-2 bg-muted/30 rounded">
      <Label className="text-xs text-muted-foreground">Tentativas</Label>
      <div className="flex gap-2 text-sm font-mono">
        <span>A1={rawScores.a1}</span>
        <span>A2={rawScores.a2}</span>
        <span>A3={rawScores.a3}</span>
        <span>A4={rawScores.a4}</span>
        <span>A5={rawScores.a5}</span>
      </div>
    </div>
    <div className="p-2 bg-muted/30 rounded">
      <Label className="text-xs text-muted-foreground">Lista B e Evocações</Label>
      <div className="flex gap-2 text-sm font-mono">
        <span>B1={rawScores.b1}</span>
        <span>A6={rawScores.a6}</span>
        <span>A7={rawScores.a7}</span>
      </div>
    </div>
    <div className="p-2 bg-muted/30 rounded col-span-2">
      <Label className="text-xs text-muted-foreground">Reconhecimento (antes de -35)</Label>
      <span className="text-sm font-mono ml-2">{rawScores.rec}</span>
    </div>
  </div>
);

// Renderiza cálculos do RAVLT
const renderRAVLTCalculations = (raw: RAVLTRawScores, calc: RAVLTCalculated) => (
  <div className="grid grid-cols-2 gap-2 text-sm">
    <div className="p-2 bg-blue-50 rounded flex justify-between">
      <span>Escore Total</span>
      <span className="font-mono">{raw.a1}+{raw.a2}+{raw.a3}+{raw.a4}+{raw.a5} = <b>{calc.escoreTotal}</b></span>
    </div>
    <div className="p-2 bg-blue-50 rounded flex justify-between">
      <span>Reconhecimento</span>
      <span className="font-mono">{raw.rec} - 35 = <b>{calc.reconhecimento}</b></span>
    </div>
    <div className="p-2 bg-muted/20 rounded flex justify-between">
      <span>ALT</span>
      <span className="font-mono">{calc.escoreTotal} - (5×{raw.a1}) = <b>{calc.alt}</b></span>
    </div>
    <div className="p-2 bg-muted/20 rounded flex justify-between">
      <span>Vel. Esquecimento</span>
      <span className="font-mono">{raw.a7}/{raw.a6} = <b>{calc.velocidadeEsquecimento}</b></span>
    </div>
  </div>
);
```

### Texto Copiado para Laudo (Formato Melhorado)

```text
================================================================================
TESTE: RAVLT - Teste de Aprendizagem Auditivo-Verbal de Rey
Paciente: João Silva (7 anos)
Data: 28/01/2026
Aplicador: Dr. Nome
================================================================================

DADOS DE ENTRADA:
- Tentativas: A1=2, A2=2, A3=18, A4=20, A5=48
- Lista B: B1=24
- Evocações: A6=12, A7=20
- Reconhecimento (bruto): 12

CÁLCULOS:
- Escore Total: 2+2+18+20+48 = 90
- Reconhecimento: 12-35 = -23
- ALT (Aprendizagem): 90-(5×2) = 80
- Velocidade de Esquecimento: 20/12 = 1.67
- Interferência Proativa: 24/2 = 12.00
- Interferência Retroativa: 12/48 = 0.25

RESULTADOS:
-------------------------------------------
Variável                | Bruto | Percentil | Classificação
-------------------------------------------
A1 (1ª tentativa)       |     2 |         5 | Inferior
A2 (2ª tentativa)       |     2 |         1 | Inferior
A3 (3ª tentativa)       |    18 |        99 | Superior
A4 (4ª tentativa)       |    20 |        99 | Superior
A5 (5ª tentativa)       |    48 |        99 | Superior
B1 (Lista B)            |    24 |        99 | Superior
A6 (Evocação imediata)  |    12 |        99 | Superior
A7 (Evocação tardia)    |    20 |        99 | Superior
Escore Total (A1-A5)    |    90 |        99 | Superior
Reconhecimento          |   -23 |         1 | Inferior
-------------------------------------------

OBSERVAÇÕES:
teste

================================================================================
```

---

## Resumo das Mudanças

| Componente | Alteração |
|------------|-----------|
| `PatientNeuroTestHistory.tsx` | Adicionar seções de entrada, cálculos e resultados por tipo de teste |
| `PatientNeuroTestHistory.tsx` | Implementar `renderRAVLTInputs()`, `renderFDTInputs()`, `renderBPA2Inputs()` |
| `PatientNeuroTestHistory.tsx` | Implementar `renderRAVLTCalculations()`, `renderFDTCalculations()`, `renderBPA2Calculations()` |
| `PatientNeuroTestHistory.tsx` | Melhorar `copyToClipboard()` para incluir todas as informações |
| `NeuroTestResults.tsx` | Aplicar as mesmas melhorias (exibição após salvar teste) |

---

## Benefícios

- Visualização completa do que foi digitado
- Transparência nos cálculos realizados
- Facilita auditoria e revisão dos dados
- Laudo gerado mais completo e profissional
- Diferenciação clara entre cada tipo de teste
