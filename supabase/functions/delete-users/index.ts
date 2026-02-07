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
      try {
        // Buscar o profile_id para limpar referências por id
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        const profileId = profileData?.id;

        // Limpar referências em tabelas que usam user_id
        await supabaseAdmin.from('client_assignments').delete().eq('employee_id', userId);
        await supabaseAdmin.from('client_assignments').delete().eq('assigned_by', userId);
        await supabaseAdmin.from('client_notes').delete().eq('created_by', userId);
        await supabaseAdmin.from('client_documents').delete().eq('uploaded_by', userId);
        await supabaseAdmin.from('employee_reports').delete().eq('employee_id', userId);
        await supabaseAdmin.from('employee_timesheet').delete().eq('employee_id', userId);
        await supabaseAdmin.from('medical_records').delete().eq('employee_id', userId);
        await supabaseAdmin.from('channel_members').delete().eq('user_id', userId);
        await supabaseAdmin.from('internal_messages').delete().eq('sender_id', userId);
        await supabaseAdmin.from('internal_messages').delete().eq('recipient_id', userId);
        await supabaseAdmin.from('user_specific_permissions').delete().eq('user_id', userId);
        await supabaseAdmin.from('user_job_assignments').delete().eq('user_id', userId);
        await supabaseAdmin.from('attendance_reports').delete().eq('employee_id', userId);
        await supabaseAdmin.from('attendance_reports').delete().eq('created_by', userId);
        await supabaseAdmin.from('client_laudos').delete().eq('employee_id', userId);
        await supabaseAdmin.from('neuro_test_results').delete().eq('applied_by', userId);
        
        // Nullificar referências opcionais em vez de deletar registros importantes
        await supabaseAdmin.from('schedules').update({ employee_id: null }).eq('employee_id', userId);
        await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
        await supabaseAdmin.from('appointment_notifications').delete().eq('employee_id', userId);

        // Limpar referências por profile_id (id da tabela profiles)
        if (profileId) {
          await supabaseAdmin.from('employees').delete().eq('profile_id', profileId);
          await supabaseAdmin.from('employees').delete().eq('user_id', userId);
          await supabaseAdmin.from('documents').delete().eq('employee_id', profileId);
          await supabaseAdmin.from('financial_records').update({ employee_id: null }).eq('employee_id', profileId);
          await supabaseAdmin.from('notes').delete().eq('employee_id', profileId);
        }

        // Deletar o perfil
        await supabaseAdmin.from('profiles').delete().eq('user_id', userId);

        // Deletar o usuário do auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
          console.error('Auth delete error for', userId, error.message);
          results.push({ userId, success: false, error: error.message });
        } else {
          console.log('Deleted user:', userId);
          results.push({ userId, success: true });
        }
      } catch (innerError: any) {
        console.error('Cascade delete error for', userId, innerError.message);
        results.push({ userId, success: false, error: innerError.message });
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
