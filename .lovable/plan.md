

# Plano: Melhorias em "Meus Pacientes" + E-mail para Profissional ao Agendar

## Parte 1: Completar a aba "Meus Pacientes"

A pagina atual tem: agenda (dia/semana/mes), lista de pacientes com cards, busca, botao finalizar atendimento e ver detalhes. Faltam funcionalidades uteis para o profissional no dia a dia:

### Melhorias planejadas:

1. **Estatisticas resumidas no topo** — Cards com: total de pacientes vinculados, atendimentos da semana, atendimentos concluidos no mes, proxima consulta do dia
2. **Tipo de atendimento visivel na agenda** — Mostrar o `title` (tipo de sessao) junto ao horario nos cards da semana/dia
3. **Indicador de status na lista de pacientes** — Badge mostrando se o paciente tem agendamento proximo ou esta sem atendimento ha muito tempo (alerta)
4. **Botao "Ir para Hoje"** — Atalho rapido para voltar ao dia atual na navegacao de datas
5. **Contagem de sessoes realizadas** — Buscar do `schedules` quantas sessoes completed cada paciente tem com o profissional e exibir no card

## Parte 2: E-mail para o Profissional ao Agendar

Atualmente, ao agendar, o sistema envia e-mail apenas para o paciente via `send-appointment-email`. Preciso enviar tambem para o profissional.

### Implementacao:

1. **Modificar a edge function `send-appointment-email`** — Adicionar campo opcional `professionalEmail` no request. Quando presente, enviar um segundo e-mail para o profissional com template adaptado (perspectiva do profissional: "Voce tem um atendimento marcado com [paciente]...")
2. **Modificar `Schedule.tsx`** — Ao criar agendamento, buscar o email do profissional selecionado na tabela `profiles` (campo `email`) e passar como `professionalEmail` na chamada da edge function
3. **Template do e-mail profissional** — Mesmo layout visual, mas com texto direcionado ao profissional: nome do paciente, data/hora, tipo de atendimento, unidade

## Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/MyPatients.tsx` | Adicionar stats, botao Hoje, contagem sessoes, tipo atendimento na agenda |
| `src/pages/Schedule.tsx` | Buscar email do profissional e enviar na chamada da edge function |
| `supabase/functions/send-appointment-email/index.ts` | Aceitar `professionalEmail` e enviar e-mail ao profissional |

## Detalhes tecnicos

- **Stats**: queries ao Supabase com `count` para atendimentos da semana e mes filtrados por `employee_id = user.id`
- **Sessoes por paciente**: query agrupada `schedules.select('client_id').eq('status','completed').eq('employee_id', user.id)` contando por client_id
- **Email profissional**: buscar `email` de `profiles` onde `user_id = employee_id` selecionado. O campo `email` ja existe na tabela profiles
- **Template profissional**: reutilizar o HTML existente trocando saudacao e contexto

