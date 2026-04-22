

## Correção: Pacientes vinculados não aparecem para funcionários do Atendimento Floresta

### Problemas Identificados

Após análise detalhada do banco de dados, RLS e código frontend, encontrei **três problemas concretos** que afetam a unidade Atendimento Floresta:

#### 1. RLS de `client_assignments` exclui `coordinator_atendimento_floresta`
A política "Coordinators can manage assignments" só inclui `coordinator_madre`, `coordinator_floresta` e `director`. O cargo `coordinator_atendimento_floresta` está **ausente**, impedindo coordenadores desta unidade de visualizar e gerenciar vinculações de pacientes a profissionais.

#### 2. `isCoordinatorOrDirector()` em Clients.tsx exclui `coordinator_atendimento_floresta`
A função auxiliar na página de Pacientes (linha 143-145) só reconhece `director`, `coordinator_madre` e `coordinator_floresta`. Isso esconde a aba "Gerenciar Vinculações", filtros de profissional, e ações de edição/relatório para coordenadores de Atendimento Floresta.

#### 3. Falta de tratamento de erro visível para profissionais
Se a query de `client_assignments` falhar silenciosamente, o sistema cai no fallback offline que não aplica filtro de `employeeId`, potencialmente retornando lista vazia (cache offline vazio para profissionais).

### Dados Verificados no Banco
- Fernanda (speech_therapist): **18 vinculações ativas** existem na tabela `client_assignments`
- Cynthia, Maria Carolina, Thais: também possuem vinculações ativas
- Todos os clientes vinculados estão ativos e na unidade `atendimento_floresta`
- As políticas RLS de `clients` e `schedules` já incluem `coordinator_atendimento_floresta`

### Correções Planejadas

#### 1. Migration: Atualizar RLS de `client_assignments`
- Recriar a política "Coordinators can manage assignments" incluindo `coordinator_atendimento_floresta` na lista de roles permitidos

#### 2. Clients.tsx: Incluir `coordinator_atendimento_floresta`
- Atualizar `isCoordinatorOrDirector()` (linha 143-145) para incluir `coordinator_atendimento_floresta`
- Garantir que coordenadores de Atendimento Floresta tenham acesso completo às funcionalidades de gestão

#### 3. useClients.ts: Melhorar fallback offline para profissionais
- Adicionar filtro `employeeId` no fallback offline (linhas 96-115) para que profissionais não vejam dados incorretos quando offline
- Adicionar `console.error` mais descritivo quando a query falha para facilitar debug futuro

### Arquivos Alterados
- **Migration SQL**: atualizar RLS policy em `client_assignments`
- `src/pages/Clients.tsx`: incluir `coordinator_atendimento_floresta` em `isCoordinatorOrDirector()`
- `src/hooks/useClients.ts`: melhorar fallback offline com filtro de employeeId

