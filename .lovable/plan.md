

## Plano: Gerador de Texto para Laudo a partir do Histórico de Testes

### Problema
Atualmente, o profissional precisa copiar manualmente os resultados de cada teste e redigir o laudo do zero. Isso é demorado e repetitivo.

### Solução
Adicionar um botão **"Gerar Rascunho de Laudo"** no histórico de testes do paciente que:

1. **Seleciona testes** — O profissional marca quais testes do histórico incluir no laudo
2. **Gera texto estruturado automaticamente** — Monta um rascunho de laudo neuropsicológico com seções pré-formatadas:
   - Identificação do paciente (nome, idade, data de nascimento)
   - Demanda / Queixa (campo editável)
   - Testes aplicados (tabela com datas, resultados, percentis e classificações)
   - Análise dos resultados (texto descritivo automático agrupado por domínio cognitivo: atenção, memória, funções executivas, linguagem, etc.)
   - Conclusão / Hipótese diagnóstica (campo editável)
3. **Abre diálogo de edição** — O profissional revisa e edita o texto antes de salvar
4. **Envia direto para a aba Laudos** — Cria o laudo já preenchido no `ClientLaudoManager`, pronto para impressão em PDF

### Agrupamento por domínio cognitivo
Os testes serão categorizados automaticamente:
- **Atenção**: BPA-2, D2, Cancelamento, FDT
- **Memória**: RAVLT, Rey, Corsi, WMS
- **Funções Executivas**: Stroop, WCST, ToL, Hayling, Trilhas, TMT, BRIEF-2
- **Linguagem**: FAS, TFV, FVA, BNT-BR
- **Inteligência**: Raven, WAIS/WISC
- **Emocional/Comportamental**: BDI, BAI, SNAP-IV, Conners, CBCL, SDQ, GDS
- **Rastreamento**: MoCA, MEEM, ACE-III, M-CHAT, NEUPSILIN
- **Desempenho Escolar**: TDE-II

### Texto descritivo automático
Para cada teste selecionado, gera frases como:
> "No teste BPA-2 (Atenção Geral), obteve escore bruto de 142, correspondente ao percentil 45, classificado como Média."
> "No Inventário de Depressão de Beck (BDI-II), obteve escore total de 8/63, classificado como Mínimo."

### Alterações técnicas

**Novo componente**: `src/components/LaudoFromTestsGenerator.tsx`
- Checkbox para selecionar testes do histórico
- Agrupamento automático por domínio cognitivo
- Geração de texto estruturado com seções editáveis (textarea)
- Botão para criar laudo diretamente na tabela `client_laudos`

**Editar**: `src/components/PatientNeuroTestHistory.tsx`
- Adicionar botão "Gerar Rascunho de Laudo" no topo do histórico
- Passar dados dos testes selecionados para o gerador

**Editar**: `src/components/ClientLaudoManager.tsx`
- Aceitar prop opcional para abrir com texto pré-preenchido (vindo do gerador)

**Novo arquivo**: `src/utils/laudoTextGenerator.ts`
- Funções utilitárias para mapear test_code → domínio cognitivo
- Funções para gerar frases descritivas por teste
- Template de estrutura do laudo

### Fluxo do usuário
```text
Histórico de Testes → Selecionar testes → "Gerar Rascunho de Laudo"
→ Diálogo com texto estruturado editável → Revisar/editar
→ "Salvar como Laudo" → Laudo criado na aba Laudos, pronto para PDF
```

