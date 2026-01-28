# Plano: Sistema de Testes Neuropsicológicos para Unidade Neuro

## Status: ✅ IMPLEMENTADO

---

## Resumo

Sistema completo para estagiários da unidade **Floresta (Neuro)** aplicarem testes neuropsicológicos durante a finalização de atendimentos. O sistema calcula automaticamente resultados, percentis e classificações com base em tabelas normativas por idade do paciente.

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/data/neuroTests/bpa2.ts` | Definição do teste BPA-2, fórmulas e classificações |
| `src/data/neuroTests/bpa2Percentiles.ts` | Tabelas normativas completas (6-81 anos) |
| `src/data/neuroTests/index.ts` | Exportações centralizadas |
| `src/components/NeuroTestSelector.tsx` | Seletor de testes por idade |
| `src/components/NeuroTestBPA2Form.tsx` | Formulário de escores com cálculos automáticos |
| `src/components/NeuroTestResults.tsx` | Exibição de resultados calculados |
| `src/components/PatientNeuroTestHistory.tsx` | Histórico de testes no perfil do paciente |

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/CompleteAttendanceDialog.tsx` | Integração do sistema de testes neuro |
| `src/components/ClientDetailsView.tsx` | Nova aba "Testes Neuro" para unidade Floresta |

## Migração SQL

Tabela `neuro_test_results` criada com:
- Campos para escores brutos, calculados, percentis e classificações (JSONB)
- RLS policies para usuários autenticados
- Índices para buscas eficientes
- Trigger para updated_at automático

---

## Como Usar

### 1. Finalizar Atendimento (Unidade Floresta)

1. Clicar em "Finalizar Atendimento" para paciente da unidade Floresta
2. O sistema mostra testes disponíveis para a idade do paciente
3. Selecionar BPA-2 (ou outro teste futuro)
4. Preencher escores: Acertos, Erros, Omissões para cada subteste
5. Sistema calcula automaticamente:
   - AC, AD, AA (individual)
   - AG = AC + AD + AA (geral)
   - Percentis por idade
   - Classificações

### 2. Visualizar Histórico (Perfil do Paciente)

1. Acessar perfil de paciente da unidade Floresta
2. Ir para aba "Testes Neuro"
3. Ver histórico com todos os testes aplicados
4. Clicar em "Copiar para Laudo" para gerar texto formatado

---

## Classificações

| Percentil | Classificação |
|-----------|---------------|
| ≤1 | Muito Inferior |
| 2-10 | Inferior |
| 11-25 | Médio Inferior |
| 26-75 | Médio |
| 76-90 | Médio Superior |
| 91-95 | Superior |
| ≥96 | Muito Superior |

---

## Extensibilidade

Para adicionar novos testes:

1. Criar `src/data/neuroTests/[nome].ts` com definição
2. Criar `src/data/neuroTests/[nome]Percentiles.ts` com tabelas
3. Adicionar ao `index.ts`
4. Criar formulário específico se necessário

Testes futuros planejados: WISC-V, SNAP-IV, etc.
