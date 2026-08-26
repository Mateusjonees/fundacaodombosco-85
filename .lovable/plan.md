# Diagnóstico do sistema — o que dá para melhorar

Levantamento feito sobre o código atual (370 arquivos em `src`, ~107 mil linhas) e sobre o banco.

## 1. Segurança (prioridade alta)

- O linter do banco aponta **126 avisos** de funções `SECURITY DEFINER` que podem ser executadas por qualquer visitante (anônimo) ou por qualquer usuário logado. A maioria dessas funções é de uso interno (checagem de papel, triggers, relatórios) e deveria ter o `EXECUTE` revogado de `anon`/`authenticated`.
- **Proteção contra senhas vazadas está desativada** no Supabase Auth — ativar é uma configuração simples e aumenta bastante a segurança de contas.
- **Postgres com patches de segurança pendentes** — upgrade recomendado.
- O "lembrar senha" guarda a senha no navegador de forma reversível. Vale migrar para sessão persistente do Supabase (refresh token), que é o padrão seguro e continua entrando automático.

## 2. Performance percebida

- Arquivos gigantes que carregam de uma vez: `Reports.tsx` (3.171 linhas), `CompleteAttendanceDialog.tsx` (2.234), `PatientNeuroTestHistory.tsx` (2.107), `ClientDetailsView.tsx` (1.896), `Financial.tsx` (1.866). Quebrar em subcomponentes e carregar abas sob demanda reduz o tempo de abertura dessas telas.
- Listas longas (pacientes, agenda, estoque) renderizam todos os itens; virtualização deixaria a rolagem fluida em celular.
- Cache do React Query já existe, mas várias telas refazem as mesmas consultas com chaves diferentes — unificar as chaves elimina requisições repetidas.

## 3. Limpeza de código

- Existem **13 arquivos `.js` soltos na raiz** (`auth.js`, `clients.js`, `financial.js`, `schedule.js`, `stock.js`, `ui.js`, etc.) que são resquício da versão antiga e não fazem parte do app React. Confundem manutenção e devem ser removidos ou arquivados.
- **42 arquivos com `console.log`** ativos em produção — trocar por log condicional (`debugLog`).
- Uso frequente de `any` nas telas maiores (Financeiro, Agenda, Relatórios), o que esconde erros que só aparecem em runtime.

## 4. Qualidade e confiabilidade

- Só existe **1 arquivo de teste** (`example.test.ts`). Vale cobrir com testes as regras críticas: cálculo financeiro mensal, percentis dos testes neuro, permissões por papel e geração de PDF.
- Não há tela de erro amigável global (error boundary) — hoje um erro de render pode deixar a tela em branco.

## 5. Experiência do usuário

- Padronizar estados de carregamento com *skeletons* (hoje varia entre spinner, texto e tela vazia).
- Mensagens de erro do Supabase às vezes aparecem cruas para o usuário; traduzir para linguagem clara.
- Acessibilidade: rótulos em ícones-botão e foco visível em formulários longos.

## Ordem sugerida de execução

1. Segurança do banco (revogar EXECUTE, ativar proteção de senha, upgrade do Postgres).
2. Limpeza dos `.js` legados e dos `console.log`.
3. Quebra dos 5 arquivos maiores + carregamento sob demanda das abas pesadas.
4. Virtualização das listas longas.
5. Error boundary global e padronização de loading/erros.
6. Testes das regras críticas.

Diga qual bloco você quer que eu faça primeiro (ou "todos") que eu monto o plano detalhado de execução.
