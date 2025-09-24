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

    // Delete the specific users that were already removed from profiles/employees
    const userIdsToDelete = [
      'd137ae9c-fb15-4a07-8a99-3016cd5da132', // Amanda Paola
      '14a88df6-c8a3-4214-9fa1-e22827611f05', // Christopher
      'c2365a4a-b2e1-4e8a-ac3b-05992ce93fb0'  // Clinica
    ];

    let deletedCount = 0;
    const errors = [];

    for (const userId of userIdsToDelete) {
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
          console.error(`Error deleting user ${userId}:`, error);
          errors.push(`Failed to delete user ${userId}: ${error.message}`);
        } else {
          deletedCount++;
          console.log(`Successfully deleted user ${userId}`);
        }
      } catch (error) {
        console.error(`Unexpected error deleting user ${userId}:`, error);
        errors.push(`Unexpected error deleting user ${userId}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully deleted ${deletedCount} users from auth.users`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});