/**
 * Utilitários para exibir registros profissionais (CRM / RQE)
 * usados em receituários, laudos e encaminhamentos.
 */

export interface ProfessionalCredentials {
  employee_role?: string | null;
  professional_license?: string | null;
  professional_rqe?: string | null;
}

// Cargos que exigem registro médico (CRM + RQE)
export const MEDICAL_ROLES = ['psiquiatra', 'psychiatrist', 'neuropediatra'];

export const requiresMedicalLicense = (role?: string | null): boolean =>
  !!role && MEDICAL_ROLES.includes(role);

/** Rótulo do registro conforme o cargo (médicos usam CRM, demais "Registro") */
const licenseLabel = (role?: string | null) =>
  requiresMedicalLicense(role) ? 'CRM' : 'Registro';

/**
 * Monta a linha de credenciais: "CRM: 12345 | RQE: 6789"
 * Retorna string vazia quando não há dados.
 */
export const formatProfessionalCredentials = (p?: ProfessionalCredentials | null): string => {
  if (!p) return '';
  const parts: string[] = [];
  const license = p.professional_license?.trim();
  const rqe = p.professional_rqe?.trim();

  if (license) {
    // Evita duplicar o prefixo caso já esteja digitado (ex.: "CRM/MG 1234")
    parts.push(/^(crm|crp|coren|cro|crefito|crfa)/i.test(license) ? license : `${licenseLabel(p.employee_role)}: ${license}`);
  }
  if (rqe) {
    parts.push(/^rqe/i.test(rqe) ? rqe : `RQE: ${rqe}`);
  }

  return parts.join(' | ');
};
