## Reorganização do dialog "Finalizar Atendimento"

Alterações apenas no arquivo `src/components/CompleteAttendanceDialog.tsx`. Sem mudanças em lógica de negócio — apenas UI e leitura de dados existentes.

### 1. Mover o card de Anamnese para BAIXO da Evolução
- Remover o bloco "Anamnese rápida" (linhas 1973–1996) de cima da Evolução.
- Reinserir o mesmo bloco logo APÓS o `<Textarea>` da Evolução (após linha 2010).
- Comportamento do botão "Criar/Nova anamnese" continua igual (abre `AddAnamnesisDialog`).

### 2. Adicionar barra de Histórico ACIMA da Evolução
Novo bloco acima do label "Evolução do Atendimento" com dois botões compactos lado a lado:
- **Ver histórico de evoluções** — abre um sub-dialog listando os registros de `medical_records` (ou `session_notes`/`client_notes` de tipo `evolution`, o que já existir) do paciente, ordenados do mais recente para o mais antigo: data + autor + texto.
- **Ver histórico de anamneses** — abre um sub-dialog listando os registros de `client_notes` com `note_type = 'anamnesis'` do paciente: data + autor + conteúdo.

Cada sub-dialog:
- Carrega sob demanda (somente ao abrir) via `supabase.from(...).select(...).eq('client_id', schedule.client_id).order('created_at', { ascending: false })`.
- Mostra estado de loading e mensagem "Nenhum registro encontrado" quando vazio.
- Usa `ScrollArea` com altura máxima e cards compactos (somente leitura, sem edição).
- Resolve o nome do autor consultando `profiles_public` por `user_id` (igual ao padrão usado no resto do app).

### 3. Layout final (de cima para baixo) no dialog
1. Materiais Utilizados (existente)
2. Avaliação Nutricional / Testes Neuro (existentes, quando aplicável)
3. **NOVO:** Barra "Histórico" com dois botões (Evoluções • Anamneses)
4. Evolução do Atendimento * (textarea — existente)
5. **MOVIDO:** Card "Anamnese do paciente" com botão Criar/Nova anamnese
6. Footer com Cancelar / Finalizar (existente)

### Detalhes técnicos
- Novos estados: `isEvolutionHistoryOpen`, `isAnamnesisHistoryOpen`, `evolutionHistory`, `anamnesisHistory`, `loadingHistory`.
- Dois novos sub-componentes inline (ou um único `HistoryDialog` parametrizado por tipo) usando `Dialog` do shadcn.
- Reutilizar ícones já importados (`ClipboardList`, `FileText`) + adicionar `History` do `lucide-react`.
- Nenhuma mudança em RLS, schema ou em `AddAnamnesisDialog`.

### Verificação
- Conferir no preview (`/schedule`, abrir card → "Finalizar Atendimento") que:
  - Os dois botões de histórico aparecem acima da Evolução.
  - O card de Anamnese aparece abaixo da Evolução.
  - Cada botão de histórico abre seu dialog e lista os registros existentes.
