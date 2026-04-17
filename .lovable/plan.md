
Diagnóstico provável

Pelo código e pelos logs, o problema parece ser majoritariamente no cliente/PWA, não no Supabase:

- Os logs de auth mostram `POST /token` e `GET /user` com status `200`, então o login no backend está acontecendo.
- O perfil do usuário Christopher existe, está ativo e com cargo válido.
- O app instalado usa `vite-plugin-pwa` e ainda faz cache de chamadas `rest` do Supabase por até 24h.
- O `main.tsx` já tenta “auto-heal”, mas só quando o React nem monta. Se o app monta e fica preso em “Carregando...” ou “Verificando permissões...”, essa cura nunca dispara.
- A página `/limpar-cache` preserva o token do Supabase no `localStorage`, então em alguns casos ela pode manter justamente a sessão/token corrompidos do app instalado.

Isso combina exatamente com o relato: máquinas que têm ou tiveram o app instalado ficam com versão/cache/session state velho e não conseguem concluir a entrada.

Plano de correção

1. Endurecer a inicialização do app
- Ajustar `src/main.tsx` para considerar “boot travado” não só quando o root está vazio, mas também quando o app não sai do estado de loading/permissões após um tempo.
- Criar um marcador explícito de boot concluído para diferenciar “React montou” de “app ficou utilizável”.
- Se travar, limpar SW/cache/IndexedDB e recarregar automaticamente.

2. Remover o cache perigoso do Supabase no PWA
- Ajustar `vite.config.ts`.
- Parar de cachear respostas `rest` do Supabase no Service Worker, especialmente dados de bootstrap como:
  - `profiles`
  - `get_user_permissions`
  - permissões/roles
- Manter offline via IndexedDB já existente, em vez de depender de cache HTTP do Workbox para auth/perfis.

3. Fortalecer a recuperação manual
- Atualizar `src/pages/ClearCache.tsx` para ter limpeza realmente completa em caso de app instalado:
  - remover Service Workers
  - remover caches
  - limpar IndexedDB
  - limpar também token/session do Supabase quando for modo “hard reset”
- Manter opção de limpeza “leve” e adicionar limpeza “completa” para casos de login quebrado.
- Melhorar o link da tela de login para deixar claro: “Se o app foi instalado e não entra, toque aqui”.

4. Evitar spinner infinito pós-login
- Revisar `src/components/auth/AuthProvider.tsx`, `src/hooks/useCurrentUser.ts`, `src/hooks/useCustomPermissions.ts` e `src/hooks/useRolePermissions.ts`.
- Adicionar timeout e fallback visual quando profile/permissões demorarem demais.
- Se a sessão já autenticou mas perfil/permissões falharem, mostrar ação de recuperação em vez de deixar só “Carregando...”.

5. Adicionar instrumentação de diagnóstico
- Inserir logs claros nos pontos críticos:
  - início do `getSession`
  - retorno do `onAuthStateChange`
  - carregamento de `profiles`
  - RPC `get_user_permissions`
  - fallback offline
  - detecção de SW antigo
- Isso ajuda a confirmar em qual etapa cada usuário trava se ainda houver casos residuais.

6. Ajuste de UX emergencial
- Na tela de login e no menu do usuário, manter “Atualizar Sistema”.
- Na rota `/install`, incluir aviso para quem já tinha o app instalado antes:
  “Se o aplicativo antigo não estiver entrando, atualize o sistema antes de tentar novamente.”

7. Validação após implementação
- Testar no site publicado, não só no preview.
- Cenários:
  1. navegador normal sem app instalado
  2. app já instalado
  3. app instalado com versão antiga
  4. logout/login após atualização
  5. uso do `/limpar-cache`
  6. Chrome/Edge em Windows
- Confirmar que o usuário autenticado sai da tela de loading e chega ao app.

Arquivos que pretendo alterar
- `vite.config.ts`
- `src/main.tsx`
- `src/utils/cacheControl.ts`
- `src/pages/ClearCache.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/auth/AuthProvider.tsx`
- `src/hooks/useCurrentUser.ts`
- `src/hooks/useCustomPermissions.ts`
- `src/hooks/useRolePermissions.ts`

Observações técnicas
- Não vejo, neste momento, necessidade de migration no banco para resolver este problema.
- O maior suspeito é a combinação de:
  1. Service Worker antigo
  2. cache de `/rest` do Supabase
  3. lógica de boot que não detecta travamento parcial
  4. limpeza que preserva token antigo
- Se você quiser uma contenção imediata, eu também posso incluir um modo mais conservador: desativar temporariamente o uso de cache de dados do Supabase no PWA e deixar o app instalado funcionar como “shell instalável + dados sempre online”, usando o IndexedDB só como apoio offline local.

Resultado esperado
- Usuários com app instalado deixam de ficar presos no login/carregamento.
- Máquinas com instalação antiga se auto-recuperam com muito mais frequência.
- Quando houver sessão quebrada, o próprio sistema oferece recuperação clara, em vez de parecer que “não faz login”.
