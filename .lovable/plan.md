

## Correcao dos Registros Financeiros de Contratos

### Problema

Quando um contrato e gerado, os registros financeiros sao salvos com `payment_method: 'contract'` ou `payment_method: 'Contrato'` de forma generica, **ignorando completamente** a forma real de pagamento escolhida pelo usuario (PIX, Cartao, Dinheiro, Boleto, etc.). Isso impede o controle financeiro real, pois nao se sabe como o paciente pagou, quantas parcelas tem no cartao, valor de entrada, etc.

### O que sera corrigido

Os registros financeiros gerados a partir de contratos passarao a incluir:

- **Forma de pagamento real** (PIX, Cartao, Dinheiro, Boleto, Combinado, Manual)
- **Numero de parcelas** (quando for cartao de credito)
- **Valor de entrada e metodo** (quando for pagamento manual)
- **Detalhes do pagamento combinado** (quando for combinado)
- **Data correta do contrato** (usando a data local, sem problema de fuso horario)
- **Descricao detalhada** com as informacoes de pagamento nas notas do registro

### Arquivos Alterados

**1. `src/pages/Contracts.tsx`** - Funcao `createFinancialRecord` (linhas 401-434)

Alterar para usar `contractData.paymentMethod` real em vez de `'contract'`. Incluir detalhes de parcelas, entrada e notas com informacoes completas de pagamento.

Antes:
```
payment_method: 'contract'
notes: 'Contrato gerado - Pagamento registrado'
```

Depois:
```
payment_method: contractData.paymentMethod (ex: 'PIX', 'Cartao', etc.)
notes: detalhes completos (parcelas, entrada, metodo, etc.)
installments: numero de parcelas quando cartao
```

Tambem corrigir os inserts em `automatic_financial_records` (linhas 543-565 e 731-754) para usar o `payment_method` real em vez de `'Contrato'`.

**2. `src/components/ContractGenerator.tsx`** - Funcao `createFinancialRecord` (linhas 103-134)

Mesma correcao: usar a forma de pagamento real do `contractData` em vez de `'contract'` fixo, e incluir detalhes nas notas.

### Detalhes Tecnicos

A logica sera:
- Se `paymentMethod === 'Cartao'`: salvar `payment_method: 'credit_card'`, adicionar `notes` com numero de parcelas e valor por parcela
- Se `paymentMethod === 'PIX'`: salvar `payment_method: 'pix'`
- Se `paymentMethod === 'Boleto'`: salvar `payment_method: 'bank_slip'`
- Se `paymentMethod === 'Dinheiro'`: salvar `payment_method: 'cash'`
- Se `paymentMethod === 'Combinado'`: salvar `payment_method: 'combined'` com `payment_combination` JSONB
- Se `paymentMethod === 'Manual'`: salvar `payment_method` da entrada, com notas sobre valor de entrada e saldo restante

As notas (`notes`) serao enriquecidas com informacoes como:
- "Cartao de Credito - 3x de R$ 533,33"
- "PIX - a vista"
- "Entrada R$ 500,00 (Dinheiro) + Saldo R$ 1.100,00"

Isso permitira controle financeiro real, sabendo exatamente como cada paciente pagou.

