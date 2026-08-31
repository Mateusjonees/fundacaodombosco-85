import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      return json({ error: 'Sessão não encontrada. Faça login novamente.' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return json({ error: 'Sessão inválida ou expirada. Faça login novamente.' }, 401);
    }

    // Autorização: diretor pelo perfil OU admin na tabela de papéis
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('employee_role')
      .eq('user_id', user.id)
      .maybeSingle();

    let allowed = profile?.employee_role === 'director';
    if (!allowed) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      allowed = !!roles?.some((r: { role: string }) => r.role === 'admin');
    }

    if (!allowed) {
      return json({ error: 'Apenas diretores podem criar usuários.' }, 403);
    }

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: 'Dados inválidos na requisição.' }, 400);
    console.log('Request body:', { ...body, password: '***' });

    const {
      password, name, employee_role, phone, department, unit, units, document_cpf,
      professional_license, professional_rqe,
    } = body;
    const email = String(body.email ?? '').trim().toLowerCase();

    if (!email || !password || !name || !employee_role) {
      return json({ error: 'Preencha e-mail, senha, nome e cargo.' }, 400);
    }
    if (String(password).length < 6) {
      return json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, 400);
    }

    // Criação do usuário no Auth (a checagem de duplicidade é feita pelo próprio Auth)
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, employee_role, phone, department },
    });

    if (createError || !createdUser?.user) {
      const msg = createError?.message ?? 'Falha ao criar usuário.';
      console.error('Error creating user:', msg);
      const duplicated = /already|exists|registered|duplicate/i.test(msg);
      return json(
        { error: duplicated ? 'Este e-mail já está cadastrado no sistema.' : msg },
        400
      );
    }

    const newUserId = createdUser.user.id;
    console.log('User created:', newUserId);

    const profileData = {
      user_id: newUserId,
      email,
      name,
      phone: phone || null,
      department: department || null,
      employee_role,
      unit: unit || null,
      units: units || null,
      document_cpf: document_cpf || null,
      professional_license: professional_license || null,
      professional_rqe: professional_rqe || null,
      is_active: true,
      must_change_password: true,
    };

    // O trigger handle_new_user pode ainda não ter criado o perfil: aguarda e depois faz upsert
    let profileError: string | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', newUserId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update(profileData)
          .eq('user_id', newUserId);
        profileError = error?.message ?? null;
        if (!profileError) break;
      } else if (attempt === 3) {
        const { error } = await supabaseAdmin.from('profiles').insert(profileData);
        profileError = error?.message ?? null;
        if (!profileError) break;
      }
      await sleep(400);
    }

    if (profileError) {
      console.error('Error updating profile:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return json({ error: `Falha ao salvar o perfil: ${profileError}` }, 500);
    }

    // Mantém user_roles em sincronia para diretores (acesso administrativo)
    if (employee_role === 'director') {
      await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: newUserId, role: 'admin' }, { onConflict: 'user_id,role' })
        .then(({ error }) => error && console.log('Warn user_roles:', error.message));
    }

    console.log('Profile updated successfully');

    return json({
      success: true,
      user: { id: newUserId, email: createdUser.user.email, name, employee_role },
    });
  } catch (error) {
    console.error('Error:', error);
    return json({ error: (error as Error)?.message ?? 'Erro interno no servidor.' }, 500);
  }
});
