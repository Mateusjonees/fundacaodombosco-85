## Objetivo

1. Permitir finalizar o atendimento **sem preencher o campo "Evolução"** quando o profissional já adicionou um Registro de Prontuário na mesma sessão.
2. No **Histórico do Prontuário**, mostrar **todos os campos preenchidos separadamente** (sinais vitais, sintomas, evolução, plano terapêutico, medicações, próxima sessão, duração), em vez de juntar tudo em um bloco único.

---

## 1. Finalizar atendimento sem evolução obrigatória

**Arquivo:** `src/components/CompleteAttendanceDialog.tsx`

- O estado `evolutionHistory` já carrega os `medical_records` do paciente (`session_date, session_type, progress_notes, employee_id`).
- Criar um `hasMedicalRecordToday` (boolean): `true` se existir pelo menos 1 registro em `medical_records` para o `client_id` atual, criado pelo `user.id`, com `session_date` igual à data do agendamento (comparação `YYYY-MM-DD` em UTC-3).
- No `handleComplete` (linha ~626), trocar a validação:
  ```ts
  if (!sessionNotes.trim() && !hasMedicalRecordToday) {
    toast({ ... "Preencha a evolução ou adicione um registro de prontuário." });
    return;
  }
  ```
- No JSX do campo "Evolução do atendimento" (label perto da linha 2080):
  - Remover o asterisco "*" quando `hasMedicalRecordToday` for `true`.
  - Adicionar um hint discreto abaixo: "Prontuário já registrado nesta sessão — evolução opcional." quando aplicável.
- Se `sessionNotes` estiver vazio mas houver prontuário do dia, preencher automaticamente `session_notes` salvo no `attendance_report` com algo como `"Ver registro de prontuário do dia (Dr(a). X)"` para manter rastreabilidade no relatório.

## 2. Histórico do Prontuário: mostrar campos separadamente

**Arquivo:** `src/components/ServiceHistory.tsx`

Hoje (linhas 175-225), os medical_records são "achatados" em 3 campos genéricos (`detailed_notes`, `session_objectives`, `patient_response`), perdendo `vital_signs`, `medications`, `next_appointment_notes` e a separação entre Sintomas / Evolução / Plano.

**Mudanças:**

- Ampliar o `select` para incluir: `vital_signs, medications, next_appointment_notes`.
- Estender a interface `ServiceRecord` com campos opcionais: `vital_signs?`, `medications?`, `symptoms?`, `treatment_plan?`, `progress_notes?`, `next_appointment_notes?` (sem remover os legados, para manter compat com agendamentos / attendance_reports).
- Ao mapear o `medical_record`, popular esses novos campos individualmente em vez de só `detailed_notes`.
- No **card resumo** da lista: continuar mostrando um preview curto (evolução truncada), mas adicionar pequenos badges/ícones indicando o que foi preenchido: "Sinais vitais", "Medicações", "Plano", "Próx. sessão" (apenas chips, sem expandir).
- No **dialog de detalhes** (a partir da linha ~1245, branch `source === 'medical_record'`): renderizar seções separadas, cada uma só se preenchida:
  - **Sinais Vitais** — grid com PA, FC, Temp, SpO2, Peso, Altura (a partir de `vital_signs`).
  - **Queixa / Sintomas** — `symptoms`.
  - **Evolução / Registro da Sessão** — `progress_notes`.
  - **Conduta / Plano Terapêutico** — `treatment_plan`.
  - **Medicações Prescritas** — lista a partir de `medications[]` (`name`).
  - **Observações para Próxima Sessão** — `next_appointment_notes`.
  - **Duração** — `session_duration` min, no header.
- Replicar a mesma estrutura no **modo de edição** (`editRecord.source === 'medical_record'`, linhas ~1663-1690): mostrar/editar cada campo separadamente e salvar todos no `update` em `medical_records` (atualmente só salva `progress_notes`).

## Notas técnicas

- `vital_signs` é `jsonb` no formato `{ PA, FC, Temperatura, SpO2, Peso, Altura }` (vide `AddMedicalRecordDialog.tsx`).
- `medications` é `jsonb[]` com objetos `{ name: string }`.
- Comparação de data do dia: usar `getTodayLocalISODate` de `@/lib/utils` (regra do projeto: UTC-3 Brasília).
- Sem alterações em schema/migrations.
