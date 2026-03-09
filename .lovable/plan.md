

## Plano: Melhorar a Experiência dos Coordenadores Neuro no Sistema

### Problemas Identificados

1. **Dashboard genérico** -- Coordenadores neuro veem o mesmo painel que todos os coordenadores, sem destaque para métricas neuro (laudos pendentes, prazos vencendo, horas acumuladas).
2. **Página de Neuroavaliação densa** -- Tabela com 19 colunas difícil de navegar; filtros e estatísticas ocupam muito espaço vertical antes de chegar aos dados.
3. **Sem alertas proativos** -- Laudos com prazo vencido ou próximo do vencimento não geram nenhum alerta visual.
4. **Navegação sem atalhos** -- Coordenadores neuro precisam navegar por vários menus para acessar as ferramentas mais usadas (calculadora de testes, histórico de paciente, edição de neuro dados).

---

### Mudanças Planejadas

#### 1. Dashboard com Seção Neuro para Coordenadores

Adicionar ao `Dashboard.tsx` um bloco exclusivo para coordenadores neuro (roles `coordinator_floresta`, `coordinator_atendimento_floresta`) com:

- **Card "Laudos Pendentes"** com contagem e badge de urgência (prazos vencidos em vermelho).
- **Card "Próximos Vencimentos"** mostrando quantos laudos vencem nos próximos 7 dias.
- **Card "Horas Neuro do Mês"** com total de horas de atendimento neuro.
- Link direto para `/neuroassessment`.

Query: buscar de `clients` onde `unit='floresta'` e `neuro_report_file_path IS NULL`, cruzando com `neuro_report_deadline`.

#### 2. Refatorar Página Neuroavaliação -- Layout por Abas

Reorganizar `Neuroassessment.tsx` de scroll vertical monolítico para **abas (Tabs)**:

- **Aba "Painel"** (default): Cards de estatísticas compactos + gráficos em grid 2x2.
- **Aba "Pacientes"**: Tabela simplificada com colunas essenciais visíveis (Código, Nome, Idade, Suspeita, Status Laudo, Prazo) e colunas secundárias em expansão por linha (accordion row) ou tooltip.
- **Aba "Exportar"**: Botões de exportação PDF/Excel com preview de filtros.

Reduzir a tabela de 19 para ~7 colunas visíveis, usando um botão de expandir linha para ver detalhes completos.

#### 3. Alertas de Prazos Vencidos

Criar componente `NeuroDeadlineAlerts.tsx`:

- Busca laudos pendentes com `neuro_report_deadline < today`.
- Exibe banner no topo da página Neuroavaliação: "X laudos com prazo vencido".
- Badge vermelho pulsante na sidebar ao lado do item "Neuroavaliação" para coordenadores neuro.

#### 4. Ações Rápidas na Tabela de Pacientes

Adicionar ao lado do botão de editar na tabela:

- **Botão "Ver Histórico"** -- abre modal com `PatientNeuroTestHistory` do paciente.
- **Botão "Calculadora"** -- abre `NeuroScoreCalculator` pré-preenchido com o paciente selecionado.
- Menu dropdown com ações ao invés de ícones soltos.

---

### Arquivos Afetados

| Arquivo | Alteração |
|---|---|
| `src/pages/Dashboard.tsx` | Adicionar seção neuro para coordenadores |
| `src/pages/Neuroassessment.tsx` | Refatorar para layout com Tabs, tabela simplificada, alertas |
| `src/components/NeuroDeadlineAlerts.tsx` | Novo componente de alertas de prazo |
| `src/components/layout/AppSidebar.tsx` | Badge de laudos vencidos no item Neuroavaliação |
| `src/hooks/useNeuroStats.ts` | Novo hook compartilhado para stats neuro (dashboard + page) |

