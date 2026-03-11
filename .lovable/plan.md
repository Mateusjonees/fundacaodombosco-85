

## Análise do Alerta de Presença do Paciente

Encontrei **2 problemas** que podem impedir o funcionamento correto:

### Problema 1: Alerta só funciona na página de Agenda

O componente `PatientArrivedNotification` está montado **apenas** dentro de `Schedule.tsx`. Se o profissional estiver em qualquer outra página (Dashboard, Pacientes, etc.), ele **não recebe o alerta**.

**Solução**: Mover o componente para o `MainApp.tsx`, onde fica visível em **todas as páginas**.

### Problema 2: Replica Identity pode impedir detecção

A lógica verifica `!oldRecord?.patient_arrived && newRecord?.patient_arrived`. Porém, por padrão o PostgreSQL só envia a primary key no `payload.old` (não inclui `patient_arrived`). Isso significa que `oldRecord.patient_arrived` será `undefined`, o que tecnicamente faz a condição funcionar por acaso — mas é frágil e pode disparar alertas falsos em qualquer UPDATE na tabela schedules.

**Solução**: Habilitar `REPLICA IDENTITY FULL` na tabela `schedules` para garantir que o `old` venha completo, OU simplificar a lógica para apenas checar `newRecord.patient_arrived === true` e usar um Set para evitar duplicatas.

### Plano de Implementação

1. **Mover `PatientArrivedNotification`** de `Schedule.tsx` para `MainApp.tsx` (dentro do layout principal, antes das Routes)
2. **Tornar a detecção mais robusta**: Manter um `Set` de IDs já alertados para evitar duplicatas, e checar apenas `newRecord.patient_arrived === true`
3. **Remover** a importação/uso do componente de `Schedule.tsx`

