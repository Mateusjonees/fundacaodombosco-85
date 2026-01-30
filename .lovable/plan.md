
# Plano: Confirmação de Presença por E-mail com Opção de Recusa

## Resumo
Adicionar dois botões no e-mail de confirmação: um para confirmar presença e outro para informar que não poderá comparecer. A resposta será registrada automaticamente no sistema sem que o paciente precise sair do e-mail ou acessar qualquer sistema.

## O que será implementado

### 1. Novo Campo no Banco de Dados
Adicionar coluna na tabela `schedules`:
- `patient_declined` (boolean) - indica se o paciente informou que não poderá comparecer
- `patient_declined_at` (timestamp) - quando informou

### 2. Modificar o E-mail de Confirmação
O e-mail terá dois botões:
- **"Confirmo minha presença"** (verde) - mantém o comportamento atual
- **"Não poderei comparecer"** (vermelho) - novo botão para recusar

Ambos os botões funcionarão com um único clique, abrindo uma página simples de confirmação.

### 3. Atualizar a Edge Function `confirm-appointment`
Modificar para aceitar um parâmetro `action` (confirm/decline):
- `?token=XXX&action=confirm` - confirma presença
- `?token=XXX&action=decline` - informa recusa

A página de resposta mostrará:
- Confirmação: "Obrigado! Sua presença foi confirmada."
- Recusa: "Obrigado por nos avisar. Entraremos em contato para reagendar."

### 4. Exibição na Agenda (ScheduleCard)
Adicionar indicadores visuais:
- Se confirmou: Badge azul "Confirmou que irá" (já existe)
- Se recusou: Badge vermelho/laranja "Não poderá comparecer - entrar em contato"

A observação também aparecerá no campo de notas do agendamento automaticamente.

## Fluxo Visual

```text
┌─────────────────────────────────────────┐
│           E-MAIL DO PACIENTE            │
├─────────────────────────────────────────┤
│  📅 Novo Agendamento                    │
│  Data: 30/01/2026  Hora: 10:52          │
│  Profissional: Dev                      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ✅ Confirmo minha presença     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ❌ Não poderei comparecer      │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
          │                    │
          ▼                    ▼
    ┌──────────┐         ┌──────────┐
    │ CONFIRMA │         │ RECUSA   │
    └──────────┘         └──────────┘
          │                    │
          ▼                    ▼
 patient_confirmed=true   patient_declined=true
 Badge azul na agenda     Badge vermelho na agenda
                          + Obs: "Entrar em contato"
```

## Detalhes Técnicos

### Migração SQL
```sql
ALTER TABLE schedules 
ADD COLUMN patient_declined boolean DEFAULT false,
ADD COLUMN patient_declined_at timestamptz;
```

### Arquivos a Modificar
1. `supabase/functions/send-appointment-email/index.ts` - Adicionar segundo botão
2. `supabase/functions/confirm-appointment/index.ts` - Processar ação de recusa
3. `src/components/ScheduleCard.tsx` - Exibir badge de recusa
4. `src/hooks/useSchedules.ts` - Incluir novos campos no select

### Comportamento do Botão no E-mail
Os botões são links HTML simples que abrem uma página de confirmação visual. O paciente:
1. Clica no botão
2. Vê uma página bonita confirmando sua ação
3. Pode fechar a página e voltar ao e-mail

Não há necessidade de login ou acesso ao sistema.
