

## Plano: Travar tipo de atendimento nos documentos clínicos conforme agendamento

### Problema atual
1. O `loadScheduleServiceType` só funciona para a unidade `atendimento_floresta` (filtro na linha 195). Nas demais unidades, o `defaultServiceType` fica `null` e o profissional pode escolher qualquer tipo.
2. Mesmo quando o `defaultServiceType` é passado, o Select continua editável -- o profissional pode mudar livremente.

### Alterações

#### 1. Remover filtro de unidade em `ClientDetailsView.tsx`
- Na função `loadScheduleServiceType` (linha 195), remover a condição `if (client.unit !== 'atendimento_floresta') return;` para que funcione em todas as unidades.

#### 2. Travar o Select nos 3 formulários quando houver `defaultServiceType`

**`AddAnamnesisDialog.tsx`** (linha 221):
- Quando `defaultServiceType` estiver definido, tornar o Select `disabled` e exibir uma mensagem informativa ("Tipo definido pelo agendamento").

**`AddPrescriptionDialog.tsx`** (linha 170):
- Mesmo tratamento: `disabled` quando `defaultServiceType` existe.

**`ClientLaudoManager.tsx`**:
- O laudo manager atualmente não tem campo de service_type no formulário de criação, mas recebe `defaultServiceType`. Não precisa de alteração aqui pois laudos usam `laudo_type` (neuropsicológico, psicológico, etc.), que é diferente do service_type.

#### 3. Garantir reset correto
- Quando `defaultServiceType` muda (paciente diferente, agendamento diferente), o state interno dos dialogs deve refletir o novo valor automaticamente (já está no `useEffect` existente).

### Resultado
- Profissional abre a ficha do paciente -> o tipo de atendimento já vem preenchido e travado conforme o último agendamento
- Não consegue alterar para outro tipo de demanda
- Funciona em todas as unidades, não apenas Atendimento Floresta

