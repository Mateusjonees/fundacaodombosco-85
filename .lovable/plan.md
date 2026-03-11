

## Remover sirene repetitiva a cada 5 segundos

Mudança simples em `src/components/PatientArrivedNotification.tsx`:

- Remover o `setInterval` que repete `playAlarmSound()` + `vibrateDevice()` a cada 5s (linhas 130-134)
- Remover a referência `stopRepeatingAlarm` e o timeout de 30s que para o intervalo
- Manter apenas **um único toque** de alarme + vibração no momento da chegada
- Manter todo o resto: fullscreen alert, push nativa, piscar aba

