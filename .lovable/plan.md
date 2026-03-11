

## Diagnóstico: Por que o alerta não está funcionando

**Problema principal encontrado**: A tabela `appointment_notifications` **NÃO está habilitada no Supabase Realtime**. Apenas estas tabelas estão na publicação Realtime: `schedules`, `internal_messages`, `meeting_alerts`, `channels`, `channel_members`, `user_presence`.

O Canal 2 (listener em `appointment_notifications`) simplesmente não recebe eventos. O Canal 1 (listener em `schedules`) deveria funcionar pois `schedules` está habilitada, mas pode estar falhando silenciosamente por problemas de RLS no Realtime ou pelo filtro.

Além disso, o `.subscribe()` não tem callback de status — erros de conexão são ignorados silenciosamente.

## Plano de Correção

### 1. Adicionar `appointment_notifications` à publicação Realtime
Migration SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE appointment_notifications;
```

### 2. Melhorar o subscribe com logs de debug
Adicionar callback no `.subscribe()` dos dois canais para logar status (`SUBSCRIBED`, `CHANNEL_ERROR`, etc.), facilitando diagnóstico futuro.

### 3. Adicionar subscribe com status logging
```typescript
.subscribe((status) => {
  console.log('[PatientArrived] Channel schedules status:', status);
});
```

### 4. Forçar refetch da agenda ao receber evento
Quando o profissional recebe o alerta, a agenda deve atualizar automaticamente. Atualmente o componente dispara o alerta visual mas não notifica a página de Schedule para recarregar. Solução: usar um evento customizado (`window.dispatchEvent`) que a página Schedule escuta para fazer `refetch`.

### Arquivos a modificar
- **Migration SQL**: Habilitar Realtime na tabela `appointment_notifications`
- **`src/components/PatientArrivedNotification.tsx`**: Adicionar logs no subscribe, disparar evento customizado para refetch da agenda
- **`src/pages/Schedule.tsx`**: Escutar evento customizado para refetch automático dos agendamentos

