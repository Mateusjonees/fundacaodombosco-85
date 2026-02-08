import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Fundação Dom Bosco <onboarding@resend.dev>";

const supabaseUrl = "https://vqphtzkdhfzdwbumexhe.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const getUnitInfo = (unit: string) => {
  switch (unit) {
    case 'madre':
      return { 
        name: 'Clínica Social Madre Clélia', 
        color: '#3b82f6',
        address: 'Rua Jaime Salse, 280 - Madre Gertrudes'
      };
    case 'floresta':
      return { 
        name: 'Neuroavaliação Floresta', 
        color: '#10b981',
        address: 'Rua Urucuia, 18 - Floresta'
      };
    case 'atendimento_floresta':
      return { 
        name: 'Atendimento Floresta', 
        color: '#8b5cf6',
        address: 'Rua Urucuia, 18 - Floresta'
      };
    default:
      return { 
        name: 'Fundação Dom Bosco', 
        color: '#3b82f6',
        address: 'Rua Jaime Salse, 280 - Madre Gertrudes'
      };
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

const buildReminderEmailHtml = (
  clientName: string,
  appointmentDate: string,
  appointmentTime: string,
  professionalName: string,
  serviceType: string,
  unitInfo: { name: string; color: string; address: string }
) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, ${unitInfo.color}, ${unitInfo.color}dd); padding: 32px; text-align: center;">
        <img src="https://fundacaodombosco-85.lovable.app/lovable-uploads/1e0ba652-7476-47a6-b6a0-0f2c90e306bd.png" alt="Fundação Dom Bosco" style="max-width: 180px; height: auto; margin-bottom: 16px;" />
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
          ⏰ Lembrete: Seu atendimento é amanhã
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
          ${unitInfo.name}
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 32px;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
          Olá, <strong>${clientName}</strong>!
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
          Este é um lembrete automático do seu atendimento agendado para amanhã. Confira os detalhes:
        </p>
        
        <!-- Appointment Details Card -->
        <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📅 Data:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${appointmentDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🕐 Horário:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${appointmentTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">👨‍⚕️ Profissional:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${professionalName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📋 Tipo:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${serviceType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📍 Local:</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${unitInfo.address}</td>
            </tr>
          </table>
        </div>
        
        <!-- Reminder -->
        <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="color: #1e40af; font-size: 13px; margin: 0;">
            💡 <strong>Lembrete:</strong> Por favor, chegue com 10 minutos de antecedência.
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
          Fundação Dom Bosco
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
          Este é um email automático. Por favor, não responda.
        </p>
      </div>
    </div>
  </body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar agendamentos das próximas 24h sem lembrete enviado
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: schedules, error: fetchError } = await supabase
      .from('schedules')
      .select(`
        id,
        start_time,
        end_time,
        title,
        unit,
        client_id,
        employee_id,
        clients!inner (
          id,
          name,
          email
        ),
        profiles:employee_id (
          name
        )
      `)
      .eq('status', 'scheduled')
      .is('reminder_sent_at', null)
      .gte('start_time', now.toISOString())
      .lte('start_time', in24h.toISOString());

    if (fetchError) {
      console.error("Erro ao buscar agendamentos:", fetchError);
      throw fetchError;
    }

    console.log(`Encontrados ${schedules?.length || 0} agendamentos para lembrete`);

    // Filtrar apenas quem tem email
    const schedulesWithEmail = (schedules || []).filter(
      (s: any) => s.clients?.email && s.clients.email.trim() !== ''
    );

    console.log(`${schedulesWithEmail.length} com email válido`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const schedule of schedulesWithEmail) {
      try {
        const client = schedule.clients as any;
        const professional = schedule.profiles as any;
        const unitInfo = getUnitInfo(schedule.unit || 'madre');
        const appointmentDate = formatDate(schedule.start_time);
        const appointmentTime = formatTime(schedule.start_time);
        const professionalName = professional?.name || 'Profissional';

        const emailHtml = buildReminderEmailHtml(
          client.name,
          appointmentDate,
          appointmentTime,
          professionalName,
          schedule.title || 'Consulta',
          unitInfo
        );

        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: [client.email],
          subject: `Lembrete: Seu atendimento é amanhã - ${appointmentTime}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Erro ao enviar para ${client.email}:`, emailError);
          failed++;
          errors.push(`${client.name}: ${emailError.message}`);
          continue;
        }

        // Marcar como lembrete enviado
        const { error: updateError } = await supabase
          .from('schedules')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`Erro ao atualizar reminder_sent_at para ${schedule.id}:`, updateError);
        }

        sent++;
        console.log(`✅ Lembrete enviado para ${client.name} (${client.email})`);
      } catch (err: any) {
        console.error(`Erro inesperado:`, err);
        failed++;
        errors.push(err.message);
      }
    }

    const summary = {
      success: true,
      total_found: schedules?.length || 0,
      with_email: schedulesWithEmail.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      executed_at: new Date().toISOString(),
    };

    console.log("Resumo:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
