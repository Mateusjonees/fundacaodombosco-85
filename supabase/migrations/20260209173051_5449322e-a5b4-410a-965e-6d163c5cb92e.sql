
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Agendar envio automático de e-mails de aniversário todo dia às 8h (Brasília = 11h UTC)
SELECT cron.schedule(
  'send-birthday-emails-daily',
  '0 11 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://vqphtzkdhfzdwbumexhe.supabase.co/functions/v1/send-birthday-emails-cron',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcGh0emtkaGZ6ZHdidW1leGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDIzODMsImV4cCI6MjA3MjkxODM4M30.Xa1UC2WmCaD9MMBvO_6kcXpsnTZRk5vpbxo_Gs2a2g4"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
