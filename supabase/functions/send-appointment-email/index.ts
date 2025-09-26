import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AppointmentEmailRequest {
  clientEmail: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  professionalName: string;
  appointmentType: string;
  notes?: string;
}

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
      notes 
    }: AppointmentEmailRequest = await req.json();

    console.log("Email sending disabled - resend package not available");

    /*
    const emailResponse = await resend.emails.send({
      from: "Fundação Dom Bosco <noreply@fundacaodombosco.org>",
      to: [clientEmail],
      subject: "Confirmação de Agendamento - Fundação Dom Bosco",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmação de Agendamento</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #059669, #10b981);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 25px;
              color: #2d3748;
            }
            .appointment-details {
              background: #f7fafc;
              border-left: 4px solid #059669;
              padding: 25px;
              margin: 25px 0;
              border-radius: 8px;
            }
            .detail-row {
              display: flex;
              margin-bottom: 12px;
              font-size: 16px;
            }
            .detail-label {
              font-weight: 600;
              color: #2d3748;
              width: 140px;
              flex-shrink: 0;
            }
            .detail-value {
              color: #4a5568;
              flex: 1;
            }
            .important-note {
              background: #fef7e0;
              border: 1px solid #f6e05e;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
            }
            .important-note h3 {
              color: #d69e2e;
              margin: 0 0 10px 0;
              font-size: 16px;
            }
            .important-note p {
              margin: 0;
              color: #744210;
              font-size: 14px;
            }
            .footer {
              background: #edf2f7;
              padding: 25px 30px;
              text-align: center;
              font-size: 14px;
              color: #718096;
            }
            .footer strong {
              color: #2d3748;
              display: block;
              margin-bottom: 8px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 15px;
            }
            @media only screen and (max-width: 600px) {
              .container {
                margin: 10px;
                border-radius: 8px;
              }
              .header, .content {
                padding: 20px;
              }
              .detail-row {
                flex-direction: column;
              }
              .detail-label {
                width: auto;
                margin-bottom: 4px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">FDB</div>
              <h1>FUNDAÇÃO DOM BOSCO</h1>
              <p>Confirmação de Agendamento</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Olá, <strong>${clientName}</strong>!
              </div>
              
              <p>Seu agendamento foi confirmado com sucesso. Abaixo estão os detalhes do seu atendimento:</p>
              
              <div class="appointment-details">
                <div class="detail-row">
                  <span class="detail-label">Data:</span>
                  <span class="detail-value">${appointmentDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Horário:</span>
                  <span class="detail-value">${appointmentTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Profissional:</span>
                  <span class="detail-value">${professionalName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Tipo de Consulta:</span>
                  <span class="detail-value">${appointmentType}</span>
                </div>
                ${notes ? `
                <div class="detail-row">
                  <span class="detail-label">Observações:</span>
                  <span class="detail-value">${notes}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="important-note">
                <h3>📋 Instruções Importantes:</h3>
                <p>
                  • Chegue com 15 minutos de antecedência<br>
                  • Traga um documento de identidade<br>
                  • Em caso de impossibilidade de comparecimento, entre em contato conosco com pelo menos 24 horas de antecedência<br>
                  • Para reagendamentos ou dúvidas, entre em contato pelos nossos canais oficiais
                </p>
              </div>
              
              <p>Agradecemos pela confiança em nossos serviços. Estamos ansiosos para atendê-lo(a)!</p>
              
              <p>Atenciosamente,<br><strong>Equipe Fundação Dom Bosco</strong></p>
            </div>
            
            <div class="footer">
              <strong>Fundação Dom Bosco - Saúde</strong>
              Sistema de Gestão de Agendamentos<br>
              Este é um e-mail automático, não responda esta mensagem.
            </div>
          </div>
        </body>
        </html>
      `,
    });
    */

    console.log("Email sending disabled:", { clientEmail, clientName, appointmentDate });

    return new Response(JSON.stringify({ success: true, disabled: true }), {
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