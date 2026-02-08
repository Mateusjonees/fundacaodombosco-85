

## Adicionar campos de neuroavaliacao ao perfil de cada cliente

O objetivo e reestruturar a pagina de Neuroavaliacao para incluir todas as colunas da planilha fornecida, adicionando campos que ainda nao existem no banco de dados.

### Campos que ja existem no banco e serao mantidos

| Campo da planilha | Coluna no banco |
|---|---|
| Codigo | neuro_patient_code |
| Nome | name |
| Data de Nascimento | birth_date |
| Idade | calculado de birth_date |
| Sexo | gender |
| Encaminhado por | neuro_diagnosis_by |
| Hipotese Diagnostica | neuro_diagnosis_suggestion |
| Diagnostico | neuro_final_diagnosis |
| Concordancia Diagnostica | neuro_diagnostic_agreement |
| Tipo de Divergencia | neuro_divergence_type |
| Condicao Socioeconomica | neuro_socioeconomic |

### Campos calculados (sem banco)

| Campo | Logica |
|---|---|
| Faixa Etaria | Calculado da idade: Crianca (0-12), Adolescente (13-17), Adulto (18-59), Idoso (60+) |

### Novos campos a criar no banco (tabela clients)

| Campo da planilha | Nova coluna | Tipo | Valores possiveis |
|---|---|---|---|
| Tipo de Hipotese | neuro_hypothesis_type | text | Unica, Combinada simples, Combinada complexa, Sem hipotese inicial, Nao se aplica |
| N Hipoteses | neuro_hypothesis_count | text | 1, 2, >= 3, Nao se aplica |
| Categoria Diagnostica | neuro_diagnostic_category | text | Neurodesenvolvimento, Ansiedade, Humor, etc. (texto livre) |
| Renda mensal | neuro_monthly_income | text | Nao possuo renda, Ate R$ 1.100, R$ 1.200-2.500, R$ 2.600-4.000, R$ 4.100-7.100, Acima de R$ 7.200, Isento, Nao informado |
| Status | neuro_evaluation_status | text | Avaliacao em curso, Avaliacao Finalizada, Verificar no Arquivo Morto |

### Alteracoes na Condicao Socioeconomica

Atualizar os valores de A/B/C/D/E para: Baixa, Media, Alta, Isento, Nao informado.

### Arquivos a modificar

1. **Migracao SQL** - Criar 5 novas colunas na tabela `clients`
2. **src/pages/Neuroassessment.tsx** - Adicionar as novas colunas na tabela, no formulario de edicao, na exportacao PDF/Excel, e nos graficos. Reordenar colunas para seguir a ordem da planilha. Remover colunas que nao estao na planilha (Historico Relevante, Inicio Testes, Previsao Laudo, Data Finalizacao, Materiais/Testes, Horas Totais, Status Laudo, Observacoes)
3. **src/integrations/supabase/types.ts** - Adicionar os novos campos ao tipo da tabela clients

### Nova ordem das colunas na tabela

1. Codigo
2. Nome
3. Data de Nascimento
4. Idade
5. Sexo
6. Faixa Etaria
7. Encaminhado por
8. Hipotese Diagnostica
9. Tipo de Hipotese
10. N Hipoteses
11. Diagnostico
12. Categoria Diagnostica
13. Concordancia Diagnostica
14. Tipo de Divergencia
15. Renda mensal
16. Condicao Socioeconomica
17. Status

### Detalhes tecnicos

**Migracao SQL:**
```sql
ALTER TABLE clients ADD COLUMN neuro_hypothesis_type text;
ALTER TABLE clients ADD COLUMN neuro_hypothesis_count text;
ALTER TABLE clients ADD COLUMN neuro_diagnostic_category text;
ALTER TABLE clients ADD COLUMN neuro_monthly_income text;
ALTER TABLE clients ADD COLUMN neuro_evaluation_status text DEFAULT 'Avaliação em curso';
```

**Interface NeuroClient** - Adicionar os 5 novos campos ao tipo.

**Formulario de edicao** - Adicionar campos Select para Tipo de Hipotese, N Hipoteses, Categoria Diagnostica, Renda Mensal e Status. Atualizar opcoes de Condicao Socioeconomica.

**Exportacao PDF/Excel** - Incluir as novas colunas e remover as que nao constam na planilha.

**Graficos** - Atualizar grafico socioeconomico para usar os novos valores (Baixa, Media, Alta). Adicionar grafico de Status e Categoria Diagnostica.

