
## Correção dos 160 Registros Financeiros de Contratos

### Problema

Existem **160 registros financeiros** no banco com `payment_method: 'contract'` e notas genéricas "Contrato gerado - Pagamento registrado". A informação real de pagamento (Cartão, PIX, parcelas, etc.) **nunca foi salva** nesses registros porque o código antigo usava valores fixos.

Além disso, a tabela `client_payments` (que deveria guardar detalhes como parcelas de cartão) tem **0 registros** porque a política de RLS só permite acesso a diretores — outros cargos que geram contratos não conseguem inserir.

### O que será feito

**1. Corrigir RLS da tabela `client_payments`** (migração SQL)

Adicionar política para que qualquer usuário autenticado possa inserir registros de pagamento (não apenas diretores). Isso garante que contratos futuros salvem os detalhes corretamente.

**2. Criar uma Edge Function para atualizar registros existentes**

Como não temos como recuperar automaticamente a forma de pagamento dos 160 contratos antigos (a informação simplesmente não foi salva), a solução é:

- Atualizar os `notes` dos registros com `payment_method: 'contract'` para indicar claramente "⚠️ Revisar forma de pagamento"
- Manter o `payment_method` como `'contract'` para que sejam facilmente filtráveis
- O usuário poderá usar o botão de edição (já corrigido com campo de "Detalhes do Pagamento") para corrigir cada registro manualmente

**3. Adicionar botão "Revisar Contratos Antigos" na tela Financeira**

Na página Financial.tsx, adicionar um alerta/banner visível quando existirem registros com `payment_method: 'contract'`, informando que esses registros precisam ter a forma de pagamento atualizada. Incluir um filtro rápido para mostrar apenas esses registros pendentes de revisão.

### Detalhes Técnicos

**Migração SQL - RLS `client_payments`:**
```sql
CREATE POLICY "Authenticated users can insert payments"
  ON client_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read own payments"
  ON client_payments FOR SELECT
  TO authenticated
  USING (true);
```

**`src/pages/Financial.tsx`:**
- Adicionar banner de alerta no topo da tabela quando houver registros com `payment_method = 'contract'`
- Adicionar botão de filtro "Contratos pendentes" para listar apenas registros que precisam de revisão
- Contar quantos registros precisam ser atualizados e mostrar no banner

**`src/pages/Contracts.tsx`:**
- Verificar que o código atual já salva corretamente (confirmado - a correção anterior está OK)
- Garantir que `client_payments` seja inserido com sucesso agora que a RLS será corrigida

### Resultado Esperado

- Contratos **novos**: salvam forma de pagamento real (PIX, Cartão 3x, Dinheiro, etc.) corretamente em `financial_records` E `client_payments`
- Contratos **antigos** (160): aparecem com banner de alerta para o usuário revisar e atualizar manualmente via o dialog de edição
- A tela financeira mostra claramente quais registros precisam de revisão
