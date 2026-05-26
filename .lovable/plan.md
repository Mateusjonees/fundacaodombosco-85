## Plano

### 1. Corrigir filtro de funcionário no relatório
O `Combobox` atual (`src/components/ui/combobox.tsx`) passa o UUID do funcionário como `value` do `CommandItem`. A biblioteca `cmdk` faz busca pelo `value`, não pelo texto visível — por isso digitar "Lucas" ou "Mariana" não encontra ninguém. Vamos passar o `label` como `value` interno (mantendo o id em paralelo) para que a busca textual funcione. Mesma correção beneficia o filtro de pacientes.

### 2. Relatório de atendimentos
- Adicionar **filtro de status de validação** (Todos / Pendentes / Validados / Rejeitados) ao lado dos demais filtros em `src/pages/Reports.tsx`.
- Remover o `limit(100)` rígido e aumentar para 1000 (ou paginar por mês) para não esconder atendimentos antigos.
- Garantir que a query envie o `validation_status` quando o filtro for diferente de "Todos".

### 3. Edição de atendimentos pelo profissional
**RLS:** a política `Staff can update attendance reports` hoje permite update se `created_by = auth.uid() OR completed_by = auth.uid() OR director_has_god_mode()`. Vamos adicionar `employee_id = auth.uid()` para que o profissional dono do atendimento (mesmo que validado) consiga editar.

**UI:** na lista de atendimentos do relatório (e onde já existe o detalhamento), exibir botão "Editar" quando o atendimento pertencer ao usuário atual (qualquer profissional) ou quando for diretor/coordenador. Abrir o diálogo de edição já existente em `AttendanceValidation` (ou um novo dialog enxuto) com os campos do atendimento.

### Arquivos a alterar
- `src/components/ui/combobox.tsx` — busca por label.
- `src/pages/Reports.tsx` — novo filtro de status, limite ampliado, botão "Editar" por linha.
- Nova migration: ajustar política UPDATE em `attendance_reports` para incluir `employee_id = auth.uid()`.

### Detalhes técnicos
- Combobox: usar `value={`${option.label}__${option.value}`}` no `CommandItem` e fazer o `onSelect` extrair o id após o `__`. Mantém compatibilidade com todos os usos do componente.
- Migration sugerida:
```sql
DROP POLICY "Staff can update attendance reports" ON public.attendance_reports;
CREATE POLICY "Staff can update attendance reports"
  ON public.attendance_reports FOR UPDATE
  USING (
    created_by = auth.uid()
    OR completed_by = auth.uid()
    OR employee_id = auth.uid()
    OR director_has_god_mode()
  );
```
