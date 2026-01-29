
# Plano: Corrigir Exibição Dinâmica dos Testes Neuropsicológicos e Funcionalidade de Copiar para Laudo

## Problema Identificado

Os componentes de exibição de resultados de testes neuropsicológicos estão **hardcoded** para usar apenas os subtestes do BPA-2 (AC, AD, AA, AG), quando cada teste tem seus próprios subtestes:

| Teste | Subtestes |
|-------|-----------|
| **BPA-2** | AC (Atenção Concentrada), AD (Atenção Dividida), AA (Atenção Alternada), AG (Atenção Geral) |
| **RAVLT** | A1-A7, B1, Escore Total, Reconhecimento |
| **FDT** | Inibição, Flexibilidade |

### Problemas atuais:
1. A tela mostra subtestes do BPA-2 para o RAVLT (como na imagem)
2. Todos os valores aparecem como 0 porque não existe `AC`, `AD`, `AA`, `AG` nos dados do RAVLT
3. A função "Copiar para Laudo" também copia os subtestes errados
4. O componente `NeuroTestResults.tsx` só funciona para BPA-2

---

## Solução

Criar um sistema dinâmico que:
1. Detecta o tipo de teste pelo `test_code`
2. Exibe os subtestes corretos para cada teste
3. Gera texto formatado corretamente para o laudo

---

## Arquivos a Modificar

### 1. `src/components/PatientNeuroTestHistory.tsx`
**Principal componente afetado** - Exibe o histórico de testes do paciente

**Alterações:**
- Criar função `getTestSubtests(testCode)` que retorna os subtestes corretos
- Criar função `getSubtestDisplayName(testCode, subtestCode)` para nomes amigáveis
- Atualizar a exibição da tabela para usar subtestes dinâmicos
- Corrigir a função `copyToClipboard` para gerar texto correto por tipo de teste
- Identificar o "subteste principal" de cada teste para destaque visual

### 2. `src/components/NeuroTestResults.tsx`
**Componente de resultado individual** - Usado após aplicar um teste

**Alterações:**
- Tornar o componente genérico para todos os tipos de teste
- Aceitar o `testCode` e detectar subtestes automaticamente
- Corrigir a função de copiar para laudo

---

## Detalhes Técnicos

### Mapeamento de Subtestes por Teste

```typescript
const getTestConfig = (testCode: string) => {
  switch (testCode) {
    case 'BPA2':
      return {
        subtests: ['AC', 'AD', 'AA', 'AG'],
        names: {
          AC: 'Atenção Concentrada',
          AD: 'Atenção Dividida',
          AA: 'Atenção Alternada',
          AG: 'Atenção Geral'
        },
        mainSubtest: 'AG'
      };
    case 'RAVLT':
      return {
        subtests: ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'a6', 'a7', 'escoreTotal', 'reconhecimento'],
        names: {
          a1: 'A1 (1ª tentativa)',
          a2: 'A2 (2ª tentativa)',
          a3: 'A3 (3ª tentativa)',
          a4: 'A4 (4ª tentativa)',
          a5: 'A5 (5ª tentativa)',
          b1: 'B1 (Lista B)',
          a6: 'A6 (Evocação imediata)',
          a7: 'A7 (Evocação tardia)',
          escoreTotal: 'Escore Total',
          reconhecimento: 'Reconhecimento'
        },
        mainSubtest: 'escoreTotal'
      };
    case 'FDT':
      return {
        subtests: ['inibicao', 'flexibilidade'],
        names: {
          inibicao: 'Inibição',
          flexibilidade: 'Flexibilidade'
        },
        mainSubtest: 'inibicao'
      };
    default:
      return null;
  }
};
```

### Geração de Texto para Laudo (Exemplo RAVLT)

```text
TESTE: RAVLT - Teste de Aprendizagem Auditivo-Verbal de Rey
Paciente: João Silva (7 anos)
Data: 28/01/2026

RESULTADOS:
-------------------------------------------
Variável             | Bruto | Percentil | Classificação
-------------------------------------------
A1 (1ª tentativa)    |     2 |         5 | Inferior
A2 (2ª tentativa)    |     2 |         1 | Inferior
A3 (3ª tentativa)    |    18 |        99 | Superior
A4 (4ª tentativa)    |    20 |        99 | Superior
A5 (5ª tentativa)    |    48 |        99 | Superior
B1 (Lista B)         |    24 |        99 | Superior
A6 (Evocação imediata)|   12 |        99 | Superior
A7 (Evocação tardia) |    20 |        99 | Superior
Escore Total         |    90 |        99 | Superior
Reconhecimento       |   -23 |         1 | Inferior
-------------------------------------------
```

### Lógica para "Copiar para Laudo"

```typescript
const copyToClipboard = (test: NeuroTestResult) => {
  const config = getTestConfig(test.test_code);
  if (!config) return;
  
  const lines = [
    `TESTE: ${test.test_name}`,
    `Paciente: ${clientName} (${test.patient_age} anos)`,
    `Data: ${new Date(test.applied_at).toLocaleDateString('pt-BR')}`,
    '',
    'RESULTADOS:',
    '-------------------------------------------',
    'Variável             | Bruto | Percentil | Classificação',
    '-------------------------------------------'
  ];

  config.subtests.forEach(code => {
    const name = config.names[code] || code;
    const raw = test.raw_scores?.[code] ?? test.calculated_scores?.[code] ?? '-';
    const percentile = test.percentiles?.[code] ?? '-';
    const classification = test.classifications?.[code] ?? '-';
    
    lines.push(
      `${name.padEnd(20)} | ${String(raw).padStart(5)} | ${String(percentile).padStart(9)} | ${classification}`
    );
  });

  lines.push('-------------------------------------------');
  
  if (test.notes) {
    lines.push('', 'OBSERVAÇÕES:', test.notes);
  }

  navigator.clipboard.writeText(lines.join('\n'));
};
```

---

## Resultado Esperado

### Antes (problema atual):
- RAVLT mostra AC, AD, AA, AG com valores 0
- Copiar para laudo gera texto com subtestes errados

### Depois (corrigido):
- RAVLT mostra A1-A7, B1, Escore Total, Reconhecimento com valores corretos
- FDT mostra Inibição e Flexibilidade
- BPA-2 continua mostrando AC, AD, AA, AG
- Copiar para laudo gera texto formatado correto para cada tipo de teste

---

## Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `PatientNeuroTestHistory.tsx` | Exibição dinâmica de subtestes + copiar para laudo corrigido |
| `NeuroTestResults.tsx` | Tornar genérico para todos os testes |

