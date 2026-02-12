

## Realidade dos 160 Registros de Contrato

### O que foi encontrado

Apos investigacao detalhada no banco de dados:

- **160 registros financeiros** tem `payment_method: 'contract'` -- a forma de pagamento real (Cartao, PIX, Dinheiro, parcelas) **nunca foi salva** no banco de dados
- A tabela `client_payments` tem **0 registros** (a RLS bloqueava insercao, ja corrigido na migracao anterior)
- A tabela `automatic_financial_records` tem apenas **2 registros** com metadados de contrato, e nenhum deles tem correspondencia com os 160 registros
- A tabela `attendance_reports` nao armazena informacao de pagamento
- **Conclusao: a informacao de pagamento dos contratos antigos nao existe em nenhuma tabela do banco**

O codigo antigo de geracao de contrato salvava `payment_method: 'contract'` fixo e `notes: 'Contrato gerado - Pagamento registrado'` -- descartando a escolha real do usuario.

### O que ja esta corrigido (sessoes anteriores)

1. O codigo novo em `Contracts.tsx` (linhas 459-464) ja salva o `payment_method` real (PIX, credit_card, cash, etc.) usando a funcao `mapPaymentMethod`
2. A RLS da tabela `client_payments` ja foi corrigida para permitir insercao por qualquer usuario autenticado
3. O dialog de edicao ja tem campo "Detalhes do Pagamento"

### O que precisa ser feito agora

Como os dados nao podem ser recuperados automaticamente, a solucao e **facilitar a correcao manual** na interface:

**1. Melhorar o banner de alerta na tela Financeira** (`src/pages/Financial.tsx`)
- Texto mais claro explicando que os registros antigos precisam ser editados manualmente
- Botao para filtrar apenas registros pendentes (ja existe)
- Adicionar contagem visivel

**2. Melhorar o dialog de edicao para contratos** (`src/components/EditFinancialRecordDialog.tsx`)
- Quando o registro tem `payment_method === 'contract'`, destacar visualmente que precisa de revisao
- Adicionar campo de **numero de parcelas** visivel quando metodo for cartao de credito
- Ao salvar, gerar automaticamente o texto de `notes` baseado na forma de pagamento e parcelas selecionadas
- Exemplo: se usuario selecionar "Cartao de Credito" e "3 parcelas" com valor R$ 1.600, o notes sera gerado como "Cartao de Credito - 3x de R$ 533,33"

**3. Garantir que novos contratos continuem salvando corretamente**
- Verificar e ajustar o fluxo em `Contracts.tsx` para que `client_payments` tambem seja inserido com sucesso (RLS ja corrigida)

### Detalhes Tecnicos

**`src/components/EditFinancialRecordDialog.tsx`:**
- Adicionar estado `installments` (numero de parcelas)
- Campo condicional: quando `payment_method` for `credit_card` ou `debit_card`, mostrar input de parcelas
- Funcao `generatePaymentNotes()` que cria texto automatico:
  - "Cartao de Credito - 3x de R$ 533,33" (para cartao com parcelas)
  - "PIX - Pagamento a vista" (para PIX)
  - "Dinheiro - Pagamento a vista" (para dinheiro)
  - "Boleto - Pagamento a vista" (para boleto)
- Banner de alerta no topo do dialog quando `record.payment_method === 'contract'`
- Ao salvar, o campo `notes` e preenchido automaticamente se estiver vazio, com base na forma de pagamento

**`src/pages/Financial.tsx`:**
- Melhorar texto do banner existente
- Sem mudancas estruturais grandes, apenas ajuste de texto

