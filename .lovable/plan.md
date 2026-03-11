

## Plano: Restringir Visualização de Pacientes ao Profissional Designado

### Diagnóstico
A política RLS na tabela `clients` permite que profissionais vejam clientes vinculados via `client_assignments`, `client_feedback_control` ou `schedules`. Isso está correto no banco de dados. Porém, o profissional pode estar vendo clientes de agendamentos antigos/cancelados, e o cache offline pode estar exibindo dados de sessões anteriores com outro usuário.

O problema mais provável é que a página Clientes (`Clients.tsx`) usa o hook `useClients` que busca todos os clientes acessíveis via RLS sem filtro adicional por vínculo ativo. Um profissional que teve agendamentos com muitos clientes (mesmo cancelados) verá todos eles.

### Alterações

#### 1. `src/hooks/useClients.ts` — Filtrar por vínculo para profissionais

Adicionar um parâmetro `employeeId` ao hook. Quando o usuário é um profissional (não admin/coordenador/recepcionista), a query deve buscar apenas clientes da tabela `client_assignments` com `is_active = true`, em vez de buscar diretamente da tabela `clients`.

Para profissionais:
```sql
-- Buscar apenas client_ids ativos via client_assignments
SELECT client_id FROM client_assignments 
WHERE employee_id = user.id AND is_active = true
```
Depois filtrar: `query.in('id', assignedClientIds)`

#### 2. `src/pages/Clients.tsx` — Passar filtro de profissional

Para roles profissionais (psychologist, speech_therapist, etc.), passar o `employeeId` para o `useClients`. Para admins/coordenadores/recepcionistas, manter o comportamento atual (ver todos da unidade).

#### 3. Migration SQL — Restringir RLS do `clients`

Remover a cláusula `schedules` da política SELECT do `clients` para evitar que agendamentos antigos/cancelados expandam a visibilidade:

```sql
DROP POLICY "View clients policy" ON clients;
CREATE POLICY "View clients policy" ON clients FOR SELECT USING (
  -- Diretores, coordenadores, recepcionistas: mantém acesso atual
  ...
  -- Profissionais: APENAS via client_assignments ativos (remover schedules)
  OR (EXISTS (SELECT 1 FROM client_assignments ca 
    WHERE ca.client_id = clients.id AND ca.employee_id = auth.uid() AND ca.is_active = true))
  OR (EXISTS (SELECT 1 FROM client_feedback_control cfc 
    WHERE cfc.client_id = clients.id AND cfc.assigned_to = auth.uid()))
);
```

Isso remove o acesso via `schedules` (que inclui agendamentos antigos/cancelados) e mantém apenas vínculos ativos.

#### 4. Limpar cache offline

Adicionar limpeza do cache IndexedDB no logout/troca de usuário para evitar dados residuais de outro perfil.

