import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmployeeConfirmationRequest {
  name: string;
  email: string;
  employeeRole: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, employeeRole }: EmployeeConfirmationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Fundação Dom Bosco <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo(a) à Fundação Dom Bosco - Confirmação de Vinculação",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #2563eb; font-size: 24px; font-weight: bold; }
            .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { 
              display: inline-block; 
              background: #2563eb; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .credentials { background: #fff; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏛️ Fundação Dom Bosco</div>
              <h2>Confirmação de Vinculação</h2>
            </div>
            
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              
              <p>Seja bem-vindo(a) à Fundação Dom Bosco! Sua conta foi criada com sucesso.</p>
              
              <div class="credentials">
                <h3>Detalhes da sua conta:</h3>
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Função:</strong> ${employeeRole}</p>
              </div>
              
              <p>Para ativar sua conta, verifique seu email e clique no link de confirmação enviado pelo sistema.</p>
              
              <div style="text-align: center;">
                <a href="https://www.sistemafundacaodombosco.org" class="button">
                  Confirmar Vinculação e Acessar Sistema
                </a>
              </div>
              
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Confirme seu email clicando no link de ativação</li>
                <li>Use a senha que foi definida durante o cadastro</li>
                <li>Entre em contato com o administrador caso tenha dúvidas</li>
              </ul>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
              <p>Fundação Dom Bosco - Sistema de Gestão</p>
              <p>Este é um email automático, não responda diretamente.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de confirmação enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de confirmação:", error);
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