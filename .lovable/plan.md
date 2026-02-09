

# Renomear Assistente de "Bosco IA" para "Bia IA"

## Resumo

Alterar o nome do assistente virtual de "Bosco IA" para "Bia IA" em todos os pontos do sistema: interface do chat, system prompt da Edge Function e tooltips.

## Alteracoes

### 1. Edge Function (`supabase/functions/ai-assistant/index.ts`)
- Alterar o system prompt de "Voce e o Bosco IA" para "Voce e a Bia IA"
- Ajustar pronomes relacionados (de "o assistente" para "a assistente")

### 2. Componente do Chat (`src/components/AIAssistant.tsx`)
- Alterar todos os `alt="Bosco IA"` para `alt="Bia IA"`
- Alterar o titulo do Sheet de "Bosco IA" para "Bia IA"
- Alterar a mensagem de boas-vindas de "Sou o Bosco IA" para "Sou a Bia IA"

### 3. Header (`src/components/MainApp.tsx`)
- Alterar `title="Bosco IA"` para `title="Bia IA"`
- Alterar `alt="Bosco IA"` para `alt="Bia IA"`

### Observacao
O icone visual (`bosco-ia-icon.png`) sera mantido, apenas o nome textual muda. Se desejar trocar o icone tambem, basta enviar uma nova imagem.

