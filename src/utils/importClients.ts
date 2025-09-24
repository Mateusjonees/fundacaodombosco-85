import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ClientImportData {
  name: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  cpf?: string;
  responsible_name?: string;
  responsible_cpf?: string;
  is_active: boolean;
  unit: string;
}

export async function importClientsFromFile(): Promise<{ success: number; errors: string[] }> {
  try {
    // Fetch the Excel file
    const response = await fetch('/temp/clients_import.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    
    // Parse Excel file
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const parsedData: ClientImportData[] = jsonData.map((row: any) => {
      // Função para converter data do formato dd/mm/yyyy para yyyy-mm-dd
      const convertDate = (dateStr: string) => {
        if (!dateStr) return '';
        
        // Se já estiver no formato correto (yyyy-mm-dd), retorna como está
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
        
        // Se estiver no formato dd/mm/yyyy, converte
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        
        return '';
      };

      // Limpar e formatar CPF
      const cleanCPF = (cpf: string) => {
        if (!cpf) return '';
        return cpf.toString().replace(/\D/g, '');
      };

      return {
        name: row['Nome Completo'] || '',
        birth_date: convertDate(row['Data de Nascimento']) || '',
        phone: row['Telefone'] || '',
        email: row['E-mail'] || '',
        cpf: cleanCPF(row['CPF']) || '',
        responsible_name: row['Nome do Responsável'] || '',
        responsible_cpf: cleanCPF(row['CPF - Responsável']) || '',
        is_active: row['Ativo ou inativo']?.toLowerCase() === 'ativo',
        unit: 'madre' // Definir unidade padrão como madre
      };
    });

    // Filtrar apenas linhas com nome preenchido
    const validData = parsedData.filter(item => item.name.trim() !== '');
    
    console.log(`${validData.length} clientes encontrados para importação.`);
    
    const errors: string[] = [];
    let successCount = 0;

    for (const client of validData) {
      try {
        // Verificar se cliente já existe pelo CPF ou nome
        let existingClient = null;
        
        if (client.cpf) {
          const { data } = await supabase
            .from('clients')
            .select('id, name')
            .eq('cpf', client.cpf)
            .maybeSingle();
          existingClient = data;
        }

        if (!existingClient && client.name) {
          const { data } = await supabase
            .from('clients')
            .select('id, name')
            .ilike('name', client.name)
            .maybeSingle();
          existingClient = data;
        }

        if (existingClient) {
          errors.push(`Cliente "${client.name}" já existe no sistema (${existingClient.name})`);
        } else {
          // Preparar dados para inserção
          const insertData: any = {
            name: client.name,
            phone: client.phone || null,
            email: client.email || null,
            birth_date: client.birth_date || null,
            cpf: client.cpf || null,
            responsible_name: client.responsible_name || null,
            is_active: client.is_active,
            unit: client.unit
          };

          const { error } = await supabase
            .from('clients')
            .insert(insertData);

          if (error) {
            errors.push(`Erro ao importar "${client.name}": ${error.message}`);
          } else {
            successCount++;
            console.log(`Cliente "${client.name}" importado com sucesso`);
          }
        }
      } catch (error) {
        errors.push(`Erro inesperado ao processar "${client.name}": ${error}`);
      }
    }

    return { success: successCount, errors };
    
  } catch (error) {
    console.error('Erro ao importar clientes:', error);
    return { success: 0, errors: [`Erro geral na importação: ${error}`] };
  }
}