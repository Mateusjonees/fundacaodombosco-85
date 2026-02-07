import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token não fornecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from("patient_portal_tokens")
      .select("client_id, expires_at, is_active, clients(name)")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Token inválido ou expirado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expirado" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch upcoming schedules
    const today = new Date().toISOString().split("T")[0];
    const { data: schedules } = await supabase
      .from("schedules")
      .select("appointment_date, appointment_time, service_type, status, is_online, meeting_link")
      .eq("client_id", tokenData.client_id)
      .gte("appointment_date", today)
      .in("status", ["scheduled", "confirmed"])
      .order("appointment_date", { ascending: true });

    return new Response(
      JSON.stringify({
        client: tokenData.clients,
        schedules: schedules || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
