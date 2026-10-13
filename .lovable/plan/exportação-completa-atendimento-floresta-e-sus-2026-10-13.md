# Exportação completa: Atendimento Floresta e SUS

## O que entra
- **Pacientes:** todos da unidade Atendimento Floresta, mais todos os pacientes de qualquer unidade com algum atendimento marcado como SUS.
- **Registros de cada paciente:** agendamentos, atendimentos concluídos, evoluções/prontuários, relatórios profissionais, anamneses, notas clínicas, receitas, laudos, documentos clínicos, testes neuropsicológicos, planos terapêuticos, encaminhamentos e lista de espera.
- **Arquivos:** os arquivos originais anexados ou gerados por profissionais, como laudos, receitas, documentos do paciente e anexos das evoluções.

## Como será entregue
Uma pasta ZIP salva em Arquivos, com:

```text
exportacao_atendimento_floresta_sus/
  exportacao.xlsx           (uma aba por tipo de registro)
  arquivos/
    <NOME DO PACIENTE>_<código>/
      laudos/ receitas/ documentos/ evolucoes/
  LEIA-ME.txt               (explica abas, colunas e contagens)
```

- Cada aba tem o **código do paciente** e o nome dele, para ligar os registros na importação.
- Datas no formato brasileiro e no horário de Brasília. Nomes em letras maiúsculas.
- Os profissionais aparecem pelo nome, não por códigos internos.
- Cada arquivo aparece na aba **Arquivos**, com o caminho dele dentro do ZIP.
- Uma aba **Resumo** mostra quantos registros e arquivos foram exportados por tipo.
- Nenhuma alteração é feita no sistema; a exportação apenas lê os dados.

## Validação
- Comparar as contagens do Excel com as do banco de dados.
- Abrir a planilha para confirmar as abas, os acentos e as datas.
- Conferir no ZIP uma amostra de arquivos (PDF, imagem e Word) e verificar que todos abrem.
- Listar no LEIA-ME os arquivos que não puderam ser baixados, se houver.

## Detalhes técnicos
- Fonte: consultas somente leitura nas tabelas `clients`, `schedules`, `attendance_reports`, `medical_records`, `employee_reports`, `anamnesis_records`, `client_notes`, `prescriptions`, `client_laudos`, `clinical_documents`, `client_documents`, `neuro_test_results`, `therapeutic_plans`, `therapeutic_progress`, `internal_referrals` e `waiting_list`. Os nomes dos profissionais vêm de `profiles`.
- Filtro: `clients.unit = 'atendimento_floresta'` OU existir uma linha em `schedules` com `service_type = 'sus'` para o mesmo `client_id`.
- Excel gerado com openpyxl em /tmp. Colunas JSON viram texto legível. O texto passa por limpeza de caracteres inválidos e é dividido quando ultrapassar o limite de células do Excel.
- Arquivos baixados dos buckets de storage pelos caminhos salvos nos registros. Se a chave de acesso ao storage não estiver disponível, peço para você adicioná-la como segredo antes de baixar os arquivos.
- O ZIP é montado em /tmp, conferido e depois copiado para /mnt/documents.
