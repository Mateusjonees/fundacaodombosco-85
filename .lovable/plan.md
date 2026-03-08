

# Melhorias na Aba de Pacientes

## Funcionalidades a adicionar

### 1. Exportar para Excel/CSV
- Adicionar botao "Exportar" no header da pagina (ao lado do "Cadastrar Paciente")
- Exportar a lista **filtrada** atual usando a biblioteca `xlsx` (ja instalada)
- Colunas: Nome, CPF, Telefone, Email, Unidade, Status, Data Nascimento, Genero, Data Cadastro

### 2. Coluna de Ultima Consulta
- Ao carregar a lista de pacientes, buscar do `schedules` a data do ultimo agendamento concluido (`completed_at`) agrupado por `client_id`
- Exibir na tabela (modo lista) uma coluna "Ultima Consulta"
- Nos cards, exibir como subtitulo discreto
- Usar uma query separada com `select('client_id, completed_at').eq('status', 'completed').order('completed_at', { ascending: false })` e agrupar no frontend

### 3. Filtro por Genero/Sexo
- Adicionar Select na FilterBar: "Todos Generos", "Masculino", "Feminino"
- O campo `gender` ja existe na tabela `clients`
- Precisa incluir `gender` na query `LIST_COLUMNS` do `useClients.ts`
- Filtro aplicado no `filteredClients` useMemo

### 4. Filtro por Tipo de Atendimento (Convenio/Plano)
- O schedules tem `payment_method` e o financial tem categorias como `convenio`, `particular`, `sus`
- Usar o campo `service_type` dos clinical_notes ou uma abordagem mais simples: filtrar com base no tipo de agendamento mais recente
- Alternativa pragmatica: adicionar campo `payment_type` no formulario de cadastro do paciente (particular/SUS/convenio) — alinhado com os tipos de demanda ja existentes no sistema (private, sus, external, laudo)
- Filtro na FilterBar com opcoes: Todos, Particular, SUS, Convenio, Externo

## Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useClients.ts` | Adicionar `gender` ao `LIST_COLUMNS` |
| `src/pages/Clients.tsx` | Adicionar filtro genero, filtro tipo atendimento, botao exportar, coluna ultima consulta, query de schedules |
| `src/components/PatientCard.tsx` | Exibir ultima consulta no card |

## Detalhes tecnicos

- **Exportar Excel**: usar `xlsx.utils.json_to_sheet()` + `xlsx.writeFile()` com dados de `filteredClients`
- **Ultima consulta**: query unica ao Supabase buscando max(completed_at) por client_id, armazenada em state Map
- **Genero**: filtro local no useMemo, campo ja existe no DB
- **Tipo atendimento**: usar o `service_type` do ultimo atendimento registrado (clinical_notes) como proxy, ou basear-se na unidade

