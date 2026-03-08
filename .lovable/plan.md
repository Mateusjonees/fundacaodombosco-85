

# Plano: Melhorar Filtros e Resumo Financeiro

## Problemas Identificados

1. **Sem filtro por forma de pagamento** — Os filtros avancados nao tem opcao para filtrar por PIX, Dinheiro, Cartao, etc.
2. **Sem filtro por categoria** — Existe o state `categoryFilter` mas nao aparece no painel de filtros avancados (so filtra internamente)
3. **Saldo real nao reflete os filtros** — Os cards de resumo no topo mostram apenas o mes atual, nao reagem aos filtros de data aplicados
4. **Sem resumo por forma de pagamento** — Nao mostra totais agrupados por metodo de pagamento (quanto entrou via PIX, quanto via Cartao, etc.)

## Melhorias Planejadas

### 1. Adicionar filtro por Forma de Pagamento
Novo select no painel de filtros com opcoes: Todos, Dinheiro, PIX, Cartao Credito, Cartao Debito, Transferencia, Boleto, Contrato, Interno.

### 2. Adicionar filtro por Categoria
Select com categorias de receita e despesa no painel de filtros.

### 3. Cards de resumo reativos aos filtros
Os 6 cards do topo passam a refletir os `filteredRecords` (periodo filtrado), nao so o mes atual. Mostrar:
- **Receita Total** (do periodo filtrado)
- **Despesas** (do periodo filtrado)
- **Saldo Real** = Receita - Despesas (do filtro ativo)
- **Ticket Medio**
- **Total de Transacoes**
- **A Receber**

Indicacao visual do periodo ativo (ex: "Periodo: 01/01 a 31/03" ou "Mes atual").

### 4. Resumo por Forma de Pagamento
Novo card/secao abaixo dos filtros mostrando totais agrupados:
- PIX: R$ X.XXX
- Dinheiro: R$ X.XXX
- Cartao: R$ X.XXX
- etc.

Com barras visuais proporcionais para facil leitura.

### 5. Melhorar o "Relatorio Detalhado" no rodape
Substituir o card basico atual por um resumo completo com:
- Totais por categoria (Consulta, Terapia, Avaliacao, Materiais, Salarios)
- Totais por forma de pagamento
- Saldo liquido do periodo

## Arquivo a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Financial.tsx` | Adicionar filtro pagamento + categoria, cards reativos, resumo por pagamento |

## Detalhes tecnicos

- Novo state: `paymentMethodFilter` para filtro por forma de pagamento
- `filteredRecords` ja existe e sera usado para calcular os totais nos cards
- Agrupamento por payment_method: `reduce` sobre `filteredRecords` para gerar mapa de totais
- Cards do topo: trocar `currentMonthIncome/Expenses` por totais calculados de `filteredRecords`
- Manter `currentMonth` como fallback quando nenhum filtro de data esta ativo

