

## Correcao da Exibicao de Formas de Pagamento no Financeiro

### Problema

A coluna "Pagamento" na tela financeira mostra valores inconsistentes como "cartao" (minusculo, sem acento) porque:

1. A funcao de validacao de atendimento no banco de dados salva o `payment_method` exatamente como vem do formulario (`cartao`, `dinheiro`, `pix`, `prazo`, `dividido`) - valores em portugues minusculo
2. A funcao `translatePaymentMethod` no Financial.tsx so mapeia valores em ingles (`credit_card`, `cash`) e alguns em portugues com inicial maiuscula (`Cartao`, `Dinheiro`), mas nao os valores minusculos do banco
3. Contratos antigos ainda mostram "Contrato" generico sem detalhes

### Solucao

**Arquivo: `src/pages/Financial.tsx`** - Funcao `translatePaymentMethod` (linhas 395-415)

Expandir o dicionario de traducoes para cobrir **todos** os valores possiveis salvos no banco:

```
Adicionar mapeamentos:
- 'cartao' -> 'Cartao'
- 'cartao_credito' -> 'Cartao de Credito'
- 'cartao_debito' -> 'Cartao de Debito'
- 'dinheiro' -> 'Dinheiro'
- 'prazo' -> 'A Prazo'
- 'dividido' -> 'Dividido'
- 'transferencia' -> 'Transferencia'
- 'convenio' -> 'Convenio'
- 'combined' -> 'Combinado'
- 'bank_slip' -> 'Boleto'
- 'bank_transfer' -> 'Transferencia'
```

Alem disso, exibir as **notas** (campo `notes`) como tooltip ou texto secundario na coluna de pagamento, para que informacoes como "Cartao de Credito - 3x de R$ 533,33" fiquem visiveis.

### Detalhes Tecnicos

**1. Expandir `translatePaymentMethod`** em `src/pages/Financial.tsx`:
- Adicionar todos os valores em portugues minusculo que vem do formulario de validacao de atendimento
- Adicionar valores em ingles que vem dos contratos atualizados

**2. Mostrar detalhes do pagamento na tabela** (linhas 886-890):
- Quando o registro tem `notes` com informacoes de pagamento (parcelas, entrada, etc.), exibir como texto menor abaixo do badge
- Usar um Tooltip no badge de pagamento para mostrar as notas completas ao passar o mouse

**3. Atualizar `EditFinancialRecordDialog`**:
- Adicionar as opcoes de pagamento que faltam no select de edicao (prazo, dividido, convenio)
- Garantir que ao editar, o valor salvo seja consistente

**4. Fetch do campo `notes`**:
- Verificar se o SELECT na funcao `fetchRecords` ja inclui o campo `notes` - se nao, adicionar ao select para que os detalhes fiquem disponiveis para exibicao

