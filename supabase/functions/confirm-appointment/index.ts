import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = "https://vqphtzkdhfzdwbumexhe.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action") || "confirm"; // confirm ou decline

    if (!token) {
      return new Response(
        generateHtmlPage("Erro", "Token de confirmação não fornecido.", "error"),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    console.log("Processando ação para token:", token, "| Ação:", action);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Função para obter endereço baseado na unidade
    const getAddressByUnit = (unit: string | null): string => {
      if (unit === 'madre') {
        return 'Rua Jaime Salse, 280 - Madre Gertrudes';
      }
      // Floresta, atendimento_floresta, neuro e outros
      return 'Rua Urucuia, 18 - Floresta';
    };

    // Buscar agendamento pelo token
    const { data: schedule, error: fetchError } = await supabase
      .from("schedules")
      .select("id, client_id, patient_confirmed, patient_declined, start_time, unit, clients(name)")
      .eq("confirmation_token", token)
      .single();

    if (fetchError || !schedule) {
      console.error("Token inválido ou não encontrado:", fetchError);
      return new Response(
        generateHtmlPage(
          "Token Inválido",
          "O link de confirmação é inválido ou já foi utilizado.",
          "error"
        ),
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    const clientName = (schedule.clients as any)?.name || "Paciente";
    const address = getAddressByUnit(schedule.unit);
    const appointmentDate = new Date(schedule.start_time).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const appointmentTime = new Date(schedule.start_time).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Processar ação de RECUSA
    if (action === "decline") {
      // Verificar se já foi processado
      if (schedule.patient_declined) {
        return new Response(
          generateHtmlPage(
            "Já Registrado",
            "Já recebemos sua resposta anteriormente. Entraremos em contato para reagendar.",
            "info"
          ),
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
          }
        );
      }

      // Atualizar agendamento como recusado
      const { error: updateError } = await supabase
        .from("schedules")
        .update({
          patient_declined: true,
          patient_declined_at: new Date().toISOString(),
          patient_confirmed: false,
          notes: schedule.notes 
            ? `${schedule.notes} | ⚠️ Paciente informou que não poderá comparecer (via e-mail)`
            : "⚠️ Paciente informou que não poderá comparecer (via e-mail)"
        })
        .eq("id", schedule.id);

      if (updateError) {
        console.error("Erro ao atualizar agendamento:", updateError);
        throw updateError;
      }

      console.log("Recusa processada com sucesso para agendamento:", schedule.id);

      return new Response(
        generateHtmlPage(
          "Recebemos sua resposta",
          `Obrigado por nos avisar, ${clientName}! Entraremos em contato para reagendar seu atendimento que estava marcado para ${appointmentDate} às ${appointmentTime}.<br><br>📍 <strong>Local:</strong> ${address}`,
          "warning"
        ),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    // Processar ação de CONFIRMAÇÃO (comportamento padrão)
    // Verificar se já foi confirmado
    if (schedule.patient_confirmed) {
      return new Response(
        generateHtmlPage(
          "Já Confirmado",
          "Sua presença já foi confirmada anteriormente. Obrigado!",
          "info"
        ),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    // Atualizar agendamento como confirmado
    const { error: updateError } = await supabase
      .from("schedules")
      .update({
        patient_confirmed: true,
        patient_confirmed_at: new Date().toISOString(),
        patient_declined: false,
      })
      .eq("id", schedule.id);

    if (updateError) {
      console.error("Erro ao atualizar agendamento:", updateError);
      throw updateError;
    }

    console.log("Confirmação processada com sucesso para agendamento:", schedule.id);

    return new Response(
      generateHtmlPage(
        "Presença Confirmada!",
        `Obrigado, ${clientName}! Sua presença foi confirmada para o dia ${appointmentDate} às ${appointmentTime}.<br><br>📍 <strong>Local:</strong> ${address}<br><br>Até lá!`,
        "success"
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro ao processar confirmação:", error);
    return new Response(
      generateHtmlPage(
        "Erro",
        "Ocorreu um erro ao processar sua resposta. Por favor, tente novamente mais tarde.",
        "error"
      ),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      }
    );
  }
};

function generateHtmlPage(title: string, message: string, type: "success" | "error" | "info" | "warning"): string {
  const colors = {
    success: { bg: "#10b981", icon: "✅" },
    error: { bg: "#ef4444", icon: "❌" },
    info: { bg: "#3b82f6", icon: "ℹ️" },
    warning: { bg: "#f59e0b", icon: "📞" },
  };

  const { bg, icon } = colors[type];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Fundação Dom Bosco</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
      text-align: center;
    }
    .header {
      background: ${bg};
      padding: 40px 24px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .header h1 {
      color: white;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 32px;
    }
    .message {
      color: #374151;
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .footer {
      padding: 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 14px;
    }
    .logo {
      font-weight: 700;
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${icon}</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p class="message">${message}</p>
    </div>
    <div class="footer">
      <p><span class="logo">Fundação Dom Bosco</span></p>
      <p style="margin-top: 8px;">Cuidando de você com carinho</p>
    </div>
  </div>
</body>
</html>
  `;
}

serve(handler);
