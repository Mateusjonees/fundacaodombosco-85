import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Edge function create-users invoked');

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
        JSON.stringify({ error: 'Only directors can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('Request body:', { ...body, password: '***' });
    
    const { email, password, name, employee_role, phone, department, unit, units, document_cpf } = body;

    if (!email || !password || !name || !employee_role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, name, employee_role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, employee_role, phone, department }
    });

    if (createError) {
      console.error('Error creating user:', createError.message);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!createdUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', createdUser.user.id);

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        name,
        phone: phone || null,
        department: department || null,
        employee_role,
        unit: unit || null,
        units: units || null,
        document_cpf: document_cpf || null,
        is_active: true,
        must_change_password: true
      })
      .eq('user_id', createdUser.user.id);

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError.message);
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
      return new Response(
        JSON.stringify({ error: `Failed to update profile: ${profileUpdateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: createdUser.user.id,
          email: createdUser.user.email,
          name,
          employee_role
        }
      }),
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
