# Unificar Prontuário e Evolutiva no fluxo da Agenda + Paciente

## Contexto

Hoje existem dois fluxos paralelos que confundem os profissionais:

- **Agenda → Finalizar Atendimento** (`CompleteAttendanceDialog`): grava em `attendance_reports` o campo "Evolução do Atendimento".
- **Prontuário** (`/prontuarios`): grava em `medical_records` separadamente. Profissionais estavam escrevendo lá manualmente.
- **Ficha do paciente → aba "Atendimentos"** (`ServiceHistory`): já junta `medical_records` + `attendance_reports`, mas a aba se chama "Atendimentos", o que esconde a função clínica.

O objetivo é unificar: ao finalizar pela agenda, a evolutiva já vira **prontuário oficial**, e na ficha do paciente o histórico fica em uma única aba chamada **Evolutiva**.

## O que muda

### 1. `src/components/CompleteAttendanceDialog.tsx`
- Renomear o label do textarea atual `Evolução do Atendimento` para **`Prontuário / Evolutiva Clínica`** (mantém o mesmo state `sessionNotes`, mantém obrigatório).
- Atualizar o `placeholder` para reforçar que é o registro clínico oficial.
- Dentro do `handleComplete`, **após** o `insert` em `attendance_reports`, fazer um `insert` adicional em `public.medical_records` com:
  - `client_id`, `employee_id` do schedule
  - `session_date` = data do schedule
  - `session_type` = `attendanceType` (Consulta / Consulta Nutricional)
  - `session_duration` = `durationMinutes`
  - `progress_notes` = `sessionNotes`
  - `attachments` = `attachmentsData`
  - `status` = `'completed'`
- Erro do insert em `medical_records` não pode bloquear a finalização (try/catch isolado com toast informativo) — `attendance_reports` continua sendo a fonte de verdade do agendamento.

### 2. `src/components/ClientDetailsView.tsx` (aba do paciente)
- Trocar o label da `TabsTrigger value="history"`:
  - `Atendimentos` → `Evolutiva`
  - `Atend.` (mobile) → `Evol.`
- Nenhuma mudança no `ServiceHistory` em si — ele já busca de `medical_records`, `attendance_reports`, `schedules` e `employee_reports`, então passará a mostrar a entrada criada no passo 1 automaticamente, ao lado das anteriores (anamnese continua na própria aba "Anamnese", e a evolutiva agrega tudo do histórico clínico).

### 3. `src/pages/MedicalRecords.tsx` (opcional, leve)
- Sem mudança estrutural — os prontuários criados pela agenda passarão a aparecer aqui também, pois vão para a mesma tabela `medical_records`.

## O que NÃO muda

- Schema do banco (tabelas, RLS, grants já permitem o insert pelo profissional autenticado).
- Componentes neuro, anamnese, materiais, validação financeira.
- Aba "Anamnese", "Receita", "Laudos", "Financeiro" da ficha do paciente.
- Hooks `useMedicalRecords`, `useCreateMedicalRecord` (continuam sendo usados pela página Prontuário).

## Risco

- Duplicação de registro: o mesmo atendimento aparece em `attendance_reports` (fluxo financeiro/agenda) e em `medical_records` (fluxo clínico). Isso é intencional — `ServiceHistory` já tem deduplicação por `schedule_id`, então na visualização não vai duplicar.

## Ordem de execução

1. Editar `CompleteAttendanceDialog.tsx` (label + insert em `medical_records`).
2. Editar `ClientDetailsView.tsx` (renomear aba).
3. Smoke check: finalizar um atendimento de teste e verificar se aparece tanto em `/prontuarios` quanto na aba "Evolutiva" do paciente.
