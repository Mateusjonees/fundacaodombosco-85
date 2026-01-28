
# Plano: Sincronizar Dados entre Modal de Finalização e Validação de Atendimento

## Problema Identificado

O modal de "Revisão Detalhada do Atendimento" na aba de validação exibe campos que não existem no modal de finalização (CompleteAttendanceDialog), causando inconsistência nos dados exibidos. Além disso, os testes neuropsicológicos (BPA-2, FDT, RAVLT) que são salvos corretamente no banco de dados não são carregados/exibidos na validação.

### Dados no Banco de Dados (atendimento pendente)
- **Evolução (observations/session_notes)**: "teste" (salvo corretamente)
- **Testes Neuro (RAVLT)**: Salvos na tabela `neuro_test_results` (correto)
- **Materiais**: Nenhum selecionado

### O que o Modal de Validação Mostra (mas não foi preenchido)
- Objetivos da Sessão (`techniques_used`) - campo não existe na finalização
- Resposta do Paciente (`patient_response`) - campo não existe na finalização
- Plano para Próxima Sessão (`next_session_plan`) - campo não existe na finalização
- Testes Neuropsicológicos - não são buscados/exibidos

---

## Solução

Modificar o **AttendanceValidationManager** para:

1. **Buscar testes neuropsicológicos** relacionados ao atendimento na tabela `neuro_test_results`
2. **Exibir os testes neuro** na revisão detalhada com escores, percentis e classificações
3. **Reorganizar campos** para mostrar apenas o que faz sentido (Evolução/Observações como campo principal)

---

## Arquivos a Modificar

### `src/components/AttendanceValidationManager.tsx`

**Alterações:**

1. Adicionar estado para armazenar testes neuro do atendimento selecionado
2. Buscar testes neuro quando um atendimento for selecionado para revisão
3. Adicionar seção "Testes Neuropsicológicos" no dialog de revisão detalhada
4. Exibir escores brutos, calculados, percentis e classificações de cada teste
5. Reorganizar a seção "Objetivos e Observações" para focar em "Evolução do Atendimento" (campo principal do modal de finalização)

---

## Detalhes Técnicos

### Interface para Testes Neuro
```typescript
interface NeuroTestResult {
  id: string;
  test_code: string;
  test_name: string;
  patient_age: number;
  raw_scores: any;
  calculated_scores: any;
  percentiles: any;
  classifications: any;
  notes: string;
}
```

### Busca de Testes Neuro
```typescript
const loadNeuroTests = async (attendanceReportId: string) => {
  const { data } = await supabase
    .from('neuro_test_results')
    .select('*')
    .eq('attendance_report_id', attendanceReportId)
    .order('created_at');
  
  setNeuroTests(data || []);
};
```

### Nova Seção no Dialog de Revisão
```text
Card: Testes Neuropsicológicos Aplicados
  - Para cada teste (BPA-2, FDT, RAVLT):
    - Nome do teste e idade do paciente
    - Escores brutos em formato tabular
    - Escores calculados
    - Percentis e Classificações
    - Notas do aplicador
```

---

## Fluxo Atualizado

```text
1. Profissional finaliza atendimento (CompleteAttendanceDialog)
   - Preenche: Testes Neuro + Materiais + Evolução
   - Dados salvos em: attendance_reports + neuro_test_results

2. Coordenador abre revisão (AttendanceValidationManager)
   - Sistema busca: attendance_reports + neuro_test_results
   - Exibe todos os dados de forma organizada
   - Permite editar valores e validar

3. Coordenador valida/rejeita atendimento
   - Ação processada normalmente
```

---

## Resultado Esperado

- Os testes neuropsicológicos (BPA-2, FDT, RAVLT) aplicados no atendimento serão exibidos na revisão
- Os escores, percentis e classificações serão visíveis para o coordenador
- A "Evolução do Atendimento" será o campo principal exibido (igual ao modal de finalização)
- Campos não utilizados (Objetivos, Resposta do Paciente, Plano) podem ser mantidos como opcionais ou removidos
