

## Plano: Adicionar 8 Novos Testes Neuropsicológicos

### Testes a implementar

| # | Teste | Domínio | Faixa Etária | Tipo de Escore |
|---|-------|---------|--------------|----------------|
| 1 | **Torre de Londres (ToL)** | Funções Executivas | 6-14 anos | Percentil via tabela normativa |
| 2 | **D2 - Atenção Concentrada** | Atenção | 9-52 anos | Percentil via tabela normativa |
| 3 | **BDI-II** (Depressão de Beck) | Emocional | 13-80 anos | Faixas de classificação direta |
| 4 | **BAI** (Ansiedade de Beck) | Emocional | 17-80 anos | Faixas de classificação direta |
| 5 | **SNAP-IV** (TDAH infantil) | Comportamental | 6-18 anos | Ponto de corte por subescala |
| 6 | **M-CHAT-R/F** (Autismo) | Rastreamento TEA | 1-3 anos | Risco baixo/médio/alto |
| 7 | **Matrizes de Raven** | Inteligência | 5-69 anos | Percentil via tabela normativa |
| 8 | **WMS** (Wechsler Memory Scale) | Memória | 16-89 anos | Índices padronizados (M=100, DP=15) |

---

### Estrutura por teste

Cada teste segue o padrão existente:

1. **Arquivo de dados** (`src/data/neuroTests/`) - definição do teste, tabelas normativas, funções de cálculo
2. **Componente de formulário** (`src/components/NeuroTest[Nome]Form.tsx`) - campos de entrada específicos
3. **Integração** - registrar no `index.ts`, `CompleteAttendanceDialog`, `NeuroTestResults` e `PatientNeuroTestHistory`

---

### Detalhes técnicos de cada teste

**1. Torre de Londres (ToL)**
- Campos: número de acertos em cada problema (3-12 movimentos), tempo total
- Escore: total de acertos (0-12), tempo de planejamento
- Classificação por percentil via normas brasileiras (Seabra & Dias, 2012)

**2. D2 - Atenção Concentrada**
- Campos: total de itens processados, acertos, erros (E1 = comissão, E2 = omissão)
- Escores calculados: RL (resultado líquido = total - erros), E% (percentual de erros), IC (índice de concentração = acertos - E1), IV (índice de variação)
- Percentil por idade e escolaridade

**3. BDI-II (Inventário de Depressão de Beck)**
- 21 itens, cada um de 0-3 pontos
- Total de 0-63, sem percentil — classificação direta:
  - 0-13: Mínimo | 14-19: Leve | 20-28: Moderado | 29-63: Grave

**4. BAI (Inventário de Ansiedade de Beck)**
- 21 itens, cada um de 0-3 pontos
- Total de 0-63, classificação direta:
  - 0-10: Mínimo | 11-19: Leve | 20-30: Moderado | 31-63: Grave

**5. SNAP-IV**
- 26 itens, cada um de 0-3 pontos
- 3 subescalas: Desatenção (itens 1-9), Hiperatividade (itens 10-18), TOD (itens 19-26)
- Ponto de corte: média ≥ 1.78 por subescala = indicativo

**6. M-CHAT-R/F**
- 20 itens sim/não
- Contagem de respostas críticas
- Risco: Baixo (0-2), Médio (3-7), Alto (8-20)

**7. Matrizes Progressivas de Raven**
- Versões: Coloridas (5-11 anos), Geral (12-69 anos)
- Campos: acertos por série (A, Ab/B, C, D, E)
- Total → percentil via tabela normativa por idade

**8. WMS (Wechsler Memory Scale)**
- Índices compostos: Memória Imediata, Memória Tardia, Memória de Trabalho, Reconhecimento Visual
- Input: escores padronizados dos índices (M=100, DP=15)
- Classificação automática por faixa

---

### Arquivos a criar (16 novos)

```text
src/data/neuroTests/
  ├── tol.ts          (Torre de Londres)
  ├── d2.ts           (D2 Atenção Concentrada)
  ├── bdi.ts          (Beck Depressão)
  ├── bai.ts          (Beck Ansiedade)
  ├── snapiv.ts       (SNAP-IV)
  ├── mchat.ts        (M-CHAT-R/F)
  ├── raven.ts        (Matrizes de Raven)
  └── wms.ts          (Wechsler Memory Scale)

src/components/
  ├── NeuroTestToLForm.tsx
  ├── NeuroTestD2Form.tsx
  ├── NeuroTestBDIForm.tsx
  ├── NeuroTestBAIForm.tsx
  ├── NeuroTestSNAPIVForm.tsx
  ├── NeuroTestMCHATForm.tsx
  ├── NeuroTestRavenForm.tsx
  └── NeuroTestWMSForm.tsx
```

### Arquivos a editar (4 existentes)

- `src/data/neuroTests/index.ts` — registrar os 8 testes
- `src/components/CompleteAttendanceDialog.tsx` — state + save + render dos 8 formulários
- `src/components/NeuroTestResults.tsx` — config de exibição para cada teste
- `src/components/PatientNeuroTestHistory.tsx` — renderização detalhada no histórico

---

### Observação sobre BDI/BAI/SNAP-IV/M-CHAT

Estes testes não geram percentis tradicionais, mas sim classificações diretas (faixas de corte). O sistema já suporta isso via o campo `classifications` no banco. Eles serão exibidos sem coluna "Percentil", mostrando apenas a classificação com cor correspondente.

