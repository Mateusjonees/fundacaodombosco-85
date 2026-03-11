

## Plano: Corrigir contagem de laudos na página de Pacientes

### Problema

A contagem "Com Laudo" mostra apenas 10 porque a query na linha 198 de `Clients.tsx` filtra por `.eq('status', 'active')`. Porém, a maioria dos laudos são inseridos sem um valor de `status` (ficam `null`), então são excluídos da contagem.

### Solução

Remover o filtro `.eq('status', 'active')` da query de laudos. A contagem deve considerar **qualquer laudo existente** para o paciente, independente do status. Basta buscar `client_id` distintos da tabela `client_laudos` sem filtro de status.

### Alteração

**`src/pages/Clients.tsx`** (linha 198):
- De: `supabase.from('client_laudos').select('client_id').eq('status', 'active')`
- Para: `supabase.from('client_laudos').select('client_id')`

Isso fará com que todos os pacientes que possuem pelo menos um laudo (qualquer status) sejam contados corretamente.

