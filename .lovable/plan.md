## Refatoração visual — aparência hospitalar/ERP enterprise

Sem mexer em lógica, rotas, hooks ou dados. Apenas tokens de design, densidade e estilos de componentes. A maior parte da mudança vem de `index.css` + `tailwind.config.ts` + alguns componentes de chrome (sidebar, dashboard, tabelas, cards). Os 150+ componentes herdam automaticamente via tokens semânticos.

### Escopo (o que muda)

1. **Tokens globais (`src/index.css`)** — repintar a paleta para tons hospitalares sóbrios:
   - `--primary`: azul petróleo (ex.: `200 60% 32%`) — mais sério que o azul vibrante atual
   - `--secondary`: verde clínico discreto (`165 35% 38%`)
   - `--background`: branco gelo levemente acinzentado (`210 20% 98%`)
   - `--foreground`: cinza grafite (`215 25% 18%`)
   - `--muted` / `--border`: cinzas hospitalares neutros
   - Remover `--chart-3` roxo (trocar por azul-petróleo secundário)
   - `--radius`: de `0.75rem` (12px) → `0.375rem` (6px)
   - Sombras: `--shadow-md`/`-lg`/`-xl` praticamente zeradas (apenas 1px sutil); remover `--shadow-glow`
   - Gradientes (`--gradient-primary/secondary/subtle/card`) trocados por cores sólidas chapadas
   - Fonte: trocar import Google Fonts de `Inter` para **IBM Plex Sans** (400/500/600/700)
   - Modo dark recebe os mesmos ajustes (paleta sóbria, sem glow)

2. **Layer `components` do `index.css`** — reduzir aparência "SaaS":
   - Remover `.login-bubble`, blur e gradiente do `.login-container` (fundo cinza-azulado chapado)
   - Reduzir paddings/raios de classes utilitárias do projeto que forçam visual macio

3. **Tailwind config (`tailwind.config.ts`)** — encurtar animações (`fade-in`, `slide-up`, `scale-in` → de 150ms para 80ms ou removidas); reduzir keyframes decorativos.

4. **Sidebar (`src/components/layout/AppSidebar.tsx`)** — densidade ERP: menos padding vertical entre itens, ícones menores (h-4 w-4), tipografia 13px, separadores discretos por `border-b`, sem cards arredondados internos. Sem mudar itens nem navegação.

5. **Dashboard (`src/pages/Dashboard.tsx` + `DashboardActionCards`, `DashboardUpcomingAppointments`, `DashboardCharts`)** — reorganizar visualmente em painéis operacionais densos:
   - Header institucional fino (título + data + unidade) no lugar de hero
   - Grid 12 colunas com painéis bordados (sem sombras): "Agenda do dia", "Pacientes aguardando", "Pendências clínicas", "Atendimentos recentes"
   - Substituir cards grandes de KPI por uma faixa horizontal compacta de contadores numéricos com labels pequenos
   - Manter exatamente os mesmos dados/hooks que já existem

6. **Tabelas** (`src/components/ui/table.tsx`) — densidade enterprise: `py-2` no lugar de `py-4`, `text-xs` no header em caps, bordas horizontais sutis, zebra opcional desligada.

7. **Cards** (`src/components/ui/card.tsx`) — `rounded-md`, borda 1px, sem sombra, header com `border-b` sutil e padding reduzido.

8. **Buttons / Inputs** (`src/components/ui/button.tsx`, `input.tsx`) — `rounded-md`, sem `shadow`, altura padrão `h-9`, foco com `ring-1` sólido (sem glow).

9. **Prontuário (`src/pages/MedicalRecords.tsx` + `MedicalRecordTimeline.tsx` + `ServiceHistory.tsx`)** — layout em duas colunas densas: cabeçalho clínico do paciente fino no topo, timeline com linhas/separadores enxutos, sem cards bonitinhos. Mantém todos os dados e ações existentes.

### O que não muda

- Nenhuma rota, hook, query Supabase, função ou fluxo.
- Estrutura de componentes preservada — só classes e tokens.
- Permissões, RLS, roles intocados.
- Conteúdo (textos, labels) preservado.
- Memórias de cores por unidade (MADRE azul / Floresta verde / Atendimento Floresta roxo) **preservadas** para os badges de unidade — a restrição "sem roxo" se aplica à paleta global, não às tags identificadoras de unidade.

### Plano de execução (ordem)

```text
1. index.css         → paleta + radius + sombras + fonte + remover bolhas/glass
2. tailwind.config   → animações curtas, remover keyframes decorativos
3. ui/card, button, input, table → densidade enterprise
4. AppSidebar        → densidade ERP
5. Dashboard + widgets do dashboard
6. Prontuário (MedicalRecords + Timeline + ServiceHistory)
7. Smoke check no preview em 1280x800 e 1440x900
```

### Riscos e limites

- Componentes que usam classes hardcoded de cor (ex.: `bg-blue-500`, `text-white`) não respondem aos tokens; eles serão tocados pontualmente apenas se quebrarem visualmente após a mudança de paleta — não vou varrer todos os 150 componentes preventivamente.
- Manter compatibilidade com dark mode (a paleta dark é ajustada na mesma passada).
- Sem mudar nenhum comportamento clínico, nem renomear classes que outros componentes possam estar referenciando como APIs (ex.: variantes de Button continuam com os mesmos nomes, só mudam os estilos).

### Resultado esperado

Sistema com cara de ERP hospitalar (Tasy/MV): denso, sóbrio, com bordas em vez de sombras, paleta institucional, tipografia IBM Plex, sidebar compacta, dashboard operacional, tabelas densas, prontuário clínico sério. Mesmas funcionalidades, outra identidade.