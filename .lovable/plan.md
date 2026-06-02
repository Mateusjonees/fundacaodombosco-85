## Objetivo
Remover a poluição visual da timeline lateral (círculo verde com check + linha vertical conectando os cards) no "Histórico de Serviços" dentro do paciente, deixando uma lista mais técnica e densa.

## Mudanças
Arquivo: `src/components/ServiceHistory.tsx` (linhas ~676-689)

1. Remover o wrapper `relative` + a `<div>` da linha vertical (`absolute left-6 top-12 ...`).
2. Remover o indicador circular (`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background border-2 border-primary ...`) que renderiza o `getStatusIcon`.
3. Remover o `flex gap-3` que existia só para acomodar a timeline.
4. O status do atendimento continua visível através do Badge "Concluído" / "Pendente" que já aparece no cabeçalho do card (linha 698-700), então nenhuma informação é perdida.
5. Reduzir o `pb-6 sm:pb-8` (que servia para dar espaço para a linha) para um `mb-2` ou `space-y-2` no container pai, deixando os cards mais próximos.

## Resultado visual
Os cards de sessão passam a aparecer empilhados diretamente, sem o trilho lateral com bolinhas, ocupando 100% da largura disponível — visual técnico e limpo mesmo com muitas sessões.