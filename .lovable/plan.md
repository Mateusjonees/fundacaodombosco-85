

# Corrigir Exibicao de Permissoes na Pagina de Usuarios

## Problema Identificado

Ao abrir as permissoes de um funcionario na pagina `/users` (Gerenciar Usuarios), todas as permissoes aparecem como **"Nao configurado"** mesmo quando o funcionario ja tem permissoes pelo cargo (`employee_role`). Isso acontece porque o dialog so carrega as permissoes especificas do usuario (`user_specific_permissions`) e ignora as permissoes do cargo (`role_permissions`).

A pagina de Funcionarios (`/employees`) funciona corretamente porque usa o componente `EmployeePermissions` que ja faz a fusao dos dois tipos de permissao.

## Solucao

Atualizar o dialog de permissoes na pagina `UserManagement.tsx` para tambem carregar e exibir as permissoes do cargo do funcionario, mostrando o estado efetivo de cada permissao (igual ao componente `EmployeePermissions`).

## Detalhes Tecnicos

### Arquivo: `src/pages/UserManagement.tsx`

1. **Carregar o cargo e permissoes do cargo ao abrir o dialog**:
   - Ao selecionar um usuario, buscar o `employee_role` do perfil
   - Buscar as `role_permissions` para esse cargo
   - Mesclar com as `user_specific_permissions` para mostrar o estado efetivo

2. **Atualizar a UI do dialog de permissoes**:
   - Mostrar se a permissao vem do cargo (ex: "Permissao do Cargo") ou e personalizada
   - Mostrar o estado correto do Switch (ativo se vem do cargo OU se tem override ativo)
   - Quando a permissao vem do cargo e o usuario desativa, criar um override com `granted: false`
   - Indicar visualmente a origem da permissao (cargo vs personalizada vs bloqueada)

3. **Adicionar estados para**:
   - `selectedUserRole` (cargo do funcionario selecionado)
   - `roleBasedPermissions` (Set com permissoes que vem do cargo)

4. **Atualizar a funcao `loadUserPermissions`**:
   - Alem de carregar `user_specific_permissions`, tambem buscar o cargo e suas permissoes
   - Calcular o estado efetivo combinando cargo + overrides

5. **Atualizar o contador de permissoes por categoria**:
   - Considerar permissoes do cargo no calculo do badge (ex: "3/9" em vez de "0/9")

6. **Atualizar as acoes em massa**:
   - "Conceder Todas" e "Revogar Todas" devem considerar as permissoes do cargo

### Resultado Esperado

- Ao abrir as permissoes de um funcionario, os toggles ja aparecem ativados para as permissoes que o cargo concede
- Cada permissao mostra de onde vem: "Permissao do Cargo", "Personalizado: Permitido", ou "Bloqueado"
- O contador por categoria mostra o numero correto de permissoes ativas
- Todas as permissoes do sistema (incluindo `confirm_appointments`, `cancel_appointments`, etc.) estao visiveis e configuraveis

