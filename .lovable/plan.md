

## Plano: Atualizar dados dos pacientes com informações da planilha

### O que a planilha contém

A planilha "Controle Ambulatório FDB" tem **46 pacientes** com os seguintes dados:
- Nome, Data de Nascimento, Telefone, Email, CPF do Responsável
- Nome do Responsável, Status (Ativo/Inativo)
- **Data da 1ª sessão** (campo principal solicitado)
- Data de Fim, Observações, Dia/Horário
- Indicação se tem Anamnese e Laudo

### O que será feito

Criar uma funcionalidade de atualização em massa que:

1. **Lê a planilha** e extrai os dados de cada paciente
2. **Busca cada paciente no banco** pelo nome (já existem no sistema)
3. **Atualiza os campos faltantes** de cada paciente:
   - `neuro_test_start_date` ← "Data - 1ª sessão"
   - `neuro_report_deadline` ← "Data - Fim"
   - `phone` ← se estiver vazio no banco
   - `email` ← se estiver vazio
   - `responsible_name` ← se estiver vazio
   - `responsible_cpf` ← se estiver vazio
   - `notes` ← Observações + Dia/Horário da planilha

### Implementação técnica

Criar um script utilitário `src/utils/updateClientsFromSpreadsheet.ts` que:
- Faz fetch do arquivo XLSX copiado para `public/temp/`
- Parseia com a biblioteca `xlsx` (já instalada)
- Para cada linha, faz `UPDATE` no Supabase apenas nos campos que estão vazios/nulos no banco
- Retorna relatório de quantos foram atualizados vs erros

Adicionar um botão na página de Clientes (`src/pages/Clients.tsx`) para executar essa atualização, visível apenas para admin/diretor.

### Campos mapeados

| Planilha | Campo no banco |
|----------|---------------|
| Data - 1ª sessão | `neuro_test_start_date` |
| Data - Fim | `neuro_report_deadline` |
| Telefone - Contato | `phone` |
| E-mail - Contato | `email` |
| Nome - Responsável | `responsible_name` |
| CPF - Responsável | `responsible_cpf` |
| Dia/Horário | `notes` (append) |
| Observações | `notes` (append) |

