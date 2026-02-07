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

interface AppointmentEmailRequest {
  clientEmail: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  professionalName: string;
  appointmentType: string;
  notes?: string;
  unit?: string;
  // Novos campos para confirmação
  scheduleIds?: string[];
  sessions?: Array<{
    date: string;
    time: string;
    sessionNumber: number;
  }>;
}

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientEmail, 
      clientName, 
      appointmentDate, 
      appointmentTime,
      professionalName,
      appointmentType,
      notes,
      unit = 'madre',
      scheduleIds = [],
      sessions = []
    }: AppointmentEmailRequest = await req.json();

    console.log("Enviando email de lembrete para:", clientEmail);

    const unitInfo = getUnitInfo(unit);

    // Registrar que o email foi enviado
    if (scheduleIds.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ 
          email_sent_at: new Date().toISOString()
        })
        .in('id', scheduleIds);

      if (updateError) {
        console.error("Erro ao registrar envio:", updateError);
      }
    }

    // Gerar lista de sessões para o e-mail
    const sessionsHtml = sessions.length > 1 ? `
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
          📋 Sessões agendadas (${sessions.length} sessões):
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 13px;">
          ${sessions.map(s => `<li style="margin: 4px 0;">Sessão ${s.sessionNumber}: ${s.date} às ${s.time}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    // E-mail é apenas lembrete, sem botões de confirmação

    const emailHtml = `
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
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                📅 Lembrete de Agendamento
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
                ${sessions.length > 1 
                  ? `Você tem ${sessions.length} sessões agendadas. Confira os detalhes abaixo:`
                  : 'Seu atendimento foi agendado. Confira os detalhes abaixo:'}
              </p>
              
              <!-- Appointment Details Card -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📅 ${sessions.length > 1 ? 'Primeira sessão:' : 'Data:'}</td>
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
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${appointmentType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📍 Local:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${unitInfo.address}</td>
                  </tr>
                </table>
              </div>
              
              ${sessionsHtml}
              
              ${notes ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="color: #92400e; font-size: 13px; margin: 0;">
                  <strong>📝 Observações:</strong><br>
                  ${notes}
                </p>
              </div>
              ` : ''}
              
              
              
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

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [clientEmail],
      subject: sessions.length > 1 
        ? `Lembrete: ${sessions.length} Sessões Agendadas - ${appointmentDate}`
        : `Lembrete de Agendamento - ${appointmentDate} às ${appointmentTime}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Erro ao enviar email:", error);
      throw error;
    }

    console.log("Email enviado com sucesso:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-email function:", error);
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
