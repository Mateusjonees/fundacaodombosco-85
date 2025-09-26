import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    console.log("Email sending disabled - resend package not configured:", clientEmail);

    // Return success for now (email sending is disabled)
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