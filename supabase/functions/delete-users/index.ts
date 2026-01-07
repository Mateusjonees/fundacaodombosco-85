import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('employee_role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.employee_role !== 'director') {
      return new Response(
        JSON.stringify({ error: 'Only directors can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const userIds = body.userIds || (body.userId ? [body.userId] : []);
    
    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User ID(s) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting users:', userIds);
    
    const results = [];
    for (const userId of userIds) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        console.error('Delete error for', userId, error.message);
        results.push({ userId, success: false, error: error.message });
      } else {
        console.log('Deleted user:', userId);
        results.push({ userId, success: true });
      }
    }

    return new Response(
      JSON.stringify({ message: 'Completed', results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});