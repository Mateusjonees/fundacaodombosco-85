

## Problema Identificado

O sistema de alerta "escandaloso" para o profissional tem dois problemas:

1. **Notificação não chega instantaneamente**: O listener Realtime do Supabase (`postgres_changes`) pode ter latência ou não estar configurado corretamente. Além disso, o canal usa o nome `patient-arrivals-global` mas filtra por `employee_id` do usuário logado -- se o profissional não estiver com o sistema aberto ou o Realtime não estiver habilitado na tabela `schedules`, nada acontece.

2. **Volume do áudio não está no máximo**: O volume do alarme está configurado em `0.5-0.6` (50-60%) ao invés de `1.0` (100%).

## Plano de Correção

### 1. Aumentar volume do áudio para o máximo
- Alterar todos os valores de `volume` no `playAlarmSound()` de `0.5/0.6` para `1.0`
- Aumentar duração da sirene (mais ciclos, de 3 para 5)
- Tornar os tons mais agressivos e longos

### 2. Garantir entrega instantânea com fallback duplo
- Manter o listener Realtime em `schedules` (via `postgres_changes`)
- **Adicionar** um segundo listener na tabela `internal_messages` (que já recebe insert quando a presença é confirmada) como fallback -- se o Realtime de `schedules` falhar, o de `internal_messages` pega
- Isso cria redundância: dois canais independentes monitorando o mesmo evento

### 3. Repetir o alarme se não for dispensado
- Se o profissional não clicar para fechar, repetir o som de alarme a cada 5 segundos por até 30 segundos (ao invés de tocar uma vez só)
- Aumentar o timeout do fullscreen alert de 15s para 30s

### Arquivos Alterados
- `src/components/PatientArrivedNotification.tsx` -- volume máximo, repetição do alarme, listener duplo (schedules + internal_messages)

