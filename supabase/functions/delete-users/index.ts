import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user making the request
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user is a director
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('employee_role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.employee_role !== 'director') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only directors can delete users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user IDs from request body (supports single userId or array userIds)
    const body = await req.json();
    const userIds = body.userIds || (body.userId ? [body.userId] : []);
    
    if (!userIds || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User ID(s) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { userId: string; success: boolean; error?: string }[] = [];
    
    for (const userId of userIds) {
      // Delete the user from auth.users
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error(`Error deleting user ${userId}:`, deleteError);
        results.push({ userId, success: false, error: deleteError.message });
      } else {
        console.log(`Successfully deleted user ${userId}`);
        results.push({ userId, success: true });
      }
    }
    
    const allSuccess = results.every(r => r.success);
    const status = allSuccess ? 200 : 207;

    return new Response(
      JSON.stringify({ 
        message: allSuccess ? 'All users deleted successfully' : 'Some users could not be deleted',
        results
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});