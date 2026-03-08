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

const SCHEDULE_URL = "https://www.sistemafundacaodombosco.org/schedule";
const LOGO_URL = "https://fundacaodombosco.org/wp-content/uploads/elementor/thumbs/logo-saude-cor_fundacao_dom_bosco_acolher_capacitar_assistencia_social_educacao_saude_criancas_adolescentes_inclusao_reabilitacao_belo_horizonte-qu213x2bru42zepyl57mrub7z9j2wqtwrnty2vwul8.png";

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
  professionalEmail?: string;
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

const getMonthName = (month: string) => {
  const months = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[parseInt(month)] || '';
};

const buildSessionsTable = (
  sessions: Array<{ date: string; time: string; sessionNumber: number }>,
  color: string
) => {
  if (!sessions || sessions.length <= 1) return '';
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 12px; padding: 20px;">
          <p style="color: #1e40af; font-size: 14px; font-weight: 700; margin: 0 0 14px 0; letter-spacing: 0.3px;">
            📋 ${sessions.length} SESSÕES AGENDADAS
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${sessions.map(s => `
              <tr>
                <td style="padding: 8px 12px; background: white; border-radius: 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width: 36px; color: ${color}; font-weight: 700; font-size: 14px;">#${s.sessionNumber}</td>
                      <td style="color: #334155; font-size: 13px; font-weight: 500;">${s.date}</td>
                      <td style="color: #64748b; font-size: 13px; text-align: right;">${s.time}h</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="height: 6px;"></td></tr>
            `).join('')}
          </table>
        </td>
      </tr>
    </table>
  `;
};

const buildDateBlock = (appointmentDate: string, color: string) => {
  const day = appointmentDate.split('/')[0];
  const monthName = getMonthName(appointmentDate.split('/')[1]);
  const year = appointmentDate.split('/')[2] || '';
  return `
    <td style="width: 80px; vertical-align: top;">
      <table cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${color}, ${color}cc); border-radius: 14px; width: 76px; text-align: center; box-shadow: 0 4px 12px ${color}30;">
        <tr><td style="padding: 14px 8px 4px;">
          <span style="color: white; font-size: 28px; font-weight: 800; line-height: 1;">${day}</span>
        </td></tr>
        <tr><td style="padding: 0 8px 4px;">
          <span style="color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600; text-transform: uppercase;">${monthName}</span>
        </td></tr>
        <tr><td style="padding: 0 8px 12px;">
          <span style="color: rgba(255,255,255,0.7); font-size: 11px;">${year}</span>
        </td></tr>
      </table>
    </td>
  `;
};

const buildNotesBlock = (notes?: string) => {
  if (!notes) return '';
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 12px 12px 0;">
          <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
            <strong>📝 Observações:</strong><br/>${notes}
          </p>
        </td>
      </tr>
    </table>
  `;
};

const buildEmailShell = (
  unitInfo: { name: string; color: string },
  bodyContent: string,
  badgeText?: string
) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${unitInfo.color}, ${unitInfo.color}cc); border-radius: 20px 20px 0 0; padding: 32px 28px; text-align: center;">
                  <img src="${LOGO_URL}" alt="Fundação Dom Bosco" style="max-width: 140px; height: auto; margin-bottom: 12px;" />
                  <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 0; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">${unitInfo.name}</p>
                </td>
              </tr>
              ${badgeText ? `
              <tr>
                <td style="background: #ffffff; padding: 0; text-align: center;">
                  <table cellpadding="0" cellspacing="0" style="margin: -16px auto 0;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #059669, #10b981); color: white; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 24px; border-radius: 20px; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
                        ${badgeText}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ''}
              <!-- Body -->
              <tr>
                <td style="background: #ffffff; padding: ${badgeText ? '20px' : '36px'} 32px 36px;">
                  ${bodyContent}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background: #f8fafc; border-radius: 0 0 20px 20px; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px 0; letter-spacing: 0.5px;">
                    FUNDAÇÃO DOM BOSCO · SAÚDE
                  </p>
                  <p style="color: #cbd5e1; font-size: 10px; margin: 0;">
                    Este é um e-mail automático · Não responda esta mensagem
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

// ─── E-mail para o PACIENTE ────────────────────────────────────────────
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
  const bodyContent = `
    <p style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 6px 0;">
      Olá, ${clientName}! 👋
    </p>
    <p style="color: #64748b; font-size: 15px; margin: 0 0 28px 0; line-height: 1.5;">
      ${sessions && sessions.length > 1 
        ? `Você tem <strong>${sessions.length} sessões</strong> agendadas.`
        : 'Seu atendimento está <strong>confirmado</strong>. Confira os detalhes abaixo:'}
    </p>
    
    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="border: 2px solid ${unitInfo.color}20; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height: 4px; background: linear-gradient(90deg, ${unitInfo.color}, ${unitInfo.color}88);"></td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px;">
            <tr>
              ${buildDateBlock(appointmentDate, unitInfo.color)}
              <td style="vertical-align: top; padding-left: 20px;">
                <p style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 4px 0;">⏰ ${appointmentTime}h</p>
                <p style="color: ${unitInfo.color}; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">${appointmentType}</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0; color: #475569; font-size: 13px;">👨‍⚕️&nbsp;&nbsp;<strong>${professionalName}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #475569; font-size: 13px;">📍&nbsp;&nbsp;${unitInfo.address}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${buildSessionsTable(sessions || [], unitInfo.color)}
    ${buildNotesBlock(notes)}

    <!-- Lembrete -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 12px; padding: 16px 20px; text-align: center;">
          <p style="color: #0369a1; font-size: 14px; margin: 0; font-weight: 600;">
            ⏰ Chegue com <strong>10 minutos</strong> de antecedência
          </p>
        </td>
      </tr>
    </table>
  `;

  return buildEmailShell(unitInfo, bodyContent);
};

// ─── E-mail para o PROFISSIONAL ────────────────────────────────────────
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
  const bodyContent = `
    <p style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 6px 0;">
      Olá, ${professionalName}! 👋
    </p>
    <p style="color: #64748b; font-size: 15px; margin: 0 0 28px 0; line-height: 1.5;">
      ${sessions && sessions.length > 1 
        ? `Você tem <strong>${sessions.length} novos atendimentos</strong> agendados.`
        : 'Você tem um <strong>novo atendimento</strong> agendado. Confira os detalhes:'}
    </p>
    
    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="border: 2px solid ${unitInfo.color}20; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height: 4px; background: linear-gradient(90deg, ${unitInfo.color}, ${unitInfo.color}88);"></td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px;">
            <tr>
              ${buildDateBlock(appointmentDate, unitInfo.color)}
              <td style="vertical-align: top; padding-left: 20px;">
                <p style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 4px 0;">⏰ ${appointmentTime}h</p>
                <p style="color: ${unitInfo.color}; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">${appointmentType}</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 5px 0; color: #475569; font-size: 13px;">👤&nbsp;&nbsp;Paciente: <strong>${clientName}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #475569; font-size: 13px;">📍&nbsp;&nbsp;${unitInfo.address}</td>
                  </tr>
                  ${scheduledByName ? `
                  <tr>
                    <td style="padding: 5px 0; color: #475569; font-size: 13px;">🗓️&nbsp;&nbsp;Agendado por: <strong>${scheduledByName}</strong></td>
                  </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${buildSessionsTable(sessions || [], unitInfo.color)}
    ${buildNotesBlock(notes)}

    <!-- Botão Ver Agenda -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0;">
          <a href="${SCHEDULE_URL}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, ${unitInfo.color}, ${unitInfo.color}cc); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 44px; border-radius: 12px; box-shadow: 0 4px 16px ${unitInfo.color}40; letter-spacing: 0.3px;">
            📅&nbsp;&nbsp;Ver Minha Agenda
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 8px 0 0;">
          <a href="${SCHEDULE_URL}" target="_blank" style="color: #94a3b8; font-size: 11px; text-decoration: none;">
            sistemafundacaodombosco.org/schedule
          </a>
        </td>
      </tr>
    </table>
  `;

  return buildEmailShell(unitInfo, bodyContent, '🔔 NOVO ATENDIMENTO');
};

// ─── Handler ───────────────────────────────────────────────────────────
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
      professionalEmail,
      scheduledByName
    }: AppointmentEmailRequest = await req.json();

    console.log("Enviando email de lembrete para:", clientEmail);

    const unitInfo = getUnitInfo(unit);

    // Registrar envio
    if (scheduleIds.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ email_sent_at: new Date().toISOString() })
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

    // E-mail para o profissional
    if (professionalEmail) {
      console.log("Enviando email para profissional:", professionalEmail);

      const professionalEmailHtml = buildProfessionalEmailHtml(
        professionalName, clientName, appointmentDate, appointmentTime,
        appointmentType, unitInfo, notes, sessions, scheduledByName
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
      } else {
        console.log("Email do profissional enviado com sucesso:", profData);
      }
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);