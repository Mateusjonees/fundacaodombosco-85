

## Plano: Corrigir visibilidade de pacientes e acesso de agendamento multi-unidade

### Problemas identificados

1. **Diretores não veem pacientes**: A RLS na tabela `clients` parece correta (tem `director_has_god_mode()` e checagem de director na "View clients policy"). Preciso verificar se há conflito de políticas ou se o `useCurrentUser` não carrega o perfil corretamente. Vou garantir que a RLS funcione e que o código não filtre indevidamente.

2. **Coordenador Atendimento Floresta sem acesso a agendamentos**: A política "View schedules with unit access control" NÃO inclui `coordinator_atendimento_floresta`. Também a função `is_coordinator()` não inclui esse cargo.

3. **Gabriel (receptionist)**: Tem `units: [atendimento_floresta]`, mas precisa agendar para TODAS as unidades. Precisa `units: [madre, floresta, atendimento_floresta]`.

4. **Felipe (receptionist)**: Tem `units: [floresta, atendimento_floresta]`, mas precisa agendar para TODAS as unidades. Precisa `units: [madre, floresta, atendimento_floresta]`.

### Alterações

#### 1. Migração SQL - Corrigir RLS e função `is_coordinator`

- **Atualizar `is_coordinator()`** para incluir `coordinator_atendimento_floresta`
- **Atualizar RLS de schedules** "View schedules with unit access control" para incluir `coordinator_atendimento_floresta` (unit = 'atendimento_floresta')
- **Atualizar RLS de schedules** "Update schedules with unit access control" - mesma correção
- **Atualizar RLS de schedules** "Delete schedules with unit access control" - mesma correção

#### 2. Atualizar unidades de Gabriel e Felipe (INSERT tool)

```sql
UPDATE profiles SET units = ARRAY['madre','floresta','atendimento_floresta']
WHERE user_id IN (
  '72c334c0-97a3-4b9c-a78b-751ceefa8cc9',  -- Gabriel
  '7571f0eb-e676-4650-a510-f4e6ed7bbe5b'   -- Felipe
);
```

#### 3. Código - `useSchedules.ts`

Sem alteração necessária: o hook já usa o array `units` do perfil para receptionists (linhas 73-87), e com `units` atualizado para todos, Gabriel e Felipe verão todos os agendamentos.

#### 4. Código - `useClients.ts`

Sem alteração necessária: para directors, `isRestrictedRole` é `false`, então não filtra por `employeeId`. A RLS deve permitir acesso total.

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| Nova migração SQL | Recriar `is_coordinator()`, atualizar RLS de schedules |
| Dados (via insert tool) | Atualizar `units` de Gabriel e Felipe |

