

## Diagnóstico e Plano de Correção

### Causa Raiz Identificada

Os logs do console revelam o erro real:

```
column clients.neuro_evaluation_status does not exist
```

O hook `useClients.ts` solicita a coluna `neuro_evaluation_status` na query, mas essa coluna **nao existe** na tabela `clients` do banco de dados. Isso faz a query falhar completamente, e o sistema cai no fallback de cache offline (IndexedDB), que esta vazio apos um login limpo. Por isso aparece "zerado".

Isso afeta **todos os usuarios** (diretores, coordenadores, profissionais) igualmente, porque a query sempre falha antes de chegar nas politicas RLS.

### Problemas Adicionais

1. **`useSchedules.ts`**: O filtro de coordenadores e hardcoded por cargo (ex: `coordinator_floresta` = so ve `floresta`). Tatiane, que tem `units=[madre,floresta,atendimento_floresta]`, e tratada como `coordinator_floresta` e so ve agendamentos de pacientes da unidade "floresta". Precisa usar o array `units` do perfil.

2. **RLS (Row-Level Security)**: As funcoes `can_access_client_unit` e `can_update_client_unit` ja estao corretas e funcionais. O problema nunca foi RLS, foi a query quebrada.

---

### Tarefas de Implementacao

#### Tarefa 1: Remover coluna inexistente da query de clientes
**Arquivo**: `src/hooks/useClients.ts`
- Remover `neuro_evaluation_status` de `LIST_COLUMNS` (linha 15)
- Isso corrige o erro fatal que zera os pacientes para TODOS os usuarios

#### Tarefa 2: Remover referencia em tipos/interfaces
**Arquivos**: `src/pages/Clients.tsx` (linha 68), `src/components/clients/ClientsTable.tsx` (linha 18)
- Remover `neuro_evaluation_status` das interfaces `Client`
- Campos opcionais nao causam erro, mas mantem consistencia

#### Tarefa 3: Corrigir filtro de agendamentos para coordenadores com multiplas unidades
**Arquivo**: `src/hooks/useSchedules.ts` (linhas 60-91)
- Antes de verificar o cargo especifico do coordenador, checar se o perfil tem um array `units`
- Se `units` existir, buscar clientes de TODAS as unidades do array
- Isso garante que Tatiane veja agendamentos de madre + floresta + atendimento_floresta

Logica atual (hardcoded por cargo):
```
if coordinator_madre -> busca clientes unit=madre
if coordinator_floresta -> busca clientes unit=floresta
```

Logica corrigida:
```
if coordinator AND units array exists -> busca clientes in(units)
else if coordinator_madre -> busca clientes unit=madre (fallback)
...
```

---

### Resumo das Regras de Visibilidade

| Cargo | Pacientes | Agenda |
|---|---|---|
| Director | Todos (414) | Todos |
| Tatiane (coord c/ 3 unidades) | Todos (414) | Todos |
| Coordenador (1 unidade) | So da sua unidade | So da sua unidade |
| Recepcionista | Todas as unidades | Todas as unidades |
| Profissional | So vinculados (assignments) | So seus agendamentos |

### Impacto
- A correcao da Tarefa 1 resolve imediatamente o problema de "zerado" para todos os usuarios em todos os ambientes (preview, dominio publicado, dominio customizado)
- A correcao da Tarefa 3 garante que Tatiane veja a agenda completa de todas as unidades

