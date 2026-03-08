

## Modulo Fila de Espera -- Plano de Implementacao

### Objetivo
Criar um modulo completo de Fila de Espera para gerenciar pacientes aguardando vaga, com priorizacao por urgencia e notificacao automatica quando uma vaga abrir (cancelamento de agendamento).

---

### 1. Banco de Dados (Migration)

Criar tabela `waiting_list`:

```sql
CREATE TABLE public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  -- Para pacientes nao cadastrados:
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  -- Detalhes clinicos:
  service_type TEXT NOT NULL, -- tipo de atendimento desejado
  preferred_professional UUID REFERENCES auth.users(id),
  preferred_unit TEXT, -- madre, floresta, atendimento_floresta
  preferred_days TEXT[], -- dias preferidos
  preferred_shift TEXT, -- manha, tarde, integral
  priority TEXT NOT NULL DEFAULT 'normal', -- urgente, alta, normal, baixa
  -- Status e controle:
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, contacted, scheduled, cancelled
  notes TEXT,
  reason TEXT, -- motivo da espera
  -- Notificacao:
  notified_at TIMESTAMPTZ,
  notified_by UUID,
  scheduled_at TIMESTAMPTZ, -- quando foi agendado
  -- Auditoria:
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  position_order INTEGER DEFAULT 0
);

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- RLS: diretores, coordenadores e recepcionistas podem gerenciar
CREATE POLICY "Managers can manage waiting list"
  ON public.waiting_list FOR ALL TO authenticated
  USING (
    public.user_has_any_role(ARRAY['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist']::employee_role[])
  )
  WITH CHECK (
    public.user_has_any_role(ARRAY['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta', 'receptionist']::employee_role[])
  );

-- Profissionais podem ver a fila
CREATE POLICY "Professionals can view waiting list"
  ON public.waiting_list FOR SELECT TO authenticated
  USING (true);
```

Adicionar permissao `view_waiting_list` e `manage_waiting_list` ao enum `permission_action`.

---

### 2. Pagina `src/pages/WaitingList.tsx`

Interface com:
- **Tabela principal**: lista de pacientes na fila, ordenada por prioridade e data de entrada
- **Badges coloridos de prioridade**: Urgente (vermelho), Alta (laranja), Normal (azul), Baixa (cinza)
- **Filtros**: por status, prioridade, unidade, tipo de servico
- **Dialog de cadastro**: formulario para adicionar paciente a fila (busca de paciente existente ou cadastro manual)
- **Acoes rapidas**: Contatar, Agendar, Cancelar, Editar
- **Indicador de tempo na fila**: calculo automatico de dias aguardando
- **Estatisticas no topo**: total na fila, urgentes, tempo medio de espera

---

### 3. Notificacao Automatica ao Cancelar Agendamento

Modificar o fluxo de cancelamento de agendamento (`CancelAppointmentDialog.tsx` / `DeleteAppointmentDialog.tsx`):
- Ao cancelar um agendamento, verificar se ha pacientes na fila de espera para o mesmo tipo de servico/profissional/unidade
- Se houver, criar uma `appointment_notification` para coordenadores/recepcionistas avisando que ha vaga disponivel
- Exibir um dialog sugerindo os pacientes da fila que poderiam preencher a vaga

---

### 4. Integracao na Navegacao

- Adicionar item "Fila de Espera" no sidebar sob a categoria "GESTAO CLINICA" com icone `Archive` ou `ClipboardList`
- Rota `/waiting-list` no `MainApp.tsx`
- Acesso para diretores, coordenadores e recepcionistas

---

### 5. Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar tabela `waiting_list` + RLS |
| `src/pages/WaitingList.tsx` | Criar pagina completa |
| `src/components/MainApp.tsx` | Adicionar rota `/waiting-list` |
| `src/components/layout/AppSidebar.tsx` | Adicionar menu item |
| `src/components/CancelAppointmentDialog.tsx` | Integrar verificacao de fila |

---

### Detalhes Tecnicos

- Usar `supabase.from('waiting_list')` para CRUD
- Ordenacao: prioridade (urgente primeiro) + `created_at` (mais antigo primeiro)
- Notificacao via tabela `appointment_notifications` existente
- Pattern visual seguindo o mesmo estilo das paginas existentes (Cards, Tables, Badges, Dialogs)

