

## Plano: Corrigir Relatórios - Build Error, Filtros de Data e Separação por Demanda

### Problemas Identificados

1. **Build error (linha 249)**: `new Map(profiles?.map(...) || [])` — quando `profiles` vem de `{ data: [] }`, o TypeScript infere `any[][]` ao invés de `[string, string][]`. Precisa de type assertion.

2. **Filtros de data não funcionando**: Os inputs `type="date"` e `type="month"` estão corretos mas o `coordinator_atendimento_floresta` é bloqueado na verificação de acesso (linha 1325-1327) — falta esse role na checagem final.

3. **Falta separação por tipo de demanda (SUS, Demanda Externa, Demanda Própria)**: A tabela `attendance_reports` não tem `service_type`, mas o `schedule` vinculado sim. Precisa fazer join com schedules para trazer o `service_type` e depois agrupar/filtrar por ele.

4. **Filtro de "Tipo de Atendimento"** mistura tipo de sessão (Consulta, Terapia) com demanda (SUS, Própria, Externa). Precisa de um filtro separado para "Demanda".

### Mudanças Técnicas

**Arquivo: `src/pages/Reports.tsx`**

1. **Fix build error** (linha 249): Adicionar type assertion `as [string, string][]` em todas as ocorrências de `new Map(profiles?.map(p => [p.user_id, p.name]) || [])`.

2. **Fix acesso coordenador_atendimento_floresta** (linha 1325-1327): Adicionar `userRole === 'coordinator_atendimento_floresta'` à checagem.

3. **Novo estado `selectedDemand`**: Adicionar filtro de demanda (SUS / Demanda Própria / Demanda Externa / Laudo / Todos).

4. **Buscar `service_type` do schedule**: No `loadAttendanceReports`, fazer join com `schedules` para trazer o `service_type`, ou buscar separadamente e mapear. Como o attendance_report já tem `schedule_id`, buscar os schedules correspondentes e enriquecer cada report com o `service_type`.

5. **UI de filtro de demanda**: Adicionar Select de "Demanda" na seção de filtros, com as opções: SUS, Demanda Própria, Demanda Externa, Laudo.

6. **Coluna "Demanda" na tabela**: Adicionar coluna com badge colorido mostrando o tipo de demanda em cada atendimento.

7. **Separação visual por demanda**: Nos stats cards, adicionar breakdown por demanda. Na tabela de atendimentos, mostrar a demanda com badges coloridos (verde=SUS, azul=Própria, laranja=Externa, indigo=Laudo).

8. **Filtro aplicado**: Quando `selectedDemand !== 'all'`, filtrar os `attendanceReports` pelo `service_type` do schedule vinculado.

### Resumo
- 1 fix de build (type assertion)
- 1 fix de permissão (coordinator_atendimento_floresta)
- Novo filtro de demanda + coluna na tabela
- Join com schedules para trazer service_type nos relatórios
- Cards de resumo por demanda na aba de atendimentos

