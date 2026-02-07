

# Implementacao Completa - 9 Modulos Novos

Este plano cobre a implementacao dos itens 1 a 9 do roadmap, excluindo notificacoes WhatsApp (item 10).

---

## Resumo dos Modulos

| # | Modulo | Descricao |
|---|--------|-----------|
| 1 | Fila de Espera | Gestao de pacientes aguardando vaga por especialidade e unidade |
| 2 | Controle de Faltas | Dashboard de comparecimento e alertas automaticos |
| 3 | Plano Terapeutico (PTI/PEI) | Cadastro de objetivos, progresso por sessao, graficos de evolucao |
| 4 | Termos de Consentimento Digital | Modelos configuraveis com assinatura touch |
| 5 | Encaminhamentos Internos | Fluxo de encaminhamento entre profissionais |
| 6 | Teleconsulta / Sala Virtual | Link de videochamada integrado a agenda |
| 7 | Painel de KPIs | Metricas avancadas de gestao clinica |
| 8 | Auditoria Visual | Interface para visualizar logs de auditoria existentes |
| 9 | Portal do Paciente | Link publico para paciente ver agendamentos |

---

## Etapa 1 - Banco de Dados (Migracoes SQL)

Criacao de 8 novas tabelas no Supabase com RLS habilitado:

### Tabelas

**wait_list** - Fila de espera
- id (uuid PK), client_id (FK clients), specialty (text), unit (text), priority (text: normal/urgent/high), status (text: waiting/called/cancelled), notes (text), position (int), created_at, updated_at, created_by (uuid)

**absence_records** - Registro de faltas
- id (uuid PK), client_id (FK clients), schedule_id (FK schedules), absence_date (date), was_notified (bool), consecutive_count (int), created_at

**therapeutic_plans** - Planos terapeuticos
- id (uuid PK), client_id (FK clients), professional_id (uuid), title (text), objectives (jsonb), status (text: active/completed/paused), start_date (date), end_date (date), created_at, updated_at

**therapeutic_progress** - Progresso dos planos
- id (uuid PK), plan_id (FK therapeutic_plans), session_date (date), progress_value (int 1-100), notes (text), recorded_by (uuid), created_at

**consent_templates** - Modelos de termos
- id (uuid PK), title (text), content (text), category (text), is_active (bool), created_by (uuid), created_at

**consent_records** - Termos assinados
- id (uuid PK), client_id (FK clients), template_id (FK consent_templates), signature_data (text - base64 canvas), signed_at (timestamptz), ip_address (text), user_agent (text), witness_name (text), created_by (uuid)

**internal_referrals** - Encaminhamentos
- id (uuid PK), client_id (FK clients), from_professional (uuid), to_professional (uuid), reason (text), status (text: pending/accepted/in_progress/completed/rejected), notes (text), response_notes (text), created_at, updated_at

**patient_portal_tokens** - Tokens para portal do paciente
- id (uuid PK), client_id (FK clients), token (text unique), expires_at (timestamptz), is_active (bool), created_by (uuid), created_at

Todas as tabelas terao RLS habilitado com politicas para usuarios autenticados.

---

## Etapa 2 - Paginas e Componentes

### Novas paginas (src/pages/)

1. **WaitList.tsx** - Tabela com filtros por unidade/especialidade/prioridade, botoes para adicionar, chamar e cancelar pacientes
2. **AbsenceControl.tsx** - Dashboard com cards de estatisticas, tabela de faltas, filtros por periodo e paciente, alertas visuais para 2+ faltas consecutivas
3. **TherapeuticPlans.tsx** - Lista de planos por paciente, formulario de criacao com objetivos, registro de progresso com slider, grafico de evolucao com Recharts
4. **ConsentTerms.tsx** - Gestao de modelos + area de assinatura. Canvas touch para celular usando HTML5 Canvas
5. **InternalReferrals.tsx** - Lista de encaminhamentos com status, formulario de criacao com selecao de profissional destino, fluxo de aceitar/rejeitar
6. **Teleconsulta.tsx** - Nao sera uma pagina separada. Sera um campo novo na agenda (is_online + meeting_link) com geracao automatica de link
7. **ClinicalKPIs.tsx** - Dashboard com graficos Recharts: taxa de ocupacao, tempo medio na fila, taxa de cancelamento, receita por profissional
8. **AuditLogs.tsx** - Tabela paginada dos audit_logs existentes com filtros por usuario, tipo de acao e periodo
9. **PatientPortal.tsx** - Pagina publica (sem login) que recebe token na URL e mostra proximos agendamentos do paciente

### Novos componentes auxiliares

- **SignatureCanvas.tsx** - Canvas HTML5 para assinatura touch (mobile-first)
- **ProgressChart.tsx** - Grafico de evolucao terapeutica com Recharts
- **AbsenceAlert.tsx** - Alerta visual de faltas consecutivas
- **ReferralStatusBadge.tsx** - Badge colorido por status do encaminhamento
- **WaitListPositionBadge.tsx** - Indicador visual de posicao na fila

---

## Etapa 3 - Rotas e Navegacao

### Novas rotas em MainApp.tsx

```text
/wait-list          -> WaitList (coordenadores e diretores)
/absence-control    -> AbsenceControl (coordenadores e diretores)
/therapeutic-plans  -> TherapeuticPlans (profissionais e coordenadores)
/consent-terms      -> ConsentTerms (coordenadores e diretores)
/referrals          -> InternalReferrals (profissionais)
/kpis               -> ClinicalKPIs (diretores)
/audit-logs         -> AuditLogs (diretores)
/patient-portal/:token -> PatientPortal (publico, sem autenticacao)
```

### Novos itens no sidebar (AppSidebar.tsx)

- **GESTAO CLINICA**: Fila de Espera, Controle de Faltas, Planos Terapeuticos, Termos de Consentimento, Encaminhamentos
- **RELATORIOS**: Indicadores Clinicos (KPIs)
- **EQUIPE**: Auditoria (somente diretores)

---

## Etapa 4 - Teleconsulta (campo na agenda)

Adicionar colunas na tabela `schedules`:
- `is_online` (bool default false)
- `meeting_link` (text nullable)

Na interface da agenda, adicionar toggle "Consulta Online" que gera link automatico (UUID-based) e permite copiar/enviar.

---

## Etapa 5 - Portal do Paciente (Edge Function)

Criar edge function `patient-portal` que:
- Recebe token via query param
- Valida token e expiracao
- Retorna agendamentos futuros do paciente (sem autenticacao)

A pagina PatientPortal.tsx sera acessivel sem login via rota publica.

---

## Detalhes Tecnicos

### Permissoes por modulo

| Modulo | Quem acessa |
|--------|-------------|
| Fila de Espera | Diretores, Coordenadores, Recepcionistas |
| Controle de Faltas | Diretores, Coordenadores |
| PTI/PEI | Diretores, Coordenadores, Profissionais |
| Termos de Consentimento | Diretores, Coordenadores |
| Encaminhamentos | Todos os profissionais |
| Teleconsulta | Profissionais (toggle na agenda) |
| KPIs | Diretores |
| Auditoria | Diretores |
| Portal do Paciente | Publico (via token) |

### Padrao de implementacao

Cada modulo seguira o padrao existente:
- Hook customizado com `useQuery`/`useMutation` do TanStack
- Componente de pagina com lazy loading
- Toast para feedback de acoes
- Layout responsivo mobile-first com Tailwind
- Integracao com audit_logs para rastreabilidade

### Ordem de implementacao

Devido ao volume, a implementacao sera feita em blocos:
1. Migracoes SQL (todas as tabelas de uma vez)
2. Fila de Espera + Controle de Faltas (gestao operacional)
3. PTI/PEI + Termos de Consentimento (valor clinico)
4. Encaminhamentos + Teleconsulta (fluxo entre equipe)
5. KPIs + Auditoria + Portal do Paciente (gestao e acesso externo)

### Arquivos criados/modificados

**Novos arquivos (~20):**
- 8 paginas em src/pages/
- 5 componentes auxiliares em src/components/
- 1 edge function em supabase/functions/patient-portal/

**Arquivos modificados:**
- src/components/MainApp.tsx (novas rotas)
- src/components/layout/AppSidebar.tsx (novos itens no menu)
- src/hooks/useRolePermissions.ts (novas permissoes)
- Migracao SQL para criar tabelas

