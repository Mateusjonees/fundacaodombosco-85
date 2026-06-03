## Filtro de Atendimentos por Profissional no Histórico do Paciente

### Objetivo
Adicionar um filtro dentro da aba "Histórico de Serviços" do paciente para que o profissional logado possa alternar entre ver **todos os atendimentos** do paciente ou apenas **os seus próprios atendimentos**.

### Arquivo Alvo
- `src/components/ServiceHistory.tsx`

### Alterações

1. **Novo estado de filtro**
   - Adicionar `professionalFilter` com tipo `'all' | 'mine'` e valor inicial `'all'`.

2. **Novo controle de filtro na UI**
   - Adicionar um `<Select>` ao lado do filtro de validação existente (`validationFilter`), no header do `Card`.
   - Opções:
     - `all`: "Todos os atendimentos"
     - `mine`: "Meus atendimentos"
   - Ícone: `User` (do Lucide).

3. **Aplicação do filtro na listagem**
   - Combinar o filtro `professionalFilter` com o `validationFilter` existente no `.filter()` dos `serviceRecords`.
   - Lógica: quando `professionalFilter === 'mine'`, manter apenas registros onde `record.created_by_user_id === user?.id`.

4. **Mensagem de estado vazio**
   - Atualizar a mensagem exibida quando não há registros para refletir também o filtro de profissional (ex.: "Nenhum atendimento seu encontrado." quando `professionalFilter === 'mine'`).

### Notas
- O campo `created_by_user_id` já existe em todos os `ServiceRecord` (populado de `schedules.created_by`, `medical_records.employee_id`, `attendance_reports.employee_id` e `employee_reports.employee_id`).
- O `user` já está disponível via `useAuth()`.
- O filtro é puramente frontend, sem alterações no carregamento de dados do Supabase.

## Resumo
Adicionar um select "Todos / Meus atendimentos" no header do histórico de serviços do paciente, filtrando os registros já carregados pelo `created_by_user_id` do profissional logado.