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

const buildEmailHtml = (firstName: string, age: number) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fdf2f8; margin: 0; padding: 32px 16px;">
      <div style="max-width: 560px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #f43f5e); border-radius: 16px 16px 0 0; padding: 32px 28px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 8px;">🎂</div>
          <h1 style="color: white; font-size: 24px; font-weight: 700; margin: 0;">Feliz Aniversário!</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">
            ${age} anos de vida para celebrar!
          </p>
        </div>
        <div style="background: white; padding: 32px 28px;">
          <p style="color: #1a202c; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
            Querido(a) ${firstName}, 🎉
          </p>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
            A <strong style="color: #ec4899;">Fundação Dom Bosco</strong> deseja a você um dia repleto de alegria, saúde e muitas bênçãos!
          </p>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
            Que este novo ciclo traga conquistas, momentos felizes e muita paz. Estamos felizes em tê-lo(a) conosco nessa jornada!
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="font-size: 40px;">🎈🎁🎊</div>
          </div>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0;">
            Com muito carinho,<br/>
            <strong style="color: #1a202c;">Equipe Fundação Dom Bosco</strong>
          </p>
        </div>
        <div style="background: #fdf2f8; border-radius: 0 0 16px 16px; padding: 20px 28px; text-align: center; border-top: 1px solid #fce7f3;">
          <img src="https://fundacaodombosco.org/wp-content/uploads/elementor/thumbs/logo-saude-cor_fundacao_dom_bosco_acolher_capacitar_assistencia_social_educacao_saude_criancas_adolescentes_inclusao_reabilitacao_belo_horizonte-qu213x2bru42zepyl57mrub7z9j2wqtwrnty2vwul8.png" alt="Fundação Dom Bosco" style="max-width: 120px; height: auto; margin-bottom: 8px;" />
          <p style="color: #a0aec0; font-size: 11px; margin: 0;">
            Fundação Dom Bosco · Este é um e-mail automático
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

    // Buscar todos os clientes ativos com e-mail e data de nascimento
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, email, birth_date')
      .eq('is_active', true)
      .not('birth_date', 'is', null)
      .not('email', 'is', null);

    if (error) throw error;

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Filtrar aniversariantes do dia
    const birthdayClients = (clients || []).filter(client => {
      const match = client.birth_date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return false;
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      return month === todayMonth && day === todayDay;
    });

    console.log(`Encontrados ${birthdayClients.length} aniversariante(s) do dia.`);

    const results = [];

    for (const client of birthdayClients) {
      const firstName = client.name.split(' ')[0];
      const birthYear = parseInt(client.birth_date.substring(0, 4), 10);
      const age = today.getFullYear() - birthYear;

      try {
        const { data, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: [client.email],
          subject: `🎂 Feliz Aniversário, ${firstName}! - Fundação Dom Bosco`,
          html: buildEmailHtml(firstName, age),
        });

        if (emailError) {
          console.error(`Erro ao enviar para ${client.email}:`, emailError);
          results.push({ id: client.id, name: client.name, status: 'error', error: emailError });
        } else {
          console.log(`E-mail enviado para ${client.name} (${client.email})`);
          results.push({ id: client.id, name: client.name, status: 'sent' });
        }
      } catch (sendErr: any) {
        console.error(`Falha ao enviar para ${client.name}:`, sendErr);
        results.push({ id: client.id, name: client.name, status: 'error', error: sendErr.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalBirthdays: birthdayClients.length,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erro na função send-birthday-emails-cron:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
