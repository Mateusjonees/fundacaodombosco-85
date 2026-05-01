# Plano: Novo botão "Criar Usuário" + corrigir autocomplete

## Diagnóstico

**Sobre os "dados do Elvimar" aparecendo:**
O componente `CreateEmployeeForm` inicia o `formData` sempre vazio (`name: ''`, `email: ''`, etc.). O preenchimento automático que você vê **não vem do código** — é o **autocomplete do navegador (Chrome/Edge)**, que reconhece os campos `<Input type="email">` e nome e sugere o último cadastro feito (Elvimar). Solução: adicionar atributos `autoComplete="off"`, `name` único e `autoComplete="new-password"` em campos sensíveis, além de limpar o `formData` ao abrir.

**Sobre o botão atual:**
Em `src/pages/UserManagement.tsx` (linhas 510-515) há somente o botão **"Criar Diretor"** (com ícone Crown), que abre o `CreateEmployeeForm`. O usuário quer **manter este** e adicionar um segundo botão **"Criar Usuário"** ao lado.

## Mudanças

### 1. `src/pages/UserManagement.tsx` (cabeçalho da página, ~linha 508-515)
Adicionar segundo botão **"Criar Usuário"** ao lado do "Criar Diretor". Ambos abrem o mesmo `CreateEmployeeForm`, mas o novo botão passa `prefilledData` com `employee_role: 'staff'` (função padrão de usuário comum), enquanto "Criar Diretor" passa `employee_role: 'director'`.

```text
[Criar Diretor] [Criar Usuário] [Novo Cargo]
   (Crown)        (UserPlus)      (Briefcase)
```

Também passar a `prefilledData` para o `CreateEmployeeForm` na linha 1111 baseado em qual botão foi clicado (novo state `createMode: 'director' | 'user' | null`).

### 2. `src/components/CreateEmployeeForm.tsx`
- **Resetar formData ao abrir o dialog** mesmo quando não há `prefilledData` (atualmente o `useEffect` só reseta se `prefilledData` existir — daí o navegador "cola" valores antigos por cima).
- Adicionar `autoComplete="off"` no `<form>` e `autoComplete="new-password"` / `autoComplete="off"` nos inputs de nome, email, telefone para **bloquear o autopreenchimento do navegador**.
- Adicionar atributos `name` aleatórios (ex.: `name="emp-email-${Date.now()}"`) ou `data-lpignore="true"` para também bloquear gerenciadores de senha (LastPass, 1Password).

## Resultado esperado

- Dois botões no topo de **Gerenciar Usuários**: "Criar Diretor" (existente) e "Criar Usuário" (novo).
- O formulário abre **sempre limpo**, sem dados do Elvimar nem de cadastros anteriores.
- O navegador para de sugerir/auto-preencher os campos.

Sem mudanças no backend, edge functions ou banco. Apenas frontend.
