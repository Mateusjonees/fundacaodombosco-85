

## Plano: Corrigir Notificações e Atualizações Instantâneas

### Problema Raiz
Múltiplos componentes criam canais Realtime separados para as mesmas tabelas (`schedules`, `appointment_notifications`), competindo por conexões. Quando um canal falha silenciosamente (sem log de erro), não há fallback — a UI só atualiza com refresh manual. Além disso, não há polling de segurança para garantir dados frescos.

### Alterações

#### 1. `src/pages/Schedule.tsx` — Forçar invalidação + polling de segurança

- Trocar `refetchSchedules()` por `queryClient.invalidateQueries({ queryKey: ['schedules'] })` no handler Realtime, garantindo que React Query busque dados frescos
- Adicionar polling de 15 segundos como fallback (`refetchInterval: 15000`) no `useSchedules` para quando Realtime falhar silenciosamente
- Remover dependência de `refetchSchedules` no useEffect do Realtime (usar `queryClient` diretamente, que é estável)

#### 2. `src/hooks/useSchedules.ts` — Reduzir staleTime

- Reduzir `staleTime` de 30000 para 5000ms para que invalidações resultem em refetch real
- Adicionar `refetchInterval` opcional (15s) para polling de segurança

#### 3. `src/components/PatientArrivedNotification.tsx` — Polling fallback + logs

- Adicionar polling de 10 segundos que consulta `appointment_notifications` não lidas com `notification_type = 'patient_arrived'` e `is_read = false`
- Se encontrar notificação nova que não foi alertada, disparar o alerta
- Manter Realtime como canal primário, polling como redundância
- Adicionar logs mais claros no subscribe para diagnóstico

#### 4. `src/components/NotificationBell.tsx` — Polling fallback

- Adicionar `refetchInterval: 30000` na query de notificações para garantir dados frescos mesmo sem Realtime

### Resultado Esperado
- Agenda atualiza instantaneamente via Realtime, com polling de 15s como backup
- Notificações de presença chegam via Realtime + polling de 10s como backup
- Se Realtime falhar, o sistema continua funcionando via polling
- Pop-up de paciente aparece mesmo se o canal Realtime estiver desconectado

