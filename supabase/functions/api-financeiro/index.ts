import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validar API Key
    const authHeader = req.headers.get('Authorization')
    const apiKey = Deno.env.get('FINANCIAL_API_KEY')
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API Key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid or missing API Key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Processar parâmetros da URL
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'all'
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const unit = url.searchParams.get('unit')
    const category = url.searchParams.get('category')

    // Criar cliente Supabase com service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const response: Record<string, unknown> = {
      success: true,
      meta: {
        requested_at: new Date().toISOString(),
        filters: { type, start_date: startDate, end_date: endDate, unit, category }
      }
    }

    // Função auxiliar para aplicar filtros de data
    const applyDateFilters = (query: any, dateField: string) => {
      if (startDate) query = query.gte(dateField, startDate)
      if (endDate) query = query.lte(dateField, endDate)
      return query
    }

    // Buscar dados conforme o tipo solicitado
    if (type === 'records' || type === 'all') {
      let query = supabase.from('financial_records').select('*')
      query = applyDateFilters(query, 'date')
      if (category) query = query.eq('category', category)
      
      const { data, error } = await query.order('date', { ascending: false })
      if (error) throw error
      
      // Filtrar por unidade se especificado (via client)
      let filteredData = data || []
      if (unit && filteredData.length > 0) {
        const clientIds = filteredData.filter(r => r.client_id).map(r => r.client_id)
        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from('clients')
            .select('id, unit')
            .in('id', clientIds)
            .eq('unit', unit)
          const validClientIds = new Set(clients?.map(c => c.id) || [])
          filteredData = filteredData.filter(r => !r.client_id || validClientIds.has(r.client_id))
        }
      }
      
      response.records = filteredData
      response.records_summary = {
        total: filteredData.length,
        total_income: filteredData.filter(r => r.type === 'income').reduce((sum, r) => sum + (r.amount || 0), 0),
        total_expense: filteredData.filter(r => r.type === 'expense').reduce((sum, r) => sum + (r.amount || 0), 0)
      }
    }

    if (type === 'payments' || type === 'all') {
      let query = supabase.from('client_payments').select('*, clients(name, unit)')
      query = applyDateFilters(query, 'created_at')
      if (unit) query = query.eq('unit', unit)
      
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      
      response.payments = data || []
      response.payments_summary = {
        total: (data || []).length,
        total_amount: (data || []).reduce((sum, p) => sum + (p.total_amount || 0), 0),
        total_paid: (data || []).reduce((sum, p) => sum + (p.amount_paid || 0), 0),
        total_remaining: (data || []).reduce((sum, p) => sum + (p.amount_remaining || 0), 0),
        by_status: {
          pending: (data || []).filter(p => p.status === 'pending').length,
          partial: (data || []).filter(p => p.status === 'partial').length,
          paid: (data || []).filter(p => p.status === 'paid').length
        }
      }
    }

    if (type === 'automatic' || type === 'all') {
      let query = supabase.from('automatic_financial_records').select('*')
      query = applyDateFilters(query, 'payment_date')
      
      const { data, error } = await query.order('payment_date', { ascending: false })
      if (error) throw error
      
      // Filtrar por unidade se especificado (via patient)
      let filteredData = data || []
      if (unit && filteredData.length > 0) {
        const patientIds = filteredData.map(r => r.patient_id).filter(Boolean)
        if (patientIds.length > 0) {
          const { data: clients } = await supabase
            .from('clients')
            .select('id, unit')
            .in('id', patientIds)
            .eq('unit', unit)
          const validPatientIds = new Set(clients?.map(c => c.id) || [])
          filteredData = filteredData.filter(r => validPatientIds.has(r.patient_id))
        }
      }
      
      response.automatic_records = filteredData
      response.automatic_summary = {
        total: filteredData.length,
        total_income: filteredData.filter(r => r.transaction_type === 'income').reduce((sum, r) => sum + (r.amount || 0), 0),
        total_expense: filteredData.filter(r => r.transaction_type === 'expense').reduce((sum, r) => sum + (r.amount || 0), 0)
      }
    }

    if (type === 'summary') {
      // Buscar todos os dados para gerar resumo consolidado
      const [recordsRes, paymentsRes, automaticRes] = await Promise.all([
        supabase.from('financial_records').select('type, amount, date').gte('date', startDate || '1900-01-01').lte('date', endDate || '2100-12-31'),
        supabase.from('client_payments').select('total_amount, amount_paid, amount_remaining, status, unit').gte('created_at', startDate || '1900-01-01').lte('created_at', endDate || '2100-12-31'),
        supabase.from('automatic_financial_records').select('transaction_type, amount, payment_date').gte('payment_date', startDate || '1900-01-01').lte('payment_date', endDate || '2100-12-31')
      ])

      const records = recordsRes.data || []
      const payments = paymentsRes.data || []
      const automatic = automaticRes.data || []

      // Filtrar por unidade se especificado
      const filteredPayments = unit ? payments.filter(p => p.unit === unit) : payments

      response.summary = {
        period: { start: startDate || 'all', end: endDate || 'all' },
        unit_filter: unit || 'all',
        financial_records: {
          total_income: records.filter(r => r.type === 'income').reduce((sum, r) => sum + (r.amount || 0), 0),
          total_expense: records.filter(r => r.type === 'expense').reduce((sum, r) => sum + (r.amount || 0), 0),
          count: records.length
        },
        client_payments: {
          total_contracted: filteredPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0),
          total_received: filteredPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0),
          total_pending: filteredPayments.reduce((sum, p) => sum + (p.amount_remaining || 0), 0),
          count: filteredPayments.length
        },
        automatic_records: {
          total_income: automatic.filter(r => r.transaction_type === 'income').reduce((sum, r) => sum + (r.amount || 0), 0),
          total_expense: automatic.filter(r => r.transaction_type === 'expense').reduce((sum, r) => sum + (r.amount || 0), 0),
          count: automatic.length
        }
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
