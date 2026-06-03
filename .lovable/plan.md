## Objetivo

Permitir que o **Diretor** atue sobre agendamentos já **Concluídos** (ou cancelados), corrigindo erros do profissional. Hoje, quando o card está com status `completed`, nenhuma ação aparece além de "Editar".

## O que será adicionado

No `ScheduleCard.tsx`, quando `isAdmin` (diretor) e `status === 'completed'` ou `'cancelled'` ou `'pending_validation'`, exibir um menu **"Reverter"** (ícone RotateCcw) com 3 opções:

1. **Reabrir atendimento** — volta o status para `scheduled`, apaga o `attendance_report` vinculado (`schedule_id`) e o `medical_record` do dia criado por este atendimento. O profissional pode refazer.
2. **Marcar como falta** — muda status para `cancelled` com motivo "Paciente faltou" e remove o `attendance_report` vinculado.
3. **Excluir agendamento** — usa o `DeleteAppointmentDialog` já existente (remoção em cascata).

Cada opção abre um `AlertDialog` de confirmação explicando o impacto (ex.: "Isso apagará a evolução registrada por X").

## Detalhes técnicos

- Restrição: apenas `userProfile?.employee_role === 'director'`.
- Reabrir:
  - `update schedules set status='scheduled', patient_arrived=false, arrived_at=null where id=?`
  - `delete from attendance_reports where schedule_id=?`
  - `delete from medical_records where client_id=? and session_date=<data do schedule> and employee_id=<profissional do schedule>` (somente o registro daquela sessão; confirmar com o usuário se quer apagar prontuário também — ver pergunta abaixo).
- Falta: `update schedules set status='cancelled', notes = coalesce(notes,'') || ' [Revertido pelo diretor: paciente faltou]'` + delete em `attendance_reports`.
- Registrar auditoria via `auditService` (já existe) com ação `revert_attendance`.
- Invalidar queries: `['schedules']`, `['attendance-reports']`, `['medical-records']`.

## Onde mexer

- `src/components/ScheduleCard.tsx` — novo bloco de botões para diretor em status finalizados.
- `src/components/RevertAttendanceDialog.tsx` (novo) — modal com as 3 opções.
- `src/pages/Schedule.tsx` — handler `onRevert` ligando o diálogo.

## Pergunta pendente

Antes de implementar: ao "Reabrir atendimento", devo **também apagar o registro de prontuário** (medical_record) daquela sessão, ou manter o prontuário e apenas reverter o agendamento + apagar o `attendance_report`?
