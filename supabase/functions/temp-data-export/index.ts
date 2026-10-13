// Exportação temporária somente leitura (migração de dados). Removida após o uso.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TOKEN_SHA256 = '64dc2faa4f0d5422b03cae181b943ca6fe182acbe6c11408b542917e94e7d917';
const ALLOWED_TABLES = new Set([
  'clients', 'schedules', 'attendance_reports', 'medical_records', 'employee_reports',
  'anamnesis_records', 'anamnesis_types', 'anamnesis_questions', 'client_notes', 'prescriptions',
  'client_laudos', 'clinical_documents', 'client_documents', 'neuro_test_results',
  'therapeutic_plans', 'therapeutic_progress', 'internal_referrals', 'waiting_list', 'profiles',
]);

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

Deno.serve(async (req) => {
  const token = req.headers.get('x-export-token') || '';
  if (!token || (await sha256(token)) !== TOKEN_SHA256) {
    return new Response('forbidden', { status: 403 });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');

  // Leitura paginada de uma tabela permitida
  if (mode === 'table') {
    const table = url.searchParams.get('table') || '';
    if (!ALLOWED_TABLES.has(table)) return new Response('bad table', { status: 400 });
    const offset = Number(url.searchParams.get('offset') || 0);
    const { data, error } = await admin.from(table).select('*').range(offset, offset + 999);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  }

  // Lista buckets do storage
  if (mode === 'buckets') {
    const { data, error } = await admin.storage.listBuckets();
    return new Response(JSON.stringify(error ? { error: error.message } : data.map((b) => b.id)));
  }

  // Lista objetos de um bucket (por prefixo)
  if (mode === 'list') {
    const bucket = url.searchParams.get('bucket') || '';
    const prefix = url.searchParams.get('prefix') || '';
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000, offset: Number(url.searchParams.get('offset') || 0) });
    return new Response(JSON.stringify(error ? { error: error.message } : data));
  }

  // Download de um arquivo original
  if (mode === 'file') {
    const bucket = url.searchParams.get('bucket') || '';
    const path = url.searchParams.get('path') || '';
    const { data, error } = await admin.storage.from(bucket).download(path);
    if (error || !data) return new Response(error?.message || 'not found', { status: 404 });
    return new Response(data, { headers: { 'Content-Type': data.type || 'application/octet-stream' } });
  }

  return new Response('bad mode', { status: 400 });
});
