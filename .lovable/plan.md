
# Plano: Adicionar Endereço Dinâmico Baseado na Unidade

## Resumo
Incluir o endereço correto no e-mail de agendamento e na página de confirmação, baseado na unidade do atendimento.

## Endereços por Unidade

| Unidade | Endereço |
|---------|----------|
| MADRE (Clínica Social) | Rua Jaime Salse, 280 - Madre Gertrudes |
| Floresta (Neuroavaliação) | Rua Urucuia, 18 - Floresta |
| Atendimento Floresta | Rua Urucuia, 18 - Floresta |

## Alterações Necessárias

### 1. Edge Function: `send-appointment-email/index.ts`
- Atualizar a função `getUnitInfo()` para incluir o endereço
- Adicionar linha de endereço no card de detalhes do e-mail

**Antes:**
```typescript
const getUnitInfo = (unit: string) => {
  switch (unit) {
    case 'madre':
      return { name: 'Clínica Social Madre Clélia', color: '#3b82f6' };
    case 'floresta':
      return { name: 'Neuroavaliação Floresta', color: '#10b981' };
    // ...
  }
};
```

**Depois:**
```typescript
const getUnitInfo = (unit: string) => {
  switch (unit) {
    case 'madre':
      return { 
        name: 'Clínica Social Madre Clélia', 
        color: '#3b82f6',
        address: 'Rua Jaime Salse, 280 - Madre Gertrudes'
      };
    case 'floresta':
      return { 
        name: 'Neuroavaliação Floresta', 
        color: '#10b981',
        address: 'Rua Urucuia, 18 - Floresta'
      };
    case 'atendimento_floresta':
      return { 
        name: 'Atendimento Floresta', 
        color: '#8b5cf6',
        address: 'Rua Urucuia, 18 - Floresta'
      };
    // ...
  }
};
```

**Nova linha no e-mail:**
```html
<tr>
  <td style="...">📍 Local:</td>
  <td style="...">${unitInfo.address}</td>
</tr>
```

### 2. Edge Function: `confirm-appointment/index.ts`
- Buscar a unidade do agendamento junto com o select
- Passar o endereço para a página de confirmação

**Alterações:**
- Incluir `unit` no select: `select("id, ..., unit, clients(name)")`
- Adicionar função `getAddressByUnit()`
- Mostrar endereço na mensagem de confirmação

**Exemplo de mensagem atualizada:**
```
"Obrigado, Maria! Sua presença foi confirmada para o dia segunda-feira, 03 de fevereiro de 2026 às 14:00.

📍 Local: Rua Jaime Salse, 280 - Madre Gertrudes

Até lá!"
```

## Fluxo Visual

```text
┌─────────────────────────────────────────┐
│           E-MAIL DO PACIENTE            │
├─────────────────────────────────────────┤
│  📅 Data: 30/01/2026                    │
│  🕐 Horário: 10:00                      │
│  👨‍⚕️ Profissional: Dr. João              │
│  📋 Tipo: Atendimento                   │
│  📍 Local: Rua Jaime Salse, 280 ← NOVO  │
│           (Madre Gertrudes)             │
└─────────────────────────────────────────┘

         Paciente clica "Confirmo"
                    ↓

┌─────────────────────────────────────────┐
│     ✅ Presença Confirmada!             │
├─────────────────────────────────────────┤
│  Obrigado, Maria!                       │
│  Sua presença foi confirmada.           │
│                                         │
│  📍 Local: Rua Jaime Salse, 280         │
│           (Madre Gertrudes)         ← NOVO│
│                                         │
│  Até lá!                                │
└─────────────────────────────────────────┘
```

## Arquivos a Modificar
1. `supabase/functions/send-appointment-email/index.ts`
2. `supabase/functions/confirm-appointment/index.ts`

## Nenhuma Migração Necessária
A coluna `unit` já existe na tabela `schedules`.
