

## Testes Neuropsicológicos Adicionais Disponíveis para Implementação

### Testes já no sistema (32 testes)
BPA-2, FDT, RAVLT, TIN, PCFO, TSBC, FVA, BNT-BR, Trilhas, TMT Adulto, Trilhas Pré-Escolar, FAS, Hayling Adulto/Infantil, TFV, TOM, Taylor, TRPP, FPT Adulto/Infantil, Figuras de Rey, Stroop, WCST, WAIS/WISC, Torre de Londres, D2, BDI-II, BAI, SNAP-IV, M-CHAT, Raven, WMS.

---

### Testes que podem ser adicionados

#### Rastreamento Cognitivo
| Teste | Público | Uso |
|-------|---------|-----|
| **MoCA** (Montreal Cognitive Assessment) | 18-90 anos | Rastreamento de declínio cognitivo leve |
| **Mini Mental (MEEM)** | 18-90 anos | Rastreamento de demência |
| **ACE-III** (Addenbrooke's) | 40-90 anos | Avaliação cognitiva breve (atenção, memória, fluência, linguagem, visuoespacial) |

#### Funções Executivas e Atenção
| Teste | Público | Uso |
|-------|---------|-----|
| **BRIEF / BRIEF-2** | 5-18 anos | Inventário de funções executivas (questionário para pais/professores) |
| **Cubos de Corsi** | 6-89 anos | Memória de trabalho visuoespacial (span direto/inverso) |
| **Teste de Cancelamento (AC)** | 6-14 anos | Atenção concentrada visual |

#### Escalas Comportamentais e Emocionais
| Teste | Público | Uso |
|-------|---------|-----|
| **CBCL** (Child Behavior Checklist) | 6-18 anos | Perfil comportamental/emocional amplo |
| **Escala Conners 3** | 6-18 anos | Avaliação de TDAH (pais/professores) |
| **Vineland-3** | 0-90 anos | Comportamento adaptativo (comunicação, socialização, vida diária) |
| **SDQ** (Strengths and Difficulties) | 4-17 anos | Rastreamento de dificuldades emocionais/comportamentais |
| **GDS** (Escala de Depressão Geriátrica) | 60+ anos | Depressão em idosos (15 ou 30 itens) |

#### Linguagem e Aprendizagem
| Teste | Público | Uso |
|-------|---------|-----|
| **TDE-II** (Teste de Desempenho Escolar) | 6-14 anos | Leitura, escrita e aritmética |
| **NEUPSILIN** | 12-90 anos | Avaliação neuropsicológica breve (orientação, atenção, percepção, memória, linguagem, praxias) |

---

### Recomendação de prioridade

Sugiro implementar em **2 blocos**:

**Bloco 1 (mais usados em laudos):**
- MoCA, Mini Mental, BRIEF-2, Cubos de Corsi, Conners 3, Vineland-3

**Bloco 2 (complementares):**
- ACE-III, CBCL, SDQ, GDS, TDE-II, NEUPSILIN, Teste de Cancelamento

### Implementação técnica

Cada teste seguirá o mesmo padrão existente:
1. Arquivo de dados em `src/data/neuroTests/` com definição, normas e funções de cálculo
2. Componente de formulário em `src/components/NeuroTest[Nome]Form.tsx`
3. Integração no `index.ts`, `CompleteAttendanceDialog`, `NeuroTestResults` e `PatientNeuroTestHistory`

Testes como BRIEF, Conners, CBCL, SDQ e Vineland são escalas com classificação por faixas (como BDI/BAI), sem percentil tradicional. MoCA e MEEM usam pontos de corte por escolaridade. Cubos de Corsi usa span direto/inverso com normas por idade.

