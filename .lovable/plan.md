
# Envio Automatico de Lembrete por E-mail 24h Antes do Atendimento

## Resumo

Criar uma Edge Function que roda automaticamente a cada hora via `pg_cron`, busca agendamentos das proximas 24 horas que ainda nao receberam lembrete, e envia e-mails de lembrete reutilizando o template ja existente do `send-appointment-email`.

## Arquitetura

1. **Nova Edge Function `send-appointment-reminders`** -- busca agendamentos com `start_time` entre agora e 24h no futuro, cujo `email_sent_at` seja nulo e status seja `scheduled`, junta com dados do cliente (nome, email) e do profissional, e chama o Resend para enviar o lembrete.

2. **Nova coluna `reminder_sent_at`** na tabela `schedules` -- para diferenciar o lembrete automatico do envio manual ja existente (`email_sent_at`). Isso evita conflitos: o email manual continua funcionando normalmente, e o cron so envia se `reminder_sent_at` for nulo.

3. **Cron Job via `pg_cron` + `pg_net`** -- executa a cada hora, chamando a Edge Function via HTTP POST.

## Detalhes Tecnicos

### 1. Migracao SQL

- Adicionar coluna `reminder_sent_at TIMESTAMPTZ` na tabela `schedules`.
- Habilitar extensoes `pg_cron` e `pg_net` (se ainda nao estiverem ativas).
- Criar o cron job que roda a cada hora:

```text
cron.schedule('send-reminders-hourly', '0 * * * *', ...)
```

O job faz um `net.http_post` para a URL da Edge Function com o header de autorizacao (anon key).

### 2. Edge Function `send-appointment-reminders`

- Consulta `schedules` com:
  - `start_time` entre `NOW()` e `NOW() + 24 horas`
  - `reminder_sent_at IS NULL`
  - `status = 'scheduled'`
- Join com `clients` (nome, email) e `profiles` (nome do profissional)
- Filtra apenas clientes que possuem email cadastrado
- Para cada agendamento encontrado, envia o email usando o Resend (mesmo template visual do `send-appointment-email`)
- Atualiza `reminder_sent_at` com o timestamp apos envio bem-sucedido
- Retorna um resumo (quantos enviados, quantos falharam)

### 3. Template do E-mail

Reutiliza o mesmo HTML do `send-appointment-email` existente (logo, cores por unidade, detalhes do agendamento), apenas com o assunto ajustado para "Lembrete: Seu atendimento e amanha".

### 4. Configuracao

- Adicionar `[functions.send-appointment-reminders]` com `verify_jwt = false` no `config.toml`
- A funcao usa as mesmas secrets existentes: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`

## Sequencia de Implementacao

1. Criar migracao SQL adicionando a coluna `reminder_sent_at`
2. Criar a Edge Function `send-appointment-reminders/index.ts`
3. Atualizar `supabase/config.toml`
4. Atualizar tipos TypeScript (`types.ts` sera regenerado automaticamente)
5. Deploy da funcao e teste
6. Criar o cron job via SQL (executado separadamente pois contem dados do projeto)
