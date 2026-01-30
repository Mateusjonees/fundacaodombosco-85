

# Plano: Sistema de Confirmação de Agendamento por E-mail

## Resumo

Adicionar ao formulário de novo agendamento uma opção **não obrigatória** para enviar e-mail de confirmação ao paciente. O e-mail conterá um botão de confirmação que, ao ser clicado, atualizará o status do agendamento para "Confirmado pelo Paciente" diretamente na agenda.

---

## Fluxo do Usuário

```text
+-------------------+     +----------------------+     +------------------+
| Novo Agendamento  | --> | E-mail com detalhes  | --> | Paciente clica   |
| [ ] Enviar e-mail |     | + botão "Confirmar"  |     | "Confirmo"       |
+-------------------+     +----------------------+     +------------------+
                                                              |
                                                              v
                                                    +--------------------+
                                                    | Agenda atualizada: |
                                                    | "Paciente Confirmou|
                                                    | que irá"           |
                                                    +--------------------+
```

---

## Alterações Necessárias

### 1. Atualizar Tabela `schedules` no Banco de Dados

Adicionar novas colunas para rastrear a confirmação do paciente:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `confirmation_token` | `text` | Token único para link de confirmação |
| `patient_confirmed` | `boolean` | Se o paciente confirmou presença |
| `patient_confirmed_at` | `timestamp` | Data/hora da confirmação |
| `email_sent_at` | `timestamp` | Quando o e-mail foi enviado |

### 2. Atualizar Formulário de Agendamento (Schedule.tsx)

- Adicionar campo Switch/Checkbox: **"Enviar confirmação por e-mail"**
- O campo só aparece quando paciente tem e-mail cadastrado
- Mostrar aviso amigável se paciente não tiver e-mail

**Nova estrutura do state:**
```text
newAppointment: {
  ...campos existentes,
  sendConfirmationEmail: false  // novo campo
}
```

### 3. Nova Edge Function: `confirm-appointment`

Responsável por processar a confirmação do paciente via link.

**Endpoint:** `GET /confirm-appointment?token=XXXX`

**Ações:**
1. Validar token
2. Atualizar agendamento: `patient_confirmed = true`
3. Retornar página HTML de sucesso

### 4. Atualizar Edge Function: `send-appointment-email`

Modificar para incluir:
- Suporte a múltiplas sessões no e-mail
- Botão de confirmação com link único
- Gerar e salvar token de confirmação

**Novo template de e-mail:**
- Detalhes de todas as sessões agendadas
- Botão verde: "Confirmo minha presença"
- Design responsivo para celular

### 5. Atualização Visual na Agenda

Quando `patient_confirmed = true`:
- Badge especial: "Paciente Confirmou"
- Ícone diferenciado no card do agendamento
- Cor verde indicando confirmação

---

## Detalhes Técnicos

### Migração SQL

```text
ALTER TABLE schedules ADD COLUMN confirmation_token text;
ALTER TABLE schedules ADD COLUMN patient_confirmed boolean DEFAULT false;
ALTER TABLE schedules ADD COLUMN patient_confirmed_at timestamptz;
ALTER TABLE schedules ADD COLUMN email_sent_at timestamptz;
CREATE INDEX idx_schedules_confirmation_token ON schedules(confirmation_token);
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Schedule.tsx` | Adicionar checkbox de envio de e-mail, lógica de envio |
| `src/components/ScheduleCard.tsx` | Mostrar badge "Paciente Confirmou" |
| `supabase/functions/send-appointment-email/index.ts` | Gerar token, incluir link de confirmação |
| `supabase/functions/confirm-appointment/index.ts` | **Novo arquivo** - processar confirmação |
| `src/integrations/supabase/types.ts` | Atualizar tipos da tabela schedules |

### Fluxo de Confirmação

1. **Criação do Agendamento:**
   - Se checkbox marcado, gerar UUID como `confirmation_token`
   - Chamar edge function de e-mail com token
   - Salvar `email_sent_at`

2. **E-mail enviado:**
   - Link: `https://fundacaodombosco-85.lovable.app/confirm?token=XXXX`
   - Redireciona para edge function

3. **Página de Confirmação:**
   - HTML simples e bonito
   - Mensagem: "Obrigado! Sua presença foi confirmada"
   - Atualiza banco automaticamente

---

## Interface no Formulário

Nova seção após "Observações":

```text
┌──────────────────────────────────────────────────┐
│ 📧 Notificação por E-mail                        │
├──────────────────────────────────────────────────┤
│                                                   │
│  [ ] Enviar e-mail de confirmação ao paciente    │
│                                                   │
│  ℹ️ O paciente receberá um e-mail com os dados   │
│     do agendamento e poderá confirmar presença.  │
│                                                   │
└──────────────────────────────────────────────────┘
```

Se o paciente não tiver e-mail cadastrado:

```text
┌──────────────────────────────────────────────────┐
│ ⚠️ Paciente não possui e-mail cadastrado.        │
│    Não será possível enviar confirmação.         │
└──────────────────────────────────────────────────┘
```

---

## Considerações

- **Não obrigatório:** O checkbox vem desmarcado por padrão
- **Validação:** Só habilita se paciente tiver e-mail válido
- **Múltiplas sessões:** E-mail lista todas as sessões criadas
- **Segurança:** Token único por agendamento, expira após uso
- **Performance:** Envio de e-mail é assíncrono, não bloqueia criação

---

## Estimativa de Trabalho

1. Migração do banco de dados
2. Nova edge function de confirmação
3. Atualizar edge function de e-mail
4. Modificar formulário de agendamento
5. Atualizar visual do ScheduleCard
6. Testes end-to-end

