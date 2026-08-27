# Corrigir erro ao criar funcionário

## O que está acontecendo

O usuário chega a ser criado no sistema de autenticação, mas o preenchimento do perfil falha e a função apaga o usuário — por isso o erro vermelho "Edge Function returned a non-2xx status code".

Confirmado nos logs da função `create-users`:

```text
User created: 557df0e1-...
Error updating profile: Not authorized to change unit
```

## Causa

O gatilho de segurança `check_profile_update_allowed` (criado na última rodada de segurança dos perfis) bloqueia alterações em campos sensíveis — `unit`, `units`, `employee_role`, `department`, etc. — para quem não for diretor.

Ele libera a alteração apenas quando `is_director()` retorna verdadeiro, o que depende de um usuário logado. A função `create-users` roda com a chave administrativa do servidor (service_role), sem usuário logado, então o gatilho a trata como "não autorizada" e derruba o cadastro. Ou seja: nenhum funcionário novo com unidade/função definida consegue ser criado hoje.

## Correção

Uma migração ajustando o gatilho para também liberar chamadas administrativas do servidor, mantendo todo o resto do bloqueio intacto:

- Liberar quando a conexão for `service_role` (funções de borda e rotinas administrativas).
- Liberar quando não houver usuário autenticado no contexto (gatilhos internos do banco, como o de criação inicial do perfil).
- Manter exatamente as mesmas restrições para usuários comuns logados: continuam sem poder mudar função, unidade, salário, permissões, departamento ou status ativo.

## Verificação

Depois da migração, criar de novo o funcionário `vendas@fundacaodombosco.org` (Coordenador Floresta, unidade Floresta) e conferir nos logs da função que o perfil é atualizado sem erro, e que um usuário não-diretor continua impedido de alterar a própria função/unidade.
