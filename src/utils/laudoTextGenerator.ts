// Mapeamento de testes → domínios cognitivos
const DOMAIN_MAP: Record<string, string> = {
  // Atenção
  BPA2: 'Atenção',
  D2: 'Atenção',
  CANCELAMENTO: 'Atenção',
  FDT: 'Atenção',
  // Memória
  RAVLT: 'Memória',
  REY: 'Memória',
  TAYLOR: 'Memória',
  CORSI: 'Memória',
  WMS: 'Memória',
  TSBC: 'Memória',
  // Funções Executivas
  STROOP: 'Funções Executivas',
  WCST: 'Funções Executivas',
  TOL: 'Funções Executivas',
  HAYLING_ADULTO: 'Funções Executivas',
  HAYLING_INFANTIL: 'Funções Executivas',
  TRILHAS: 'Funções Executivas',
  TRILHAS_PRE_ESCOLAR: 'Funções Executivas',
  TMT_ADULTO: 'Funções Executivas',
  BRIEF2: 'Funções Executivas',
  FPT_ADULTO: 'Funções Executivas',
  FPT_INFANTIL: 'Funções Executivas',
  TRPP: 'Funções Executivas',
  // Linguagem
  FAS: 'Linguagem',
  TFV: 'Linguagem',
  FVA: 'Linguagem',
  BNTBR: 'Linguagem',
  TIN: 'Linguagem',
  PCFO: 'Linguagem',
  TOM: 'Linguagem',
  // Inteligência
  RAVEN: 'Inteligência',
  WECHSLER: 'Inteligência',
  // Emocional/Comportamental
  BDI: 'Emocional/Comportamental',
  BAI: 'Emocional/Comportamental',
  SNAPIV: 'Emocional/Comportamental',
  CONNERS: 'Emocional/Comportamental',
  CBCL: 'Emocional/Comportamental',
  SDQ: 'Emocional/Comportamental',
  GDS: 'Emocional/Comportamental',
  VINELAND: 'Comportamento Adaptativo',
  // Rastreamento
  MOCA: 'Rastreamento Cognitivo',
  MEEM: 'Rastreamento Cognitivo',
  ACE3: 'Rastreamento Cognitivo',
  MCHAT: 'Rastreamento Cognitivo',
  NEUPSILIN: 'Rastreamento Cognitivo',
  // Desempenho Escolar
  TDE2: 'Desempenho Escolar',
};

// Nomes legíveis dos testes
const TEST_FULL_NAMES: Record<string, string> = {
  BPA2: 'Bateria Psicológica para Avaliação da Atenção - 2ª Edição (BPA-2)',
  D2: 'Teste d2 - Atenção Concentrada',
  CANCELAMENTO: 'Teste de Cancelamento (Atenção Concentrada)',
  FDT: 'Five Digit Test (FDT)',
  RAVLT: 'Teste de Aprendizagem Auditivo-Verbal de Rey (RAVLT)',
  REY: 'Figura Complexa de Rey',
  TAYLOR: 'Figura Complexa de Taylor',
  CORSI: 'Blocos de Corsi',
  WMS: 'Escala Wechsler de Memória (WMS)',
  TSBC: 'Teste de Span de Blocos de Corsi (TSBC)',
  STROOP: 'Teste de Stroop',
  WCST: 'Teste Wisconsin de Classificação de Cartas (WCST)',
  TOL: 'Torre de Londres (ToL)',
  HAYLING_ADULTO: 'Teste Hayling (Adulto)',
  HAYLING_INFANTIL: 'Teste Hayling (Infantil)',
  TRILHAS: 'Teste de Trilhas',
  TRILHAS_PRE_ESCOLAR: 'Teste de Trilhas (Pré-Escolar)',
  TMT_ADULTO: 'Trail Making Test (TMT)',
  BRIEF2: 'BRIEF-2 - Inventário de Funções Executivas',
  FPT_ADULTO: 'Five Point Test (Adulto)',
  FPT_INFANTIL: 'Five Point Test (Infantil)',
  TRPP: 'Teste de Reconhecimento de Palavras e Pseudopalavras (TRPP)',
  FAS: 'Teste de Fluência Verbal Fonêmica (FAS)',
  TFV: 'Teste de Fluência Verbal',
  FVA: 'Fluência Verbal para Animais e Frutas (FVA)',
  BNTBR: 'Teste de Nomeação de Boston (BNT-BR)',
  TIN: 'Teste Infantil de Nomeação (TIN)',
  PCFO: 'Prova de Consciência Fonológica por Produção Oral (PCFO)',
  TOM: 'Teoria da Mente (ToM)',
  RAVEN: 'Matrizes Progressivas de Raven',
  WECHSLER: 'Escalas Wechsler de Inteligência (WAIS/WISC)',
  BDI: 'Inventário de Depressão de Beck (BDI-II)',
  BAI: 'Inventário de Ansiedade de Beck (BAI)',
  SNAPIV: 'SNAP-IV',
  CONNERS: 'Escala Conners 3',
  CBCL: 'CBCL - Child Behavior Checklist',
  SDQ: 'Questionário de Capacidades e Dificuldades (SDQ)',
  GDS: 'Escala de Depressão Geriátrica (GDS)',
  VINELAND: 'Escalas de Comportamento Adaptativo Vineland-3',
  MOCA: 'Montreal Cognitive Assessment (MoCA)',
  MEEM: 'Mini Exame do Estado Mental (MEEM)',
  ACE3: 'Addenbrooke\'s Cognitive Examination III (ACE-III)',
  MCHAT: 'M-CHAT (Modified Checklist for Autism in Toddlers)',
  NEUPSILIN: 'NEUPSILIN - Instrumento de Avaliação Neuropsicológica Breve',
  TDE2: 'Teste de Desempenho Escolar II (TDE-II)',
};

// Ordem de apresentação dos domínios
const DOMAIN_ORDER = [
  'Rastreamento Cognitivo',
  'Inteligência',
  'Atenção',
  'Memória',
  'Funções Executivas',
  'Linguagem',
  'Desempenho Escolar',
  'Comportamento Adaptativo',
  'Emocional/Comportamental',
];

export interface TestDataForLaudo {
  id: string;
  test_code: string;
  test_name: string;
  patient_age: number;
  applied_at: string;
  raw_scores: Record<string, any>;
  calculated_scores: Record<string, any>;
  percentiles: Record<string, any>;
  classifications: Record<string, string>;
  notes?: string | null;
}

export const getDomain = (testCode: string): string => {
  return DOMAIN_MAP[testCode] || 'Outros';
};

export const getTestFullName = (testCode: string, fallbackName: string): string => {
  return TEST_FULL_NAMES[testCode] || fallbackName;
};

// Agrupa testes por domínio cognitivo
export const groupTestsByDomain = (tests: TestDataForLaudo[]): Record<string, TestDataForLaudo[]> => {
  const grouped: Record<string, TestDataForLaudo[]> = {};
  for (const test of tests) {
    const domain = getDomain(test.test_code);
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(test);
  }
  // Ordenar domínios
  const ordered: Record<string, TestDataForLaudo[]> = {};
  for (const domain of DOMAIN_ORDER) {
    if (grouped[domain]) ordered[domain] = grouped[domain];
  }
  // Adicionar domínios não listados
  for (const domain of Object.keys(grouped)) {
    if (!ordered[domain]) ordered[domain] = grouped[domain];
  }
  return ordered;
};

// Gera frase descritiva para um subteste
const describeSubtest = (
  testName: string,
  subtestLabel: string,
  score: any,
  percentile: any,
  classification: string
): string => {
  const parts: string[] = [];
  
  if (score !== undefined && score !== '-' && score !== null) {
    parts.push(`escore de ${score}`);
  }
  if (percentile !== undefined && percentile !== '-' && percentile !== null) {
    parts.push(`percentil ${percentile}`);
  }
  if (classification && classification !== '-') {
    parts.push(`classificado como "${classification}"`);
  }

  if (parts.length === 0) return '';

  return `No ${testName} (${subtestLabel}), obteve ${parts.join(', ')}.`;
};

// Subtestes principais para texto descritivo
const getMainDescriptiveKeys = (testCode: string): { keys: string[]; labels: Record<string, string> } => {
  // Retorna apenas os subtestes mais relevantes para o texto do laudo
  switch (testCode) {
    case 'BPA2': return { keys: ['AC', 'AD', 'AA', 'AG'], labels: { AC: 'Atenção Concentrada', AD: 'Atenção Dividida', AA: 'Atenção Alternada', AG: 'Atenção Geral' } };
    case 'RAVLT': return { keys: ['escoreTotal', 'a7', 'reconhecimento'], labels: { escoreTotal: 'Escore Total A1-A5', a7: 'Evocação Tardia', reconhecimento: 'Reconhecimento' } };
    case 'FDT': return { keys: ['inibicao', 'flexibilidade'], labels: { inibicao: 'Inibição', flexibilidade: 'Flexibilidade' } };
    case 'WECHSLER': return { keys: ['qiTotal', 'icv', 'iop', 'imo', 'ivp'], labels: { qiTotal: 'QI Total', icv: 'Compreensão Verbal', iop: 'Org. Perceptual', imo: 'Memória Operacional', ivp: 'Vel. Processamento' } };
    case 'WCST': return { keys: ['perseverativeErrors', 'categoriesCompleted'], labels: { perseverativeErrors: 'Erros Perseverativos', categoriesCompleted: 'Categorias Completadas' } };
    case 'BRIEF2': return { keys: ['gec', 'bri', 'eri', 'cri'], labels: { gec: 'Índice Global (GEC)', bri: 'Reg. Comportamental', eri: 'Reg. Emocional', cri: 'Reg. Cognitiva' } };
    case 'VINELAND': return { keys: ['compostoGeral', 'comunicacao', 'vidaDiaria', 'socializacao'], labels: { compostoGeral: 'Composto Geral', comunicacao: 'Comunicação', vidaDiaria: 'Vida Diária', socializacao: 'Socialização' } };
    case 'CBCL': return { keys: ['internalizacao', 'externalizacao', 'totalProblemas'], labels: { internalizacao: 'Internalização', externalizacao: 'Externalização', totalProblemas: 'Total Problemas' } };
    case 'CONNERS': return { keys: ['desatencao', 'hiperatividade', 'indiceTDAH'], labels: { desatencao: 'Desatenção', hiperatividade: 'Hiperatividade', indiceTDAH: 'Índice TDAH' } };
    case 'TDE2': return { keys: ['escrita', 'aritmetica', 'leitura', 'totalScore'], labels: { escrita: 'Escrita', aritmetica: 'Aritmética', leitura: 'Leitura', totalScore: 'Total' } };
    case 'NEUPSILIN': return { keys: ['orientacao', 'atencao', 'percepcao', 'memoria', 'linguagem', 'praxias', 'funcoesExecutivas'], labels: { orientacao: 'Orientação', atencao: 'Atenção', percepcao: 'Percepção', memoria: 'Memória', linguagem: 'Linguagem', praxias: 'Praxias', funcoesExecutivas: 'Funções Executivas' } };
    case 'WMS': return { keys: ['memoriaImediata', 'memoriaTargia', 'memoriaTrabalho'], labels: { memoriaImediata: 'Memória Imediata', memoriaTargia: 'Memória Tardia', memoriaTrabalho: 'Memória de Trabalho' } };
    case 'CORSI': return { keys: ['spanDireto', 'spanInverso'], labels: { spanDireto: 'Span Direto', spanInverso: 'Span Inverso' } };
    case 'SDQ': return { keys: ['totalDificuldades', 'proSocial'], labels: { totalDificuldades: 'Total Dificuldades', proSocial: 'Pró-social' } };
    case 'SNAPIV': return { keys: ['desatencao', 'hiperatividade', 'tod'], labels: { desatencao: 'Desatenção', hiperatividade: 'Hiperatividade', tod: 'TOD' } };
    case 'STROOP': return { keys: ['interferencia'], labels: { interferencia: 'Efeito Interferência' } };
    case 'REY': return { keys: ['copia', 'memoria'], labels: { copia: 'Cópia', memoria: 'Memória' } };
    case 'TAYLOR': return { keys: ['copia', 'reproducaoMemoria'], labels: { copia: 'Cópia', reproducaoMemoria: 'Memória' } };
    case 'D2': return { keys: ['rl', 'ic'], labels: { rl: 'Resultado Líquido', ic: 'Índice de Concentração' } };
    case 'TRILHAS': return { keys: ['trilhaA', 'trilhaB'], labels: { trilhaA: 'Trilha A', trilhaB: 'Trilha B' } };
    case 'TMT_ADULTO': return { keys: ['tempoA', 'tempoB'], labels: { tempoA: 'TMT-A', tempoB: 'TMT-B' } };
    case 'FVA': return { keys: ['percentilAnimais', 'percentilFrutas'], labels: { percentilAnimais: 'Animais', percentilFrutas: 'Frutas' } };
    case 'ACE3': return { keys: ['totalScore'], labels: { totalScore: 'Escore Total' } };
    default: {
      // Para testes com subteste único (BDI, BAI, MOCA, MEEM, etc)
      const singleKeys = ['totalScore', 'total', 'percentil', 'escorePadrao', 'totalLiquido', 'totalAcertos', 'desenhosUnicos'];
      return { keys: singleKeys, labels: Object.fromEntries(singleKeys.map(k => [k, 'Total'])) };
    }
  }
};

// Gera texto descritivo para um teste
export const generateTestDescription = (test: TestDataForLaudo): string => {
  const fullName = getTestFullName(test.test_code, test.test_name);
  const { keys, labels } = getMainDescriptiveKeys(test.test_code);
  const calc = test.calculated_scores || {};
  const raw = test.raw_scores || {};
  const perc = test.percentiles || {};
  const cls = test.classifications || {};

  const sentences: string[] = [];

  for (const key of keys) {
    const score = calc[key] ?? raw[key];
    const percentile = perc[key];
    const classification = cls[key];
    if (score === undefined && percentile === undefined && !classification) continue;
    
    const sentence = describeSubtest(fullName, labels[key] || key, score, percentile, classification || '-');
    if (sentence) sentences.push(sentence);
  }

  return sentences.length > 0 ? sentences.join(' ') : `${fullName}: resultados registrados.`;
};

// Gera tabela resumo dos testes
const generateTestTable = (tests: TestDataForLaudo[]): string => {
  const lines: string[] = ['TESTES APLICADOS:', ''];
  for (const test of tests) {
    const date = new Date(test.applied_at).toLocaleDateString('pt-BR');
    lines.push(`• ${getTestFullName(test.test_code, test.test_name)} — ${date}`);
  }
  return lines.join('\n');
};

// Gera texto completo do rascunho de laudo
export const generateLaudoDraft = (
  clientName: string,
  clientBirthDate: string | undefined,
  selectedTests: TestDataForLaudo[]
): string => {
  const sections: string[] = [];

  // Identificação
  const age = clientBirthDate 
    ? Math.floor((Date.now() - new Date(clientBirthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : '';
  const birthStr = clientBirthDate ? new Date(clientBirthDate).toLocaleDateString('pt-BR') : '';
  
  sections.push('LAUDO DE AVALIAÇÃO NEUROPSICOLÓGICA\n');
  sections.push(`IDENTIFICAÇÃO:`);
  sections.push(`Nome: ${clientName}`);
  if (birthStr) sections.push(`Data de Nascimento: ${birthStr} (${age} anos)`);
  sections.push(`Data da Avaliação: ${new Date().toLocaleDateString('pt-BR')}`);
  sections.push('');

  // Demanda
  sections.push('DEMANDA / QUEIXA:');
  sections.push('[Descreva aqui a demanda e queixa principal]');
  sections.push('');

  // Testes aplicados
  sections.push(generateTestTable(selectedTests));
  sections.push('');

  // Análise por domínio
  sections.push('ANÁLISE DOS RESULTADOS:');
  sections.push('');
  
  const grouped = groupTestsByDomain(selectedTests);
  for (const [domain, tests] of Object.entries(grouped)) {
    sections.push(`${domain.toUpperCase()}:`);
    for (const test of tests) {
      sections.push(generateTestDescription(test));
    }
    sections.push('');
  }

  // Conclusão
  sections.push('CONCLUSÃO / HIPÓTESE DIAGNÓSTICA:');
  sections.push('[Descreva aqui a conclusão e hipótese diagnóstica baseada nos resultados acima]');
  sections.push('');

  return sections.join('\n');
};
