
# Padronizar Cores por Unidade em Todo o Sistema

## Problema
As cores das 3 unidades estao definidas de forma duplicada e **inconsistente** em pelo menos 8 arquivos diferentes. Exemplos:
- `PatientCard.tsx`: Floresta = violeta, Atend. Floresta = verde (invertido!)
- `EmployeesNew.tsx`: MADRE = roxo (deveria ser azul)
- `MyPatients.tsx`: Atend. Floresta = teal (deveria ser roxo)

## Padrao de Cores Definido

| Unidade | Cor Principal | Tailwind |
|---|---|---|
| **MADRE (Clinica Social)** | Azul | `blue-500` / `blue-600` |
| **Floresta (Neuroavaliacao)** | Verde | `emerald-500` / `emerald-600` |
| **Atendimento Floresta** | Roxo | `purple-500` / `purple-600` |

## Solucao
Centralizar todas as definicoes de cor no arquivo `src/utils/unitUtils.ts`, criando um objeto unico com todas as variantes necessarias (bg, text, border, gradient, badge, avatar). Depois, substituir as definicoes locais em cada arquivo por imports desse utilitario.

---

## Detalhes Tecnicos

### 1. Expandir `unitUtils.ts`
Adicionar um objeto `UNIT_COLORS` com todas as variantes de estilo:
- `bg` (fundo claro), `text`, `border`, `gradient`, `badge`, `avatar`, `bgLight`, `borderColor`
- Suporte a dark mode em cada variante

### 2. Arquivos a Atualizar (remover definicoes locais)

| Arquivo | O que mudar |
|---|---|
| `src/components/PatientCard.tsx` | Substituir `getUnitConfig()` local por import de `unitUtils` (corrigir floresta: violet->emerald, atend_floresta: emerald->purple) |
| `src/components/ClientDetailsView.tsx` | Substituir `getUnitColorClasses()` local por import |
| `src/components/ScheduleCard.tsx` | Substituir `unitColors` local por import |
| `src/components/PatientQuickViewModal.tsx` | Substituir `unitColors` local por import |
| `src/pages/EmployeesNew.tsx` | Substituir `getUnitStyle()` local (corrigir madre: purple->blue) |
| `src/pages/MyPatients.tsx` | Substituir cores locais (corrigir atend_floresta: teal->purple) |
| `src/components/UserAvatar.tsx` | Verificar consistencia dos gradients de cargo |
| `src/components/ui/enhanced-table.tsx` | Atualizar `UnitBadge` |

### 3. Manter compatibilidade
- O objeto centralizado tera todas as propriedades que os componentes ja usam (label, Icon, gradient, bgLight, textColor, borderColor, badge, avatar)
- Nenhuma mudanca visual alem da correcao das cores invertidas
