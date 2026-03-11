import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface SpreadsheetRow {
  name: string;
  phone?: string;
  email?: string;
  responsible_name?: string;
  responsible_cpf?: string;
  first_session_date?: string;
  end_date?: string;
  schedule_info?: string;
  observations?: string;
}

/**
 * Converte data de diversos formatos para yyyy-mm-dd
 */
const convertDate = (dateStr: any): string => {
  if (!dateStr) return '';
  const s = dateStr.toString().trim();
  if (!s) return '';

  // Já no formato yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Serial do Excel
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const days = dateStr - 2;
    const jsDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return jsDate.toISOString().split('T')[0];
  }

  // dd/mm/yyyy
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) {
        const num = parseInt(year);
        year = num > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month}-${day}`;
    }
  }

  // m/d/yy (formato americano do Excel)
  const usMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    let year = y;
    if (year.length === 2) {
      const num = parseInt(year);
      year = num > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return '';
};

const cleanCPF = (cpf: any): string => {
  if (!cpf) return '';
  return cpf.toString().replace(/\D/g, '');
};

/**
 * Atualiza dados dos pacientes existentes no banco a partir da planilha de controle ambulatorial
 */
export async function updateClientsFromSpreadsheet(): Promise<{ updated: number; skipped: number; errors: string[] }> {
  try {
    const response = await fetch('/temp/controle_ambulatorio.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const rows: SpreadsheetRow[] = jsonData.map((row: any) => ({
      name: (row['Nome'] || '').toString().trim(),
      phone: (row['Telefone - Contato'] || '').toString().trim(),
      email: (row['E-mail - Contato'] || '').toString().trim(),
      responsible_name: (row['Nome - Responsável'] || '').toString().trim(),
      responsible_cpf: cleanCPF(row['CPF - Responsável']),
      first_session_date: convertDate(row['Data - 1ª sessão']),
      end_date: convertDate(row['Data - Fim']),
      schedule_info: (row['Dia/Horário'] || '').toString().trim(),
      observations: (row['Observações'] || '').toString().trim(),
    })).filter((r: SpreadsheetRow) => r.name !== '');

    console.log(`📋 ${rows.length} pacientes encontrados na planilha`);

    const errors: string[] = [];
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        // Buscar paciente pelo nome (case-insensitive)
        const { data: existing, error: fetchError } = await supabase
          .from('clients')
          .select('id, phone, email, responsible_name, responsible_cpf, neuro_test_start_date, neuro_report_deadline, notes')
          .ilike('name', row.name)
          .maybeSingle();

        if (fetchError) {
          errors.push(`Erro ao buscar "${row.name}": ${fetchError.message}`);
          continue;
        }

        if (!existing) {
          skipped++;
          errors.push(`Paciente "${row.name}" não encontrado no sistema`);
          continue;
        }

        // Montar objeto de atualização apenas com campos faltantes
        const updateData: Record<string, any> = {};

        // Datas de sessão: sempre atualizar se tiver na planilha
        if (row.first_session_date && !existing.neuro_test_start_date) {
          updateData.neuro_test_start_date = row.first_session_date;
        }
        if (row.end_date && !existing.neuro_report_deadline) {
          updateData.neuro_report_deadline = row.end_date;
        }

        // Campos de contato: só preencher se vazio no banco
        if (row.phone && !existing.phone) updateData.phone = row.phone;
        if (row.email && !existing.email) updateData.email = row.email;
        if (row.responsible_name && !existing.responsible_name) updateData.responsible_name = row.responsible_name;
        if (row.responsible_cpf && !existing.responsible_cpf) updateData.responsible_cpf = row.responsible_cpf;

        // Notas: append se tiver informação nova
        const noteParts: string[] = [];
        if (row.schedule_info && row.schedule_info !== '-') noteParts.push(`Dia/Horário: ${row.schedule_info}`);
        if (row.observations && row.observations !== '-') noteParts.push(`Obs planilha: ${row.observations}`);
        if (noteParts.length > 0) {
          const newNote = noteParts.join(' | ');
          const currentNotes = existing.notes || '';
          if (!currentNotes.includes(newNote)) {
            updateData.notes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;
          }
        }

        if (Object.keys(updateData).length === 0) {
          skipped++;
          continue;
        }

        const { error: updateError } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', existing.id);

        if (updateError) {
          errors.push(`Erro ao atualizar "${row.name}": ${updateError.message}`);
        } else {
          updated++;
          console.log(`✅ "${row.name}" atualizado:`, Object.keys(updateData).join(', '));
        }
      } catch (err) {
        errors.push(`Erro inesperado em "${row.name}": ${err}`);
      }
    }

    return { updated, skipped, errors };
  } catch (error) {
    console.error('Erro geral na atualização:', error);
    return { updated: 0, skipped: 0, errors: [`Erro geral: ${error}`] };
  }
}
