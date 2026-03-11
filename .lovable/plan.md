

## Plano: Realtime Instantâneo na Agenda (Sem Precisar Atualizar)

### Problema
A página da Agenda (`Schedule.tsx`) não tem subscription Realtime própria no Supabase. Ela depende apenas de um evento customizado (`refresh-schedule`) disparado pelo `PatientArrivedNotification`. Se o canal Realtime desse componente falhar (como visto nos logs: `CHANNEL_ERROR`), o profissional não recebe nada em tempo real — nem novos agendamentos, nem confirmações de presença.

### Solução
Adicionar uma subscription Realtime diretamente na página `Schedule.tsx` que escute mudanças na tabela `schedules` e dispare `refetchSchedules()` automaticamente.

### Alterações

**1. `src/pages/Schedule.tsx`** — Adicionar Realtime subscription

Adicionar um novo `useEffect` com subscription Supabase Realtime na tabela `schedules`:
- Escutar eventos `INSERT`, `UPDATE` e `DELETE`
- Para profissionais: filtrar por `employee_id=eq.{user.id}`
- Para admins/coordenadores: escutar todos os eventos (sem filtro)
- Em qualquer mudança, chamar `refetchSchedules()`
- Manter o listener existente de `refresh-schedule` como redundância

```typescript
useEffect(() => {
  if (!user || !userProfile) return;
  
  const filter = isAdmin ? undefined : `employee_id=eq.${user.id}`;
  
  const channel = supabase
    .channel('schedule-realtime-sync')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'schedules',
      ...(filter ? { filter } : {})
    }, () => {
      console.log('[Schedule] Realtime change detected, refetching...');
      refetchSchedules();
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [user?.id, userProfile, isAdmin, refetchSchedules]);
```

**2. `src/components/PatientArrivedNotification.tsx`** — Melhorar resiliência

- Adicionar reconexão automática se o canal entrar em `CHANNEL_ERROR`
- Manter os dois canais existentes como redundância

Isso garante que qualquer mudança (novo agendamento, presença confirmada, cancelamento) aparece instantaneamente sem recarregar a página.

