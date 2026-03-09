

## Verificacao dos Testes Neuropsicologicos: Percentis e Historico

### Analise Realizada

Analisei o fluxo completo: definicao dos testes (`src/data/neuroTests/`), formularios de entrada (`NeuroTest*Form.tsx`), salvamento no banco (`CompleteAttendanceDialog.tsx`), e exibicao no historico (`PatientNeuroTestHistory.tsx`).

### 1. Percentis - Situacao Atual

Os testes se dividem em dois grupos por design:

**Testes COM percentil calculado** (salvam percentis no banco): BPA2, RAVLT, FDT, TIN, PCFO, TSBC, FVA, BNTBR, TRILHAS, TMT_ADULTO, FAS, HAYLING (ambos), TFV, TOM, TAYLOR, TRPP, FPT (ambos), REY, STROOP, WCST, WECHSLER, TOL, D2, RAVEN -- todos salvam `percentiles` preenchidos.

**Testes SEM percentil por natureza** (escalas clinicas com classificacao direta): BDI, BAI, SNAP-IV, M-CHAT, WMS, MoCA, MEEM, BRIEF-2, Corsi, Conners, Vineland, ACE-III, CBCL, SDQ, GDS, TDE2, NEUPSILIN, Cancelamento -- salvam `percentiles: {}` (vazio). Isso e **correto** pois esses instrumentos usam pontos de corte ou classificacoes diretas, nao tabelas de percentil.

**Conclusao**: O calculo de percentis esta correto. Testes que tem tabelas normativas com percentis os salvam; escalas clinicas que usam pontos de corte salvam apenas classificacoes.

### 2. Historico do Paciente - Situacao Atual

O historico funciona corretamente:
- `CompleteAttendanceDialog.tsx` salva na tabela `neuro_test_results` via `supabase.from('neuro_test_results').insert(testsToSave)`
- `PatientNeuroTestHistory.tsx` busca com `supabase.from('neuro_test_results').select('*').eq('client_id', clientId)`
- O historico aparece na aba "Testes Neuro" do `ClientDetailsView.tsx` (apenas para pacientes da unidade `floresta`)
- O `NeuroScoreCalculator` tambem permite salvar testes avulsos no historico

**Potencial problema identificado**: O historico so aparece para pacientes com `unit === 'floresta'`. Se testes forem aplicados a pacientes de outra unidade, os resultados sao salvos no banco mas nao tem interface para visualizacao.

### 3. Problema menor encontrado

No `NeuroTestResults.tsx` e `PatientNeuroTestHistory.tsx`, os testes que salvam `percentiles: {}` mostram a tabela de resultados corretamente usando `classifications` quando percentis estao vazios. O componente trata isso adequadamente.

### Resumo

Nao ha bug critico. O sistema esta funcionando conforme o esperado:
- Testes com dados normativos calculam e salvam percentis corretamente
- Escalas clinicas usam classificacoes diretas (sem percentil) -- comportamento correto
- Todos os resultados sao salvos na tabela `neuro_test_results` e aparecem no historico do paciente

A unica ressalva e que a aba de historico de testes neuro so esta visivel para pacientes da unidade "floresta". Se desejar expandir para todas as unidades, seria uma mudanca simples.

