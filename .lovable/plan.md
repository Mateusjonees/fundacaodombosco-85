

## Correcao dos Registros Financeiros Existentes + Validacao

### Problema Identificado

O codigo ja foi corrigido na sessao anterior para salvar a forma de pagamento real (PIX, Cartao, Dinheiro, etc.) nos novos contratos. Porem, **todos os registros existentes** no banco ainda tem `payment_method: 'contract'` e `notes: 'Contrato gerado - Pagamento registrado'` -- foram criados antes da correcao.

Alem disso, o registro da Gabriela (09/02/2026) na screenshot mostra exatamente esse problema: a informacao real de pagamento (cartao, parcelas, etc.) nao foi salva.

### Solucao em 2 Partes

**Parte 1 - Correcao dos registros existentes no banco**

Executar um UPDATE no banco para os registros antigos que ainda tem `payment_method = 'contract'`. Como nao temos como recuperar a forma de pagamento original desses registros, vamos alterar o `notes` para indicar que precisam ser revisados manualmente, e manter a edicao disponivel para o usuario corrigir cada um.

**Parte 2 - Melhorar o dialog de edicao para incluir detalhes de parcelas**

Atualizar `EditFinancialRecordDialog.tsx` para incluir:
- Campo de **numero de parcelas** (quando forma de pagamento for cartao)
- Campo de **notas/observacoes** editavel (para o usuario detalhar como foi o pagamento)
- O campo `notes` deve ser salvo junto com o registro ao editar

### Detalhes Tecnicos

**Arquivo: `src/components/EditFinancialRecordDialog.tsx`**

1. Adicionar `notes` ao formData (ja existe o campo description, mas notes e separado)
2. Adicionar campo condicional de parcelas quando `payment_method === 'credit_card'`
3. Incluir `notes` no update do Supabase ao salvar
4. Mostrar campo de notas para o usuario descrever detalhes do pagamento

**Arquivo: `src/pages/Financial.tsx`**

1. Passar o campo `notes` para o `EditFinancialRecordDialog` para que possa ser editado
2. Garantir que o record passado inclua notes

**SQL para corrigir registros existentes** (informativo):

Os registros antigos com `payment_method = 'contract'` precisarao ser editados manualmente pelo usuario na interface, ja que nao ha como saber retroativamente qual foi a forma de pagamento real. O botao de editar ja esta disponivel na tabela.

### Resultado

- Novos contratos: ja salvam corretamente (correcao anterior)
- Registros antigos: usuario pode editar via interface com os novos campos de parcelas e notas
- Todos os registros: exibem forma de pagamento e detalhes de parcelas na tabela financeira

