

## Plano: Auditoria e Correção dos Testes Neuropsicológicos

### Problemas Identificados

Após revisão completa dos 20 testes, formulários, lógica de cálculo e persistência no banco, identifiquei os seguintes problemas:

---

### 1. Hayling Adulto - Chaves incompatíveis (CRÍTICO)

O `getTestConfig('HAYLING_ADULTO')` nos dois componentes (`NeuroTestResults.tsx` e `PatientNeuroTestHistory.tsx`) define subtestes como `['parteA', 'parteB', 'total']`, mas os dados salvos no banco usam as chaves `tempoA`, `tempoB`, `errosB`, `inibiçãoBA` nos campos `percentiles` e `classifications`.

**Resultado:** Todos os percentis do Hayling Adulto aparecem como "-" no histórico porque `percentiles['parteA']` é `undefined`.

**Correção:** Atualizar o config para usar as 4 chaves corretas: `tempoA`, `tempoB`, `errosB`, `inibiçãoBA`, com os nomes de exibição correspondentes.

---

### 2. FVA - Gap normativo nas idades 11-12

As tabelas `CHILDREN_NORMS` cobrem 7-10 anos e `ADULT_NORMS` começa em 13 anos. Pacientes de 11-12 anos geram percentis nulos.

**Correção:** Adicionar dados normativos para 11-12 anos em `fvaPercentiles.ts`, ou estender a faixa de crianças (10 anos) para cobrir 11-12 como fallback.

---

### 3. PatientNeuroTestHistory - Seções de entrada/cálculos incompletas

O `renderInputAndCalculations` no histórico só tem renderização específica para RAVLT, FDT e BPA-2. Todos os outros testes (TIN, PCFO, TSBC, FVA, BNTBR, FAS, TOM, Taylor, TRPP, Trilhas, TMT, Hayling, TFV, FPT) caem no fallback genérico que mostra apenas badges com raw_scores, sem mostrar cálculos detalhados.

**Correção:** Copiar as funções de renderização específicas que já existem em `NeuroTestResults.tsx` (TIN, PCFO, TSBC, FVA, BNTBR) para `PatientNeuroTestHistory.tsx` e adicionar os cases no switch.

---

### 4. FDT - Config do NeuroTestResults desatualizado

O `getTestConfig('FDT')` em `NeuroTestResults.tsx` só lista `['inibicao', 'flexibilidade']` como subtestes, enquanto o `PatientNeuroTestHistory.tsx` já foi atualizado para mostrar todas as 10 métricas (tempos + erros + cálculos). O componente de resultado imediato após aplicar o teste não mostra os percentis de tempos e erros individuais.

**Correção:** Atualizar config do FDT em `NeuroTestResults.tsx` para incluir as 10 métricas.

---

### 5. TRPP - Campo percentiles armazena Escore Padrão

No salvamento: `percentiles: { total: trppResults.calculatedScores?.escorePadrao }`. Isso está correto conceitualmente (o TRPP usa EP), e a lista `EP_TESTS` já inclui `'TRPP'`, então exibe "EP" como prefixo. Sem problema funcional.

---

### Testes verificados sem problemas:

- **BPA-2**: Percentis calculados corretamente via tabela normativa por idade
- **RAVLT**: Cálculos e percentis com ranges corretos
- **TIN/PCFO/TSBC**: Escores Padrão via lookup table por idade, classificação correta
- **FAS**: Z-score → percentil via distribuição normal, classificação correta
- **TOM**: Z-score por idade (3-5 anos), percentil e classificação corretos
- **Taylor**: Z-score por grupo etário (<50/>=50), percentil correto
- **BNT-BR**: Z-score por faixa etária, percentil correto
- **Trilhas/Trilhas Pré-Escolar**: Escore Padrão via lookup, correto
- **TMT Adulto**: Percentis via lookup por idade e escolaridade, correto
- **Hayling Infantil**: Percentis via lookup por idade e tipo de escola, correto
- **TFV**: Percentis por idade e tipo de escola, correto
- **FPT Infantil/Adulto**: Percentis via lookup, correto

---

### Arquivos a modificar:

1. **`src/components/NeuroTestResults.tsx`** - Corrigir config Hayling Adulto + FDT
2. **`src/components/PatientNeuroTestHistory.tsx`** - Corrigir config Hayling Adulto + adicionar renders de entrada/cálculos para TIN, PCFO, TSBC, FVA, BNTBR, FAS, TOM, Taylor, TRPP, Trilhas, TMT, Hayling, TFV, FPT
3. **`src/data/neuroTests/fvaPercentiles.ts`** - Cobrir gap 11-12 anos

