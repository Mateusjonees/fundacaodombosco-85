

## Plano: Remover modal de permissão e manter apenas notificação nativa estilo WhatsApp

### Problema
O `NotificationPermissionBanner` exibe um diálogo modal que cobre a tela pedindo permissão de notificações. O usuário quer apenas a notificação nativa do navegador (estilo WhatsApp — aparece no canto da tela mesmo fora do app).

### O que já funciona
O `PatientArrivedNotification.tsx` já está correto: usa toast interno + `new Notification()` nativa do navegador. A notificação nativa é exatamente o comportamento "estilo WhatsApp" desejado.

### Alterações

#### 1. Remover `NotificationPermissionBanner` do App
- Em `src/App.tsx`: remover o import e o componente `<NotificationPermissionBanner />`.
- O arquivo `src/components/NotificationPermissionBanner.tsx` pode ser mantido mas não será mais usado.

#### 2. Solicitar permissão silenciosamente
- Em `PatientArrivedNotification.tsx`, já existe `Notification.requestPermission()` no `useEffect` — isso pede permissão automaticamente via popup nativo do browser (pequena barra no topo, não um modal fullscreen). Isso é suficiente.

#### 3. Manter botão manual no header (opcional)
- O `NotificationPermissionButton.tsx` (ícone de sino no header) pode continuar existindo para quem negou inicialmente — sem modal, apenas instrução via toast.

### Resultado
- Sem modal cobrindo a tela
- Permissão pedida via popup nativo do browser (discreto)
- Notificação de chegada aparece como push nativa do OS (canto da tela, mesmo com outro app aberto) + toast dentro do sistema

