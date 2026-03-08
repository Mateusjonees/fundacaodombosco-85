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
  scheduleIds?: string[];
  sessions?: Array<{
    date: string;
    time: string;
    sessionNumber: number;
  }>;
  // Novo campo para e-mail do profissional
  professionalEmail?: string;
  // Nome de quem agendou (recepcionista/coordenador)
  scheduledByName?: string;
}

const getUnitInfo = (unit: string) => {
  switch (unit) {
    case 'madre':
      return { 
        name: 'Clínica Social Madre Clélia', 
        color: '#3b82f6',
        address: 'Rua Jaime Salse, 280 - Madre Gertrudes, Belo Horizonte - MG'
      };
    case 'floresta':
      return { 
        name: 'Neuroavaliação Floresta', 
        color: '#10b981',
        address: 'R. Urucuia, 18 - Floresta, Belo Horizonte - MG, 30150-060'
      };
    case 'atendimento_floresta':
      return { 
        name: 'Atendimento Floresta', 
        color: '#8b5cf6',
        address: 'R. Urucuia, 18 - Floresta, Belo Horizonte - MG, 30150-060'
      };
    default:
      return { 
        name: 'Fundação Dom Bosco', 
        color: '#3b82f6',
        address: 'Rua Jaime Salse, 280 - Madre Gertrudes, Belo Horizonte - MG'
      };
  }
};

const buildClientEmailHtml = (
  clientName: string,
  appointmentDate: string,
  appointmentTime: string,
  professionalName: string,
  appointmentType: string,
  unitInfo: { name: string; color: string; address: string },
  notes?: string,
  sessions?: Array<{ date: string; time: string; sessionNumber: number }>
) => {
  const sessionsHtml = sessions && sessions.length > 1 ? `
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
        📋 Sessões agendadas (${sessions.length} sessões):
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 13px;">
        ${sessions.map(s => `<li style="margin: 4px 0;">Sessão ${s.sessionNumber}: ${s.date} às ${s.time}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; margin: 0; padding: 32px 16px;">
        <div style="max-width: 560px; margin: 0 auto;">
          <div style="background: white; border-radius: 16px 16px 0 0; padding: 28px; text-align: center; border-bottom: 3px solid ${unitInfo.color};">
            <img src="https://fundacaodombosco.org/wp-content/uploads/elementor/thumbs/logo-saude-cor_fundacao_dom_bosco_acolher_capacitar_assistencia_social_educacao_saude_criancas_adolescentes_inclusao_reabilitacao_belo_horizonte-qu213x2bru42zepyl57mrub7z9j2wqtwrnty2vwul8.png" alt="Fundação Dom Bosco" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: white; padding: 32px 28px;">
            <p style="color: #1a202c; font-size: 18px; font-weight: 600; margin: 0 0 4px 0;">
              Olá, ${clientName}! 👋
            </p>
            <p style="color: #718096; font-size: 14px; margin: 0 0 24px 0;">
              ${sessions && sessions.length > 1 
                ? `Você tem ${sessions.length} sessões agendadas na <strong style="color: ${unitInfo.color};">${unitInfo.name}</strong>.`
                : `Seu atendimento está confirmado na <strong style="color: ${unitInfo.color};">${unitInfo.name}</strong>.`}
            </p>
            <div style="background: linear-gradient(135deg, ${unitInfo.color}0A, ${unitInfo.color}15); border: 1px solid ${unitInfo.color}30; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <div style="display: flex; margin-bottom: 16px;">
                <div style="background: ${unitInfo.color}; color: white; border-radius: 10px; padding: 12px 16px; text-align: center; min-width: 64px;">
                  <div style="font-size: 22px; font-weight: 700; line-height: 1;">${appointmentDate.split('/')[0]}</div>
                  <div style="font-size: 11px; text-transform: uppercase; opacity: 0.9; margin-top: 2px;">${['', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][parseInt(appointmentDate.split('/')[1])] || ''}</div>
                </div>
                <div style="margin-left: 16px; display: flex; flex-direction: column; justify-content: center;">
                  <div style="color: #1a202c; font-size: 16px; font-weight: 600;">🕐 ${appointmentTime}h</div>
                  <div style="color: #718096; font-size: 13px; margin-top: 2px;">${appointmentType}</div>
                </div>
              </div>
              <div style="border-top: 1px solid ${unitInfo.color}25; padding-top: 14px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #718096; font-size: 13px; vertical-align: top; width: 32px;">👨‍⚕️</td>
                    <td style="padding: 6px 0; color: #2d3748; font-size: 13px; font-weight: 500;">${professionalName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #718096; font-size: 13px; vertical-align: top;">📍</td>
                    <td style="padding: 6px 0; color: #2d3748; font-size: 13px; font-weight: 500;">${unitInfo.address}</td>
                  </tr>
                </table>
              </div>
            </div>
            ${sessionsHtml}
            ${notes ? `
            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
              <p style="color: #92400e; font-size: 13px; margin: 0;">
                <strong>Observações:</strong> ${notes}
              </p>
            </div>
            ` : ''}
            <div style="background: #f0f4f8; border-radius: 10px; padding: 14px 16px; text-align: center;">
              <p style="color: #4a5568; font-size: 13px; margin: 0;">
                ⏰ Chegue com <strong>10 minutos de antecedência</strong>
              </p>
            </div>
          </div>
          <div style="background: #f7fafc; border-radius: 0 0 16px 16px; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #a0aec0; font-size: 11px; margin: 0;">
              Fundação Dom Bosco · Este é um e-mail automático
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const buildProfessionalEmailHtml = (
  professionalName: string,
  clientName: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentType: string,
  unitInfo: { name: string; color: string; address: string },
  notes?: string,
  sessions?: Array<{ date: string; time: string; sessionNumber: number }>,
  scheduledByName?: string
) => {
  const sessionsHtml = sessions && sessions.length > 1 ? `
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="color: #1e40af; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
        📋 Sessões agendadas (${sessions.length} sessões):
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 13px;">
        ${sessions.map(s => `<li style="margin: 4px 0;">Sessão ${s.sessionNumber}: ${s.date} às ${s.time}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; margin: 0; padding: 32px 16px;">
        <div style="max-width: 560px; margin: 0 auto;">
          <div style="background: white; border-radius: 16px 16px 0 0; padding: 28px; text-align: center; border-bottom: 3px solid ${unitInfo.color};">
            <img src="https://fundacaodombosco.org/wp-content/uploads/elementor/thumbs/logo-saude-cor_fundacao_dom_bosco_acolher_capacitar_assistencia_social_educacao_saude_criancas_adolescentes_inclusao_reabilitacao_belo_horizonte-qu213x2bru42zepyl57mrub7z9j2wqtwrnty2vwul8.png" alt="Fundação Dom Bosco" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: white; padding: 32px 28px;">
            <p style="color: #1a202c; font-size: 18px; font-weight: 600; margin: 0 0 4px 0;">
              Olá, ${professionalName}! 👋
            </p>
            <p style="color: #718096; font-size: 14px; margin: 0 0 24px 0;">
              ${sessions && sessions.length > 1 
                ? `Você tem ${sessions.length} novos atendimentos agendados na <strong style="color: ${unitInfo.color};">${unitInfo.name}</strong>.`
                : `Você tem um novo atendimento agendado na <strong style="color: ${unitInfo.color};">${unitInfo.name}</strong>.`}
            </p>
            <div style="background: linear-gradient(135deg, ${unitInfo.color}0A, ${unitInfo.color}15); border: 1px solid ${unitInfo.color}30; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <div style="display: flex; margin-bottom: 16px;">
                <div style="background: ${unitInfo.color}; color: white; border-radius: 10px; padding: 12px 16px; text-align: center; min-width: 64px;">
                  <div style="font-size: 22px; font-weight: 700; line-height: 1;">${appointmentDate.split('/')[0]}</div>
                  <div style="font-size: 11px; text-transform: uppercase; opacity: 0.9; margin-top: 2px;">${['', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][parseInt(appointmentDate.split('/')[1])] || ''}</div>
                </div>
                <div style="margin-left: 16px; display: flex; flex-direction: column; justify-content: center;">
                  <div style="color: #1a202c; font-size: 16px; font-weight: 600;">🕐 ${appointmentTime}h</div>
                  <div style="color: #718096; font-size: 13px; margin-top: 2px;">${appointmentType}</div>
                </div>
              </div>
              <div style="border-top: 1px solid ${unitInfo.color}25; padding-top: 14px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #718096; font-size: 13px; vertical-align: top; width: 32px;">👤</td>
                    <td style="padding: 6px 0; color: #2d3748; font-size: 13px; font-weight: 500;">Paciente: <strong>${clientName}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #718096; font-size: 13px; vertical-align: top;">📍</td>
                    <td style="padding: 6px 0; color: #2d3748; font-size: 13px; font-weight: 500;">${unitInfo.address}</td>
                  </tr>
                  ${scheduledByName ? `<tr>
                    <td style="padding: 6px 0; color: #718096; font-size: 13px; vertical-align: top;">📝</td>
                    <td style="padding: 6px 0; color: #2d3748; font-size: 13px; font-weight: 500;">Agendado por: <strong>${scheduledByName}</strong></td>
                  </tr>` : ''}
                </table>
              </div>
            </div>
            ${sessionsHtml}
            ${notes ? `
            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
              <p style="color: #92400e; font-size: 13px; margin: 0;">
                <strong>Observações:</strong> ${notes}
              </p>
            </div>
            ` : ''}
          </div>
          <div style="background: #f7fafc; border-radius: 0 0 16px 16px; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #a0aec0; font-size: 11px; margin: 0;">
              Fundação Dom Bosco · Este é um e-mail automático
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
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
      sessions = [],
      professionalEmail
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

    // E-mail para o paciente
    const clientEmailHtml = buildClientEmailHtml(
      clientName, appointmentDate, appointmentTime,
      professionalName, appointmentType, unitInfo, notes, sessions
    );

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [clientEmail],
      subject: sessions.length > 1 
        ? `Lembrete: ${sessions.length} Sessões Agendadas - ${appointmentDate}`
        : `Lembrete de Agendamento - ${appointmentDate} às ${appointmentTime}`,
      html: clientEmailHtml,
    });

    if (error) {
      console.error("Erro ao enviar email para paciente:", error);
      throw error;
    }

    console.log("Email do paciente enviado com sucesso:", data);

    // E-mail para o profissional (se professionalEmail fornecido)
    if (professionalEmail) {
      console.log("Enviando email para profissional:", professionalEmail);

      const professionalEmailHtml = buildProfessionalEmailHtml(
        professionalName, clientName, appointmentDate, appointmentTime,
        appointmentType, unitInfo, notes, sessions
      );

      const { data: profData, error: profError } = await resend.emails.send({
        from: fromEmail,
        to: [professionalEmail],
        subject: sessions.length > 1
          ? `Novo Agendamento: ${sessions.length} sessões com ${clientName}`
          : `Novo Agendamento: ${clientName} - ${appointmentDate} às ${appointmentTime}`,
        html: professionalEmailHtml,
      });

      if (profError) {
        console.error("Erro ao enviar email para profissional:", profError);
        // Não faz throw — o e-mail do paciente já foi enviado
      } else {
        console.log("Email do profissional enviado com sucesso:", profData);
      }
    }

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
