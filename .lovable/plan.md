
# Plano: Sistema de Testes Neuropsicologicos para Unidade Neuro

## Resumo

Criar um sistema completo para que estagiarios da unidade **Floresta (Neuro)** possam aplicar testes neuropsicologicos durante a finalizacao de atendimentos. O sistema calcula automaticamente resultados, percentis e classificacoes com base em tabelas normativas por idade do paciente.

---

## Fluxo de Uso

```text
Estagiario finaliza atendimento (Floresta/Neuro)
         |
         v
+----------------------------------+
| Dialog de Finalizacao            |
| +------------------------------+ |
| | Seletor de Testes Neuro      | |
| | - BPA-2 (6-81 anos)          | |
| | - Futuros testes...          | |
| +------------------------------+ |
| +------------------------------+ |
| | Formulario de Escores        | |
| | AC: A[_] E[_] O[_] = XX      | |
| | AD: A[_] E[_] O[_] = XX      | |
| | AA: A[_] E[_] O[_] = XX      | |
| | AG: = AC+AD+AA = XXX         | |
| | Percentis e Classificacoes   | |
| +------------------------------+ |
| +------------------------------+ |
| | Materiais Utilizados         | |
| +------------------------------+ |
| +------------------------------+ |
| | Evolucao do Atendimento      | |
| +------------------------------+ |
+----------------------------------+
         |
         v
   Dados salvos em:
   - schedules.neuro_test_results
   - neuro_test_results (tabela dedicada)
   - Disponiveis no perfil do paciente
```

---

## O Que o Usuario Vera

### 1. Ao Finalizar Atendimento (Unidade Floresta)

O dialog mostrara uma nova secao "Testes Neuropsicologicos Aplicados" com:

- **Seletor de testes**: Lista de testes disponiveis para a idade do paciente
- **Formulario dinamico**: Campos para inserir escores brutos (Acertos, Erros, Omissoes)
- **Calculos automaticos**: Resultados calculados em tempo real
- **Percentis e classificacoes**: Consultados automaticamente na tabela normativa

### 2. No Perfil do Paciente

Nova aba **"Testes Neuro"** mostrando:

- Historico de todos os testes aplicados
- Data de aplicacao, profissional responsavel
- Resultados detalhados (escores, percentis, classificacoes)
- Tabela resumo para uso em laudos
- Botao para gerar texto formatado para laudo

---

## Estrutura Tecnica

### Banco de Dados

**Tabela `neuro_test_results`** (nova):

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| client_id | uuid | FK para clients |
| schedule_id | uuid | FK para schedules (opcional) |
| attendance_report_id | uuid | FK para attendance_reports (opcional) |
| test_code | text | Codigo do teste (ex: BPA2) |
| test_name | text | Nome completo do teste |
| patient_age | integer | Idade do paciente no momento |
| raw_scores | jsonb | Escores brutos inseridos |
| calculated_scores | jsonb | Escores calculados (AC, AD, AA, AG) |
| percentiles | jsonb | Percentis encontrados por subescala |
| classifications | jsonb | Classificacoes por subescala |
| applied_by | uuid | FK para profiles (quem aplicou) |
| applied_at | timestamptz | Data/hora da aplicacao |
| notes | text | Observacoes adicionais |
| created_at | timestamptz | Default now() |

### Arquivos de Dados

**`src/data/neuroTests/bpa2.ts`**:
- Definicao do teste BPA-2
- Estrutura dos subtestes (AC, AD, AA, AG)
- Faixas etarias suportadas (6-81+ anos)
- Formulas de calculo

**`src/data/neuroTests/bpa2Percentiles.ts`**:
- Tabelas completas de percentis por idade
- Mapeamento de pontuacao bruta para percentil
- Classificacoes correspondentes

### Componentes

1. **`NeuroTestSelector.tsx`**: Seleciona teste e valida idade
2. **`NeuroTestBPA2Form.tsx`**: Formulario especifico para BPA-2
3. **`NeuroTestResults.tsx`**: Exibe resultados calculados
4. **`PatientNeuroTestHistory.tsx`**: Historico no perfil do paciente

### Integracao

- **`CompleteAttendanceDialog.tsx`**: Integrar seletor de testes para unidade Floresta
- **`ClientDetailsView.tsx`**: Adicionar aba "Testes Neuro"

---

## Logica de Calculo (BPA-2)

### Formulas

```text
AC = Acertos - (Erros + Omissoes)
AD = Acertos - (Erros + Omissoes)
AA = Acertos - (Erros + Omissoes)
AG = AC + AD + AA
```

### Consulta de Percentil

1. Calcular idade do paciente (anos completos, arredondado para baixo)
2. Para cada escore calculado (AC, AD, AA, AG):
   - Buscar na tabela normativa por idade
   - Se escore exato nao existir, usar percentil do valor imediatamente inferior
   - Retornar percentil e classificacao

### Classificacoes

| Percentil | Classificacao |
|-----------|---------------|
| 1 | Muito Inferior |
| 10-20 | Inferior |
| 25-30 | Medio Inferior |
| 40-70 | Medio |
| 75-80 | Medio Superior |
| 90 | Superior |
| 99 | Muito Superior |

---

## Exemplo de Resultado

```text
Paciente: Joao Silva (12 anos)
Teste: BPA-2

+------------------+--------+------------+-----------------+
| Subteste         | Escore | Percentil  | Classificacao   |
+------------------+--------+------------+-----------------+
| Atencao Conc.(AC)| 69     | 50         | Medio           |
| Atencao Div. (AD)| 58     | 40         | Medio           |
| Atencao Alt. (AA)| 77     | 50         | Medio           |
| Atencao Geral(AG)| 204    | 60         | Medio           |
+------------------+--------+------------+-----------------+
```

---

## Arquivos a Criar

1. `src/data/neuroTests/bpa2.ts` - Definicao do teste
2. `src/data/neuroTests/bpa2Percentiles.ts` - Tabelas normativas
3. `src/data/neuroTests/index.ts` - Exportacoes
4. `src/components/NeuroTestSelector.tsx` - Seletor de testes
5. `src/components/NeuroTestBPA2Form.tsx` - Formulario BPA-2
6. `src/components/NeuroTestResults.tsx` - Exibicao de resultados
7. `src/components/PatientNeuroTestHistory.tsx` - Historico no perfil

## Arquivos a Modificar

1. `src/components/CompleteAttendanceDialog.tsx` - Adicionar secao de testes
2. `src/components/ClientDetailsView.tsx` - Nova aba "Testes Neuro"

## Migracao SQL

- Criar tabela `neuro_test_results`
- Adicionar RLS policies para seguranca

---

## Extensibilidade

A arquitetura permite adicionar novos testes facilmente:

1. Criar arquivo de definicao em `src/data/neuroTests/[nome].ts`
2. Criar tabela de percentis em `src/data/neuroTests/[nome]Percentiles.ts`
3. Criar formulario especifico se necessario
4. Registrar no index.ts

Testes futuros planejados: WISC-V, SNAP-IV, e outros conforme fornecidos.
