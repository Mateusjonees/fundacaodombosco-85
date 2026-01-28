
# Plano: Corrigir Layout do Dialog de Finalizar Atendimento

## Problema Identificado

O dialog "Finalizar Atendimento" esta cortando o conteudo. O usuario nao consegue ver:
- Todos os subtestes do BPA-2 (AD e AA estao cortados)
- A secao "Atencao Geral (AG)"
- A secao "Materiais Utilizados"
- A secao "Evolucao do Atendimento"

## Solucoes a Implementar

### 1. Ajustar o DialogContent
- Configurar altura maxima adequada para o dialog
- Garantir que o ScrollArea funcione corretamente
- Adicionar padding adequado

### 2. Reorganizar Componentes

Ordem das secoes no dialog:
1. **Testes Neuropsicologicos** (seletor de testes)
2. **Formulario BPA-2** (quando selecionado)
3. **Materiais Utilizados** (opcional, colapsado por padrao para economizar espaco)
4. **Evolucao do Atendimento** (textarea principal - sempre visivel)

### 3. Otimizar o BPA-2 Form
- Compactar um pouco os espacamentos
- Manter todos os campos visiveis com scroll

### 4. Melhorar Estrutura do Dialog

```text
+--------------------------------------------------+
| Finalizar Atendimento                        [X] |
| Paciente: Nome • Hora • Idade                    |
+--------------------------------------------------+
|                                                  |
| [ScrollArea com altura fixa]                     |
|                                                  |
| +----------------------------------------------+ |
| | Testes Neuropsicologicos    [Idade: XX anos]| |
| | [BPA-2 x]                                    | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | BPA-2 - Form                            [X]  | |
| | AC: [A] [E] [O] = XX | Percentil XX          | |
| | AD: [A] [E] [O] = XX | Percentil XX          | |
| | AA: [A] [E] [O] = XX | Percentil XX          | |
| | AG = XX | Percentil XX | Classificacao       | |
| | Observacoes do teste: [________]             | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | Materiais Utilizados (opcional)              | |
| | [Buscar...] [Lista colapsavel]               | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | Evolucao do Atendimento *                    | |
| | [Textarea grande para descricao]             | |
| +----------------------------------------------+ |
|                                                  |
+--------------------------------------------------+
| [Cancelar]               [Finalizar Atendimento] |
+--------------------------------------------------+
```

---

## Arquivos a Modificar

### 1. `src/components/CompleteAttendanceDialog.tsx`

Mudancas:
- Ajustar altura do ScrollArea: `max-h-[calc(90vh-180px)]`
- Garantir que o Dialog tenha altura maxima correta
- Adicionar visual de separacao entre secoes
- Mover "Evolucao do Atendimento" para ter destaque

### 2. `src/components/NeuroTestBPA2Form.tsx`

Mudancas:
- Compactar espacamentos (p-2 ao inves de p-3 em alguns lugares)
- Reduzir altura minima do textarea de observacoes
- Manter legibilidade mas otimizar espaco vertical

### 3. `src/components/AttendanceMaterialSelector.tsx`

Mudancas:
- Adicionar Collapsible para expandir/recolher a lista de materiais
- Mostrar apenas os selecionados por padrao
- Expandir busca quando o usuario quiser adicionar

---

## Resultado Esperado

Apos as mudancas:
- Todo o conteudo do dialog sera acessivel via scroll
- O formulario BPA-2 ficara visivel por completo
- A secao "Evolucao do Atendimento" estara sempre presente e visivel
- O layout ficara organizado e funcional para uso diario
- Materiais serao opcionais e nao ocuparao espaco desnecessario
