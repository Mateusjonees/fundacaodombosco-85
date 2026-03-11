

## Notificação Push Nativa (Pop-up do Sistema Operacional)

Sim, é possível! O navegador suporta **Notifications API** que exibe pop-ups nativos do sistema operacional, visíveis mesmo quando o usuário está no Word ou qualquer outro programa.

### O que já existe
- O hook `usePushNotifications` já usa `new Notification()` e já é chamado no `triggerMaxAlert`
- **Problema**: a notificação só é enviada se `document.hidden` (aba em background). Se a aba estiver ativa mas o usuário estiver em outro programa (Word), `document.hidden` pode ser `true` ou `false` dependendo do estado da aba

### Correções necessárias

**1. Remover a restrição `document.hidden`** no `usePushNotifications.ts`
- A push notification nativa deve ser enviada **sempre**, independente do foco. É ela que aparece como pop-up do Windows/Mac mesmo com o Word aberto.

**2. Solicitar permissão automaticamente** 
- No `PatientArrivedNotification`, chamar `requestPermission()` ao montar o componente, para garantir que o browser tem permissão de exibir notificações nativas

**3. Adicionar `requireInteraction: true`** (já está) para que a notificação não desapareça sozinha

### Arquivos alterados
- `src/hooks/usePushNotifications.ts` — remover condição `document.hidden`
- `src/components/PatientArrivedNotification.tsx` — solicitar permissão ao montar

### Limitação importante
O pop-up nativo funciona **somente se o usuário permitiu notificações no navegador**. A primeira vez que abrir o sistema, aparecerá o pedido de permissão do browser. Após aceitar, as notificações aparecerão sobre qualquer programa.

