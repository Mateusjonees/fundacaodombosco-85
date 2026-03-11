

## Plano: Demanda no Agendamento (Atendimento Floresta) + Valores Financeiros para Coordenadores

### Resumo

Duas funcionalidades exclusivas para a unidade **Atendimento Floresta**:

1. **Tipo de Demanda no Agendamento**: Ao agendar para "Atendimento Floresta", o coordenador seleciona a demanda (Demanda Própria, SUS, Demanda Externa, Laudo). Esse valor é salvo no agendamento e propagado automaticamente para receituário, anamnese e laudo, evitando que o profissional precise escolher manualmente.

2. **Valores financeiros no agendamento**: Coordenadores podem definir o valor do profissional e o valor da fundação ao criar o agendamento. Esses campos são visíveis **apenas para coordenadores e diretores** — profissionais nunca veem esses valores.

---

### Detalhes Técnicos

#### 1. Migração SQL — Novas colunas na tabela `schedules`

```sql
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS service_type text DEFAULT NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS professional_amount numeric DEFAULT NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS foundation_amount numeric DEFAULT NULL;
```

Sem alteração de RLS — a visibilidade dos campos financeiros será controlada exclusivamente no frontend.

#### 2. CreateScheduleDialog.tsx — Campos condicionais

- Quando `form.unit === 'atendimento_floresta'`:
  - Exibir Select "Tipo de Demanda" com opções de `SERVICE_TYPE_OPTIONS` (do `serviceTypes.ts`)
  - Se o usuário for coordenador/diretor, exibir dois campos numéricos: "Valor do Profissional (R$)" e "Valor da Fundação (R$)"
- Salvar `service_type`, `professional_amount` e `foundation_amount` no insert/update do schedule
- Profissionais (não coordenadores/diretores) NÃO veem os campos de valor

#### 3. Propagação do service_type para componentes

- **AddPrescriptionDialog**: Se o paciente tem um agendamento com `service_type`, pré-selecionar esse valor e opcionalmente travar a seleção
- **AddAnamnesisDialog**: Idem — propagar o `service_type` do schedule
- **ClientLaudoManager**: Adicionar suporte a `service_type` (atualmente não possui)
- O `service_type` do agendamento será passado via props ou buscado do schedule associado

#### 4. CompleteAttendanceDialog — Uso dos valores financeiros

- Ao finalizar atendimento de "Atendimento Floresta", usar `professional_amount` e `foundation_amount` do schedule na auto-validação (já existente para essa unidade)
- Os valores do schedule alimentam a RPC `validate_attendance_report`

#### 5. Controle de visibilidade

- Campos financeiros (`professional_amount`, `foundation_amount`) renderizados **apenas** quando:
  - `isAdmin === true` OU
  - `userProfile?.employee_role` é um dos coordenadores ou diretor
- Na agenda e listagens, os valores financeiros nunca são exibidos para profissionais comuns

