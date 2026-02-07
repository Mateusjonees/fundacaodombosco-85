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

interface MeetingEmailRequest {
  participantIds: string[];
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  meetingRoom: string;
  meetingMessage: string;
  virtualLink?: string;
  createdByName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      participantIds,
      meetingTitle,
      meetingDate,
      meetingTime,
      meetingLocation,
      meetingRoom,
      meetingMessage,
      virtualLink,
      createdByName,
    }: MeetingEmailRequest = await req.json();

    console.log("Enviando e-mail de reunião para", participantIds.length, "participantes");

    if (!participantIds || participantIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum participante informado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Buscar e-mails dos participantes
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, email')
      .in('user_id', participantIds);

    if (profilesError) {
      console.error("Erro ao buscar perfis:", profilesError);
      throw profilesError;
    }

    // Buscar e-mails do auth.users para os que não têm email no profiles
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Erro ao buscar usuários auth:", authError);
      throw authError;
    }

    const emailMap = new Map<string, { email: string; name: string }>();
    
    // Mapear perfis
    for (const profile of (profiles || [])) {
      if (profile.email) {
        emailMap.set(profile.user_id, { email: profile.email, name: profile.name || 'Colaborador' });
      }
    }

    // Completar com auth.users
    for (const userId of participantIds) {
      if (!emailMap.has(userId)) {
        const authUser = authUsers.users.find(u => u.id === userId);
        if (authUser?.email) {
          const profileName = profiles?.find(p => p.user_id === userId)?.name || 'Colaborador';
          emailMap.set(userId, { email: authUser.email, name: profileName });
        }
      }
    }

    const recipients = Array.from(emailMap.values());
    console.log(`Encontrados ${recipients.length} e-mails para envio`);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "Nenhum participante com e-mail cadastrado" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const virtualLinkHtml = virtualLink ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🔗 Link Virtual:</td>
        <td style="padding: 8px 0; text-align: right;">
          <a href="${virtualLink}" style="color: #3b82f6; font-size: 14px; font-weight: 600; text-decoration: underline;">${virtualLink}</a>
        </td>
      </tr>
    ` : '';

    // Enviar e-mail para cada participante
    let sentCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
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
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                  📋 Convite para Reunião
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
                  Fundação Dom Bosco
                </p>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                  Olá, <strong>${recipient.name}</strong>!
                </p>
                
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
                  Você foi convidado(a) para uma reunião. Confira os detalhes:
                </p>
                
                <!-- Meeting Details Card -->
                <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <h2 style="color: #111827; font-size: 18px; margin: 0 0 16px 0;">${meetingTitle}</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📅 Data:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${meetingDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🕐 Horário:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${meetingTime}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📍 Local:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${meetingLocation}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🏠 Sala:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${meetingRoom}</td>
                    </tr>
                    ${virtualLinkHtml}
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">👤 Organizado por:</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${createdByName}</td>
                    </tr>
                  </table>
                </div>
                
                ${meetingMessage ? `
                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                  <p style="color: #1e40af; font-size: 13px; margin: 0;">
                    <strong>📝 Mensagem:</strong><br>
                    ${meetingMessage}
                  </p>
                </div>
                ` : ''}
                
                <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="color: #92400e; font-size: 13px; margin: 0;">
                    💡 <strong>Lembrete:</strong> Por favor, confirme sua presença no sistema.
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

      try {
        const { error: sendError } = await resend.emails.send({
          from: fromEmail,
          to: [recipient.email],
          subject: `📋 Reunião: ${meetingTitle} - ${meetingDate} às ${meetingTime}`,
          html: emailHtml,
        });

        if (sendError) {
          console.error(`Erro ao enviar para ${recipient.email}:`, sendError);
          errors.push(`${recipient.name}: ${sendError.message}`);
        } else {
          sentCount++;
          console.log(`E-mail enviado para ${recipient.email}`);
        }
      } catch (err: any) {
        console.error(`Erro ao enviar para ${recipient.email}:`, err);
        errors.push(`${recipient.name}: ${err.message}`);
      }
    }

    console.log(`Enviados: ${sentCount}/${recipients.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        total: recipients.length,
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-meeting-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
