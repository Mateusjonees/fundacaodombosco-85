# Corrigir pacientes aparecendo como "N/A" na agenda

## Diagnóstico (causa raiz)

Verifiquei direto no banco: o agendamento das 08:00 com a profissional **Carmen Cenira** está vinculado ao paciente **Miguel Avelino Atanázio Pinheiro** (e o das 15:30 ao **Taylor Peterson Honorato**). Os dados existem corretamente — o problema é de **permissão de leitura**.

A política de RLS da tabela `clients` só deixa um profissional ler o registro do paciente quando existe um vínculo ativo em `client_assignments` (profissional ↔ paciente). Como esse vínculo está ausente, o JOIN do hook `useSchedules` retorna `clients = null` e o `ScheduleCard` cai no fallback `'N/A'`.

Existe um trigger (`trigger_auto_assign_client` → `auto_assign_client_on_schedule`) que cria o vínculo automaticamente ao agendar, e ele está **ativo**. O problema é histórico: **1.630 agendamentos** foram criados antes do trigger / por fluxos que não dispararam o trigger e ficaram sem vínculo. Profissionais mais afetados:

- Marina Adriana Xavier — 407 agendamentos sem vínculo
- Patrícia Gomes Soares Alves — 332
- Cristiane Aparecida Kosiniuk — 228
- Tatiana Souto da Silveira — 150
- Renata Lorena Barbosa Braga — 136
- Carmen Cenira (do print) — 78
- ... e outros

## O que vou fazer

**1. Migration de backfill (única ação necessária)**

Criar uma migration que percorre `schedules` e insere em `client_assignments` todos os pares `(client_id, employee_id)` que ainda não têm vínculo ativo:

```sql
INSERT INTO public.client_assignments (client_id, employee_id, assigned_by, assigned_at, is_active)
SELECT DISTINCT s.client_id, s.employee_id, COALESCE(s.created_by, s.employee_id), now(), true
FROM public.schedules s
WHERE s.client_id IS NOT NULL
  AND s.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.client_assignments ca
    WHERE ca.client_id = s.client_id
      AND ca.employee_id = s.employee_id
      AND ca.is_active = true
  );
```

Resultado esperado: ~1.630 vínculos criados, e todos os cards "N/A" voltam a exibir o nome do paciente imediatamente após o refresh.

**2. Não preciso mexer em código frontend** — o `useSchedules` e o `ScheduleCard` já estão corretos. O trigger também já está no lugar para novos agendamentos, então o problema não volta a acontecer.

## Detalhes técnicos

- A migration é idempotente (`NOT EXISTS`), pode rodar múltiplas vezes sem duplicar.
- `assigned_by` recebe `created_by` do schedule quando disponível, senão o próprio `employee_id` (necessário porque o campo é `NOT NULL`).
- Não altero o trigger existente nem políticas de RLS — o modelo de segurança continua igual.
- Após a migration, o cache do React Query do usuário é invalidado naturalmente no próximo fetch (basta recarregar a agenda).
