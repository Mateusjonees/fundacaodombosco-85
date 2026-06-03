import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const userIds = ['793ba891-6ac5-4096-9cbe-50acef30f3fc', 'e31a8fba-e385-43e8-a141-9d8987575782'];
  const log: any[] = [];

  for (const userId of userIds) {
    try {
      const { data: profileData } = await supabaseAdmin.from('profiles').select('id').eq('user_id', userId).single();
      const profileId = profileData?.id;

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
      await supabaseAdmin.from('schedules').update({ employee_id: null }).eq('employee_id', userId);
      await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
      await supabaseAdmin.from('appointment_notifications').delete().eq('employee_id', userId);

      if (profileId) {
        await supabaseAdmin.from('employees').delete().eq('profile_id', profileId);
        await supabaseAdmin.from('employees').delete().eq('user_id', userId);
        await supabaseAdmin.from('documents').delete().eq('employee_id', profileId);
        await supabaseAdmin.from('financial_records').update({ employee_id: null }).eq('employee_id', profileId);
        await supabaseAdmin.from('notes').delete().eq('employee_id', profileId);
      }

      await supabaseAdmin.from('profiles').delete().eq('user_id', userId);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      log.push({ deleted: userId, error: error?.message });
    } catch (e: any) {
      log.push({ deleted: userId, error: e.message });
    }
  }

  // Create new director
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: 'erilainev@gmail.com',
    password: '12345',
    email_confirm: true,
    user_metadata: { name: 'ERILAINE FERREIRA VITAL', employee_role: 'director' }
  });

  if (createErr || !created.user) {
    log.push({ create: 'failed', error: createErr?.message });
    return new Response(JSON.stringify({ log }), { headers: { 'Content-Type': 'application/json' } });
  }

  const { error: profErr } = await supabaseAdmin.from('profiles').update({
    name: 'ERILAINE FERREIRA VITAL',
    employee_role: 'director',
    is_active: true,
    must_change_password: true,
  }).eq('user_id', created.user.id);

  log.push({ created: created.user.id, profileError: profErr?.message });

  return new Response(JSON.stringify({ log }), { headers: { 'Content-Type': 'application/json' } });
});
