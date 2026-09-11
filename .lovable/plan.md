# Corrigir evoluções duplicadas

## Objetivo
Limpar as evoluções repetidas de todos os pacientes e garantir que cada agendamento gere somente um atendimento e um registro no prontuário.

## Alterações
- Preservar uma única versão por agendamento, priorizando a versão mais recente quando houve novas tentativas de conclusão.
- Atualizar vínculos de testes, relatórios e demais registros relacionados antes de remover cópias antigas.
- Remover as duplicações exatas do prontuário, mantendo um registro clínico válido por atendimento.
- Vincular o prontuário ao agendamento de origem e bloquear novas duplicações no banco.
- Fazer a conclusão funcionar como atualização segura: repetir o clique ou sincronizar novamente não criará outra evolução.
- Adicionar uma trava imediata no botão e eliminar operações repetidas da fila offline.

## Validação
- Conferir CECILIA, ARTHUR e os demais pacientes identificados.
- Confirmar que não restou mais de um atendimento por agendamento nem evoluções clínicas idênticas.
- Executar os testes do projeto e validar uma conclusão de atendimento no sistema.

## Detalhes técnicos
- A limpeza será baseada no agendamento, preservando a versão mais recente e não apagando registros clínicos manuais sem vínculo.
- Índices únicos parciais protegerão `attendance_reports.schedule_id` e `medical_records.schedule_id`.
- A gravação passará de inclusão cega para operação idempotente, inclusive na sincronização offline.
