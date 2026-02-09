import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// System prompt dinâmico baseado no cargo
const buildSystemPrompt = (role: string, userName: string, unit: string) => {
  const baseContext = `Você é o assistente virtual da Fundação Dom Bosco, uma clínica neuropsicológica com unidades Madre Germana e Floresta.
Você está conversando com ${userName} (cargo: ${role}, unidade: ${unit || 'não definida'}).
Responda sempre em português brasileiro, de forma clara e objetiva.
Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

REGRAS IMPORTANTES:
- Você é um assistente informativo. Ajude o usuário a entender como usar o sistema.
- Oriente sobre processos, explique funcionalidades e tire dúvidas.
- Não execute ações diretamente no banco de dados.
- Se o usuário pedir algo fora das permissões do cargo, explique educadamente que ele não tem acesso.
- Use formatação markdown para organizar suas respostas.`;

  const rolePermissions: Record<string, string> = {
    receptionist: `
PERMISSÕES DO CARGO - RECEPCIONISTA:
- ✅ Buscar e cadastrar pacientes
- ✅ Agendar consultas e sessões
- ✅ Confirmar presença de pacientes
- ✅ Visualizar agenda do dia
- ✅ Enviar mensagens internas
- ❌ Não pode acessar prontuários clínicos
- ❌ Não pode acessar dados financeiros
- ❌ Não pode gerenciar funcionários`,

    psychologist: `
PERMISSÕES DO CARGO - PROFISSIONAL (PSICÓLOGO):
- ✅ Ver seus pacientes atribuídos
- ✅ Consultar e criar prontuários dos seus pacientes
- ✅ Agendar sessões
- ✅ Registrar atendimentos
- ✅ Aplicar testes neuropsicológicos
- ✅ Criar anamneses
- ❌ Não pode acessar pacientes de outros profissionais
- ❌ Não pode acessar dados financeiros`,

    psychopedagogue: `
PERMISSÕES DO CARGO - PROFISSIONAL (PSICOPEDAGOGO):
- ✅ Ver seus pacientes atribuídos
- ✅ Consultar e criar prontuários dos seus pacientes
- ✅ Agendar sessões
- ✅ Registrar atendimentos
- ❌ Não pode acessar pacientes de outros profissionais
- ❌ Não pode acessar dados financeiros`,

    coordinator_madre: `
PERMISSÕES DO CARGO - COORDENADOR (MADRE GERMANA):
- ✅ Tudo que o profissional pode
- ✅ Ver equipe da unidade Madre Germana
- ✅ Relatórios da unidade
- ✅ Validar atendimentos
- ✅ Controle de devolutivas
- ❌ Acesso limitado à unidade Madre Germana`,

    coordinator_floresta: `
PERMISSÕES DO CARGO - COORDENADOR (FLORESTA):
- ✅ Tudo que o profissional pode
- ✅ Ver equipe da unidade Floresta
- ✅ Relatórios da unidade
- ✅ Validar atendimentos
- ✅ Controle de devolutivas
- ✅ Contratos
- ❌ Acesso limitado à unidade Floresta`,

    director: `
PERMISSÕES DO CARGO - DIRETORIA:
- ✅ Acesso total a todas as funcionalidades
- ✅ Gestão de todas as unidades
- ✅ Financeiro completo
- ✅ Gestão de funcionários
- ✅ Relatórios gerais
- ✅ Contratos
- ✅ Configurações do sistema`,

    financial: `
PERMISSÕES DO CARGO - FINANCEIRO:
- ✅ Consultar lançamentos financeiros
- ✅ Criar lançamentos financeiros
- ✅ Relatórios financeiros
- ❌ Não pode acessar prontuários clínicos
- ❌ Não pode gerenciar funcionários`,
  };

  const permissions = rolePermissions[role] || rolePermissions['receptionist'] || '';

  return `${baseContext}\n${permissions}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, role, userName, unit } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(role || 'receptionist', userName || 'Usuário', unit || '');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos no workspace do Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
