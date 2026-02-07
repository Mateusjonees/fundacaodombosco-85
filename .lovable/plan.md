
# Plano de Correção das 4 Abas de Gestão

## Problema 1: Gerenciar Funcionarios - Nao Consegue Deletar

**Causa raiz**: A URL da edge function `delete-users` esta apontando para o projeto Supabase **errado**. O codigo usa `import.meta.env.VITE_SUPABASE_URL` (que nao e suportado pelo Lovable) com fallback para `uzcfscnbkbeqxmjgxklq.supabase.co`, mas o projeto correto e `vqphtzkdhfzdwbumexhe.supabase.co`.

**Solucao**: Corrigir a chamada de delete para usar `supabase.functions.invoke('delete-users', ...)` em vez de `fetch` manual com URL errada. Isso garante que sempre use o projeto correto.

---

## Problema 2: Controle de Funcionario - Informacoes Incompletas

**Causa raiz**: A pagina EmployeeControl nao exibe campos como `units` (unidades), `unit`, `salary`, `document_cpf`, `document_rg`, `birth_date`, `address` que existem na tabela `profiles`.

**Solucao**: Adicionar na aba "Visao Geral" do detalhe do funcionario os campos faltantes:
- Unidades de atuacao (`units`)
- Unidade principal (`unit`)  
- Salario (`salary`)
- RG (`document_rg`)
- Data de nascimento (`birth_date`)
- Endereco (`address`)

---

## Problema 3: Cargos Personalizados Nao Impactam o Sistema

**Causa raiz**: Os cargos em `custom_job_positions` sao apenas cadastros independentes. Nao estao conectados ao sistema de permissoes, nem aos perfis dos usuarios. A tabela `user_job_assignments` existe mas nao e utilizada para controle de acesso.

**Solucao**:
- Na pagina UserManagement, ao clicar em um usuario, adicionar opcao de atribuir cargos personalizados
- Permitir que cargos personalizados tenham permissoes associadas
- Integrar `user_job_assignments` na logica de permissoes do sistema

---

## Problema 4: Gerenciar Usuarios e Permissoes - Sem Controle de Unidade e Abas

**Causa raiz**: O dialog de permissoes do usuario na pagina UserManagement nao inclui:
- Selecao de quais unidades o usuario pode acessar (campo `units` no profiles)
- Controle granular de quais abas/paginas o usuario pode visualizar

**Solucao**: 
- Adicionar secao "Unidades de Acesso" no dialog de permissoes com checkboxes para cada unidade (madre, floresta, atendimento_floresta, neuro, etc.)
- As permissoes de aba ja existem no sistema (view_dashboard, view_clients, view_schedules, etc.) mas precisam ser exibidas de forma mais clara com toggle por aba

---

## Detalhes Tecnicos

### Arquivo: `src/pages/Employees.tsx` (linhas 193-205)
Substituir o `fetch` manual pela chamada via SDK:
```typescript
const { data: result, error } = await supabase.functions.invoke('delete-users', {
  body: { userId: employeeToDelete.user_id }
});
if (error) throw error;
if (result?.error) throw new Error(result.error);
```

### Arquivo: `src/pages/EmployeeControl.tsx` (linhas 423-458)
Adicionar campos extras na secao "Dados Pessoais":
- Unidades, Salario, RG, Data Nascimento, Endereco

### Arquivo: `src/pages/UserManagement.tsx` (linhas 710-745)
Adicionar ao dialog de permissoes:
- Secao "Unidades de Acesso" com checkboxes para cada unidade disponivel
- Botao para salvar unidades no campo `units` do profile
- Melhorar visualizacao das permissoes de visualizacao de abas

### Arquivo: `src/pages/CustomRoles.tsx`
Adicionar integracao com permissoes:
- Ao criar/editar cargo, permitir definir permissoes padrao associadas
- Ao atribuir cargo a usuario, aplicar permissoes automaticamente

### Migracao SQL necessaria
- Adicionar coluna `permissions` (jsonb) na tabela `custom_job_positions` para guardar permissoes padrao de cada cargo
