

## Plano: Detalhamento de Contratos no Resumo Financeiro + Controle de Boletos pela Coordenadora

### Contexto

O "Resumo por Forma de Pagamento" mostra "Contrato" como uma linha simples (valor + quantidade). O usuário quer que ao exibir "Contrato", mostre os detalhes completos como na aba "A Receber" (parcelas, valores, entrada, status). Além disso, a coordenadora Tati (`coordinator_floresta`) precisa poder marcar pagamentos de boleto mensais como recebidos, mês a mês.

---

### Mudanças Planejadas

#### 1. Expandir "Contrato" no Resumo por Forma de Pagamento

No `Financial.tsx`, na seção "Resumo por Forma de Pagamento", quando o método for `contract`/`Contrato`:

- Tornar a linha clicável (accordion/expansão)
- Ao expandir, mostrar uma mini-lista com os contratos de `pendingPayments`, incluindo:
  - Nome do paciente
  - Valor total do contrato
  - Parcelas pagas/total
  - Valor entrada + forma
  - Cartão de crédito parcelas
  - Barra de progresso
  - Status (Quitado/Parcial/Pendente/Vencido)
- Reutilizar dados já carregados em `pendingPayments`

#### 2. Controle de Boletos pela Coordenadora (Check Mensal)

Permitir que `coordinator_floresta` (Tati) marque parcelas como pagas diretamente na aba "A Receber" do financeiro:

- Adicionar botão "✓ Marcar como Pago" em cada parcela pendente na lista de parcelas do contrato (seção que já existe em linhas 1510-1557)
- Ao clicar, abrir dialog simples pedindo confirmação e data de pagamento
- Atualizar `payment_installments` (status='paid', paid_amount=amount, paid_at=now)
- O trigger `update_payment_status()` já existe e atualiza automaticamente o `client_payments`
- Expandir a permissão de acesso: atualmente só `director` e `financeiro` acessam o financeiro. Adicionar `coordinator_floresta` à verificação de acesso na página Financial (ou usar permissão customizada `view_financial`)

#### 3. Permissão de Acesso

- No `Financial.tsx` (linha 91-92), adicionar `coordinator_floresta` ao check de acesso, mas com visão limitada (apenas aba "A Receber" e controle de boletos)
- Alternativamente, usar `customPermissions.hasPermission('view_financial')` que já existe

---

### Arquivos Afetados

| Arquivo | Alteração |
|---|---|
| `src/pages/Financial.tsx` | Expandir resumo "Contrato" com detalhes; adicionar botão de check em parcelas; permitir acesso `coordinator_floresta` |

