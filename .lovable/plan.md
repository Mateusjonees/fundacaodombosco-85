

# Assistente IA Integrado ao Sistema - Fundacao Dom Bosco

## Resumo

Adicionar um botao com o icone do Gemini no topo da sidebar que abre um chat com IA. O assistente ajuda os funcionarios a realizar tarefas no sistema (agendar, buscar pacientes, criar atendimentos, etc.), respeitando as permissoes de cada cargo.

## Como Funciona

1. O usuario clica no icone do Gemini no topo da sidebar
2. Abre um painel lateral (drawer) com um chat
3. O usuario digita o que precisa (ex: "agende o paciente Joao para amanha as 14h")
4. A IA responde com informacoes e executa acoes conforme as permissoes do cargo do usuario
5. As respostas aparecem em tempo real (streaming)

## Controle de Acesso por Cargo

A IA so pode acessar dados e executar acoes que o cargo do usuario permite:

- **Recepcionista**: agendar, buscar pacientes, confirmar presenca, ver agenda
- **Profissional (Psicologo, etc.)**: ver seus pacientes, consultar prontuarios, agendar
- **Coordenador**: tudo do profissional + ver equipe, relatorios da unidade
- **Diretoria**: acesso total a todas as funcionalidades
- **Financeiro**: consultar e criar lancamentos financeiros

## Custo Estimado

Com $5/mes no Lovable AI usando o modelo gemini-3-flash-preview:
- Centenas a milhares de requisicoes por mes
- Suficiente para uso diario de uma clinica de pequeno/medio porte
- Se precisar de mais, basta adicionar creditos no workspace

## Detalhes Tecnicos

### 1. Edge Function: `supabase/functions/ai-assistant/index.ts`

- Recebe mensagens do usuario + cargo + permissoes
- Envia para o Lovable AI Gateway com system prompt personalizado por cargo
- O system prompt inclui as permissoes do cargo para que a IA saiba o que pode ou nao fazer
- Retorna resposta em streaming (SSE)
- Trata erros 429 (rate limit) e 402 (creditos esgotados)

### 2. Componente: `src/components/AIAssistant.tsx`

- Drawer/Sheet lateral com interface de chat
- Renderiza mensagens com suporte a markdown (react-markdown ja esta disponivel via dependencias)
- Input para digitar mensagens
- Streaming token-by-token para resposta em tempo real
- Mostra indicador de "digitando" enquanto a IA responde

### 3. Botao na Sidebar: `src/components/layout/AppSidebar.tsx`

- Adicionar icone do Gemini (usando Sparkles do lucide-react que ja esta importado) no header da sidebar
- Ao clicar, abre o AIAssistant como um Sheet lateral
- Visivel para todos os cargos

### 4. Hook: `src/hooks/useAIAssistant.ts`

- Gerencia estado das mensagens e streaming
- Envia cargo e permissoes do usuario junto com cada requisicao
- Controla loading, erros, e historico de conversa

### 5. System Prompt (no Edge Function)

O prompt do sistema sera construido dinamicamente com base no cargo:
- Lista as acoes permitidas para o cargo
- Instrui a IA a recusar acoes fora das permissoes
- Inclui contexto sobre o sistema (clinica neuropsicologica, unidades Madre/Floresta)
- Responde sempre em portugues brasileiro

### 6. Configuracao

- Atualizar `supabase/config.toml` para incluir a nova funcao
- Usar `LOVABLE_API_KEY` (ja disponivel automaticamente)
- Modelo: `google/gemini-3-flash-preview`

