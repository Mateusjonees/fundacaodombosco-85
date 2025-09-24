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
        JSON.stringify({ error: 'Insufficient permissions. Only directors can create users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const usersToCreate = [
      {
        email: "christopher.coelho@fundacaodombosco.org",
        password: "educa123",
        name: "Christopher Menezes Coelho",
        employee_role: "receptionist",
        phone: "(31) 9 95963147",
        department: "Clínica Social"
      },
      {
        email: "amandapaola@fundacaodombosco.org", 
        password: "85019597",
        name: "Amanda Paola Lobo Guimarães",
        employee_role: "coordinator_floresta",
        phone: "(31) 98468-7271",
        department: "Avaliação Neuropsicológica"
      }
    ];

    const results = [];
    
    for (const userData of usersToCreate) {
      try {
        // Create user using admin API
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: userData.name,
            employee_role: userData.employee_role,
            phone: userData.phone,
            department: userData.department
          }
        });

        if (createError) {
          console.error(`Error creating user ${userData.email}:`, createError);
          results.push({
            email: userData.email,
            success: false,
            error: createError.message
          });
          continue;
        }

        if (createdUser.user) {
          // Update profile
          const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
              name: userData.name,
              phone: userData.phone,
              department: userData.department,
              employee_role: userData.employee_role,
              is_active: true
            })
            .eq('user_id', createdUser.user.id);

          if (profileUpdateError) {
            console.error(`Error updating profile for ${userData.email}:`, profileUpdateError);
          }

          results.push({
            email: userData.email,
            success: true,
            name: userData.name,
            userId: createdUser.user.id
          });

          console.log(`Successfully created user: ${userData.name} (${userData.email})`);
        }
      } catch (error) {
        console.error(`Unexpected error creating user ${userData.email}:`, error);
        results.push({
          email: userData.email,
          success: false,
          error: 'Unexpected error occurred'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({ 
        message: `Successfully created ${successCount} users`,
        results: results
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