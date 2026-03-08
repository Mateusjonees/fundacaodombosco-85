import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Apple, Ruler, Weight, Activity, Droplets, Heart, Baby, ClipboardList, AlertTriangle, Utensils, TrendingUp } from 'lucide-react';

export interface NutritionData {
  // Antropometria
  peso?: string;
  altura?: string;
  imc?: string;
  classificacaoIMC?: string;
  circunferenciaAbdominal?: string;
  circunferenciaBraco?: string;
  circunferenciaPanturrilha?: string;
  circunferenciaCintura?: string;
  circunferenciaQuadril?: string;
  rcq?: string; // relação cintura-quadril
  percentualGordura?: string;
  massaMagra?: string;
  massaGorda?: string;
  pesoIdeal?: string;
  adequacaoPeso?: string;
  
  // Sinais vitais relacionados
  pressaoArterial?: string;
  glicemiaCapilar?: string;
  
  // Avaliação clínica
  estadoNutricional?: string;
  sinaisCarenciais?: string;
  edicaoUngueal?: string;
  condicaoCabelo?: string;
  condicaoPele?: string;
  presencaEdema?: string;
  localEdema?: string;
  
  // Histórico alimentar
  recordatorio24h?: string;
  frequenciaAlimentar?: string;
  restricoesAlimentares?: string;
  alergias?: string;
  intolerâncias?: string;
  suplementosEmUso?: string;
  apetite?: string;
  mastigacao?: string;
  degluticao?: string;
  habitoIntestinal?: string;
  ingestaoHidrica?: string;
  consumoAlcool?: string;
  
  // Exames laboratoriais
  hemoglobina?: string;
  hematocrito?: string;
  ferritina?: string;
  vitaminaD?: string;
  vitaminaB12?: string;
  acFolico?: string;
  glicemiaJejum?: string;
  hemoglobinaGlicada?: string;
  colesterolTotal?: string;
  hdl?: string;
  ldl?: string;
  triglicerideos?: string;
  tgo?: string;
  tgp?: string;
  creatinina?: string;
  ureia?: string;
  acidoUrico?: string;
  tsh?: string;
  t4Livre?: string;
  albumina?: string;
  proteínasTotais?: string;
  
  // Conduta e planejamento
  diagnosticoNutricional?: string;
  objetivosTratamento?: string;
  condutaNutricional?: string;
  orientacoesDadas?: string;
  metaCalorica?: string;
  distribuicaoMacros?: string;
  planoAlimentarEntregue?: string;
  retornoAgendado?: string;
  encaminhamentos?: string;
}

interface NutritionAssessmentFormProps {
  data: NutritionData;
  onChange: (data: NutritionData) => void;
}

// Calcula IMC automaticamente
const calcularIMC = (peso: string, altura: string): { imc: string; classificacao: string } => {
  const p = parseFloat(peso);
  const a = parseFloat(altura) / 100; // cm -> m
  if (!p || !a || a <= 0) return { imc: '', classificacao: '' };
  const imc = p / (a * a);
  let classificacao = '';
  if (imc < 18.5) classificacao = 'Baixo peso';
  else if (imc < 25) classificacao = 'Eutrófico';
  else if (imc < 30) classificacao = 'Sobrepeso';
  else if (imc < 35) classificacao = 'Obesidade Grau I';
  else if (imc < 40) classificacao = 'Obesidade Grau II';
  else classificacao = 'Obesidade Grau III';
  return { imc: imc.toFixed(1), classificacao };
};

// Calcula RCQ
const calcularRCQ = (cintura: string, quadril: string): string => {
  const c = parseFloat(cintura);
  const q = parseFloat(quadril);
  if (!c || !q || q <= 0) return '';
  return (c / q).toFixed(2);
};

export default function NutritionAssessmentForm({ data, onChange }: NutritionAssessmentFormProps) {
  const update = (field: keyof NutritionData, value: string) => {
    const newData = { ...data, [field]: value };
    
    // Auto-calcular IMC
    if (field === 'peso' || field === 'altura') {
      const { imc, classificacao } = calcularIMC(
        field === 'peso' ? value : (data.peso || ''),
        field === 'altura' ? value : (data.altura || '')
      );
      newData.imc = imc;
      newData.classificacaoIMC = classificacao;
    }
    
    // Auto-calcular RCQ
    if (field === 'circunferenciaCintura' || field === 'circunferenciaQuadril') {
      newData.rcq = calcularRCQ(
        field === 'circunferenciaCintura' ? value : (data.circunferenciaCintura || ''),
        field === 'circunferenciaQuadril' ? value : (data.circunferenciaQuadril || '')
      );
    }
    
    onChange(newData);
  };

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Apple className="h-5 w-5 text-green-600" />
          Avaliação Nutricional
          <Badge variant="outline" className="text-green-600 border-green-500/30 text-[10px]">
            Nutricionista
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Todos os campos são opcionais. Preencha o que for relevante para esta consulta.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        
        {/* ANTROPOMETRIA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-semibold">Antropometria</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Peso (kg)</Label>
              <Input type="number" step="0.1" placeholder="Ex: 72.5" value={data.peso || ''} onChange={e => update('peso', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Altura (cm)</Label>
              <Input type="number" step="0.1" placeholder="Ex: 165" value={data.altura || ''} onChange={e => update('altura', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">IMC (auto)</Label>
              <div className="flex items-center gap-1">
                <Input readOnly value={data.imc || ''} className="h-8 text-sm bg-muted/50" />
                {data.classificacaoIMC && (
                  <Badge variant="outline" className="text-[9px] shrink-0 whitespace-nowrap">
                    {data.classificacaoIMC}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">Circ. Abdominal (cm)</Label>
              <Input type="number" step="0.1" placeholder="cm" value={data.circunferenciaAbdominal || ''} onChange={e => update('circunferenciaAbdominal', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Circ. Braço (cm)</Label>
              <Input type="number" step="0.1" placeholder="cm" value={data.circunferenciaBraco || ''} onChange={e => update('circunferenciaBraco', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Circ. Panturrilha (cm)</Label>
              <Input type="number" step="0.1" placeholder="cm" value={data.circunferenciaPanturrilha || ''} onChange={e => update('circunferenciaPanturrilha', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Circ. Cintura (cm)</Label>
              <Input type="number" step="0.1" placeholder="cm" value={data.circunferenciaCintura || ''} onChange={e => update('circunferenciaCintura', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Circ. Quadril (cm)</Label>
              <Input type="number" step="0.1" placeholder="cm" value={data.circunferenciaQuadril || ''} onChange={e => update('circunferenciaQuadril', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">RCQ (auto)</Label>
              <Input readOnly value={data.rcq || ''} className="h-8 text-sm bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs">% Gordura Corporal</Label>
              <Input type="number" step="0.1" placeholder="%" value={data.percentualGordura || ''} onChange={e => update('percentualGordura', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Massa Magra (kg)</Label>
              <Input type="number" step="0.1" placeholder="kg" value={data.massaMagra || ''} onChange={e => update('massaMagra', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Massa Gorda (kg)</Label>
              <Input type="number" step="0.1" placeholder="kg" value={data.massaGorda || ''} onChange={e => update('massaGorda', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Peso Ideal (kg)</Label>
              <Input type="number" step="0.1" placeholder="kg" value={data.pesoIdeal || ''} onChange={e => update('pesoIdeal', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Adequação de Peso (%)</Label>
              <Input type="number" step="0.1" placeholder="%" value={data.adequacaoPeso || ''} onChange={e => update('adequacaoPeso', e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>

        <Separator />

        {/* SINAIS VITAIS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <h4 className="text-sm font-semibold">Sinais Vitais</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Pressão Arterial (mmHg)</Label>
              <Input placeholder="Ex: 120/80" value={data.pressaoArterial || ''} onChange={e => update('pressaoArterial', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Glicemia Capilar (mg/dL)</Label>
              <Input type="number" placeholder="mg/dL" value={data.glicemiaCapilar || ''} onChange={e => update('glicemiaCapilar', e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>

        <Separator />

        {/* AVALIAÇÃO CLÍNICA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-semibold">Avaliação Clínica</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Estado Nutricional</Label>
              <Select value={data.estadoNutricional || ''} onValueChange={v => update('estadoNutricional', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desnutricao_grave">Desnutrição Grave</SelectItem>
                  <SelectItem value="desnutricao_moderada">Desnutrição Moderada</SelectItem>
                  <SelectItem value="desnutricao_leve">Desnutrição Leve</SelectItem>
                  <SelectItem value="eutrofico">Eutrófico</SelectItem>
                  <SelectItem value="sobrepeso">Sobrepeso</SelectItem>
                  <SelectItem value="obesidade_1">Obesidade Grau I</SelectItem>
                  <SelectItem value="obesidade_2">Obesidade Grau II</SelectItem>
                  <SelectItem value="obesidade_3">Obesidade Grau III</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Condição da Pele</Label>
              <Select value={data.condicaoPele || ''} onValueChange={v => update('condicaoPele', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="ressecada">Ressecada</SelectItem>
                  <SelectItem value="descamativa">Descamativa</SelectItem>
                  <SelectItem value="palidez">Palidez</SelectItem>
                  <SelectItem value="ictericia">Icterícia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Condição do Cabelo</Label>
              <Select value={data.condicaoCabelo || ''} onValueChange={v => update('condicaoCabelo', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="opaco">Opaco</SelectItem>
                  <SelectItem value="quebradiço">Quebradiço</SelectItem>
                  <SelectItem value="queda">Queda acentuada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Edição Ungueal</Label>
              <Select value={data.edicaoUngueal || ''} onValueChange={v => update('edicaoUngueal', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="quebradiças">Quebradiças</SelectItem>
                  <SelectItem value="coiloniquia">Coiloníquia</SelectItem>
                  <SelectItem value="estriadas">Estriadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Presença de Edema</Label>
              <Select value={data.presencaEdema || ''} onValueChange={v => update('presencaEdema', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ausente">Ausente</SelectItem>
                  <SelectItem value="leve">Leve (+)</SelectItem>
                  <SelectItem value="moderado">Moderado (++)</SelectItem>
                  <SelectItem value="grave">Grave (+++)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Local do Edema</Label>
              <Input placeholder="Ex: MMII, face" value={data.localEdema || ''} onChange={e => update('localEdema', e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Sinais Carenciais Observados</Label>
            <Textarea placeholder="Descreva sinais de deficiência nutricional observados..." value={data.sinaisCarenciais || ''} onChange={e => update('sinaisCarenciais', e.target.value)} className="min-h-[60px] text-sm resize-none" />
          </div>
        </div>

        <Separator />

        {/* HISTÓRICO ALIMENTAR */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-orange-500" />
            <h4 className="text-sm font-semibold">Avaliação Dietética</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Apetite</Label>
              <Select value={data.apetite || ''} onValueChange={v => update('apetite', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="aumentado">Aumentado</SelectItem>
                  <SelectItem value="diminuido">Diminuído</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                  <SelectItem value="seletivo">Seletivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mastigação</Label>
              <Select value={data.mastigacao || ''} onValueChange={v => update('mastigacao', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="dificuldade">Com dificuldade</SelectItem>
                  <SelectItem value="prejudicada">Prejudicada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Deglutição</Label>
              <Select value={data.degluticao || ''} onValueChange={v => update('degluticao', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="disfagia_leve">Disfagia Leve</SelectItem>
                  <SelectItem value="disfagia_moderada">Disfagia Moderada</SelectItem>
                  <SelectItem value="disfagia_grave">Disfagia Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Hábito Intestinal</Label>
              <Select value={data.habitoIntestinal || ''} onValueChange={v => update('habitoIntestinal', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="constipacao">Constipação</SelectItem>
                  <SelectItem value="diarreia">Diarreia</SelectItem>
                  <SelectItem value="alternado">Alternado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ingestão Hídrica (L/dia)</Label>
              <Input type="number" step="0.1" placeholder="Ex: 2.0" value={data.ingestaoHidrica || ''} onChange={e => update('ingestaoHidrica', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Consumo de Álcool</Label>
              <Select value={data.consumoAlcool || ''} onValueChange={v => update('consumoAlcool', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não consome</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="frequente">Frequente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Recordatório 24h</Label>
            <Textarea placeholder="Café da manhã, lanche, almoço, lanche da tarde, jantar, ceia..." value={data.recordatorio24h || ''} onChange={e => update('recordatorio24h', e.target.value)} className="min-h-[80px] text-sm resize-none" />
          </div>
          <div>
            <Label className="text-xs">Frequência Alimentar</Label>
            <Textarea placeholder="Frequência de consumo de grupos alimentares (frutas, verduras, proteínas, carboidratos, ultraprocessados...)" value={data.frequenciaAlimentar || ''} onChange={e => update('frequenciaAlimentar', e.target.value)} className="min-h-[60px] text-sm resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Restrições Alimentares</Label>
              <Input placeholder="Ex: vegetariano, sem glúten..." value={data.restricoesAlimentares || ''} onChange={e => update('restricoesAlimentares', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Alergias Alimentares</Label>
              <Input placeholder="Ex: leite, ovo, amendoim..." value={data.alergias || ''} onChange={e => update('alergias', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Intolerâncias</Label>
              <Input placeholder="Ex: lactose, frutose..." value={data.intolerâncias || ''} onChange={e => update('intolerâncias', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Suplementos em Uso</Label>
              <Input placeholder="Ex: Whey, vitamina D, creatina..." value={data.suplementosEmUso || ''} onChange={e => update('suplementosEmUso', e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>

        <Separator />

        {/* EXAMES LABORATORIAIS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-purple-500" />
            <h4 className="text-sm font-semibold">Exames Laboratoriais (último disponível)</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Hemoglobina (g/dL)</Label>
              <Input type="number" step="0.1" value={data.hemoglobina || ''} onChange={e => update('hemoglobina', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Hematócrito (%)</Label>
              <Input type="number" step="0.1" value={data.hematocrito || ''} onChange={e => update('hematocrito', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Ferritina (ng/mL)</Label>
              <Input type="number" step="0.1" value={data.ferritina || ''} onChange={e => update('ferritina', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Vitamina D (ng/mL)</Label>
              <Input type="number" step="0.1" value={data.vitaminaD || ''} onChange={e => update('vitaminaD', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Vitamina B12 (pg/mL)</Label>
              <Input type="number" step="0.1" value={data.vitaminaB12 || ''} onChange={e => update('vitaminaB12', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Ácido Fólico (ng/mL)</Label>
              <Input type="number" step="0.1" value={data.acFolico || ''} onChange={e => update('acFolico', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Glicemia Jejum (mg/dL)</Label>
              <Input type="number" step="0.1" value={data.glicemiaJejum || ''} onChange={e => update('glicemiaJejum', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">HbA1c (%)</Label>
              <Input type="number" step="0.1" value={data.hemoglobinaGlicada || ''} onChange={e => update('hemoglobinaGlicada', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Colesterol Total</Label>
              <Input type="number" step="0.1" value={data.colesterolTotal || ''} onChange={e => update('colesterolTotal', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">HDL (mg/dL)</Label>
              <Input type="number" step="0.1" value={data.hdl || ''} onChange={e => update('hdl', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">LDL (mg/dL)</Label>
              <Input type="number" step="0.1" value={data.ldl || ''} onChange={e => update('ldl', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Triglicerídeos (mg/dL)</Label>
              <Input type="number" step="0.1" value={data.triglicerideos || ''} onChange={e => update('triglicerideos', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">TGO (U/L)</Label>
              <Input type="number" step="0.1" value={data.tgo || ''} onChange={e => update('tgo', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">TGP (U/L)</Label>
              <Input type="number" step="0.1" value={data.tgp || ''} onChange={e => update('tgp', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Creatinina (mg/dL)</Label>
              <Input type="number" step="0.1" value={data.creatinina || ''} onChange={e => update('creatinina', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Ureia (mg/dL)</Label>
              <Input type="number" step="0.1" value={data.ureia || ''} onChange={e => update('ureia', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Ácido Úrico (mg/dL)</Label>
              <Input type="number" step="0.1" value={data.acidoUrico || ''} onChange={e => update('acidoUrico', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">TSH (mUI/L)</Label>
              <Input type="number" step="0.01" value={data.tsh || ''} onChange={e => update('tsh', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">T4 Livre (ng/dL)</Label>
              <Input type="number" step="0.01" value={data.t4Livre || ''} onChange={e => update('t4Livre', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Albumina (g/dL)</Label>
              <Input type="number" step="0.1" value={data.albumina || ''} onChange={e => update('albumina', e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>

        <Separator />

        {/* CONDUTA E PLANEJAMENTO */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-semibold">Conduta e Planejamento</h4>
          </div>
          <div>
            <Label className="text-xs">Diagnóstico Nutricional</Label>
            <Textarea placeholder="Diagnóstico nutricional baseado na avaliação..." value={data.diagnosticoNutricional || ''} onChange={e => update('diagnosticoNutricional', e.target.value)} className="min-h-[60px] text-sm resize-none" />
          </div>
          <div>
            <Label className="text-xs">Objetivos do Tratamento</Label>
            <Textarea placeholder="Metas e objetivos nutricionais..." value={data.objetivosTratamento || ''} onChange={e => update('objetivosTratamento', e.target.value)} className="min-h-[60px] text-sm resize-none" />
          </div>
          <div>
            <Label className="text-xs">Conduta Nutricional</Label>
            <Textarea placeholder="Conduta adotada nesta consulta..." value={data.condutaNutricional || ''} onChange={e => update('condutaNutricional', e.target.value)} className="min-h-[60px] text-sm resize-none" />
          </div>
          <div>
            <Label className="text-xs">Orientações Fornecidas</Label>
            <Textarea placeholder="Orientações dadas ao paciente/responsável..." value={data.orientacoesDadas || ''} onChange={e => update('orientacoesDadas', e.target.value)} className="min-h-[60px] text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Meta Calórica (kcal/dia)</Label>
              <Input type="number" placeholder="Ex: 2000" value={data.metaCalorica || ''} onChange={e => update('metaCalorica', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Distribuição de Macros</Label>
              <Input placeholder="Ex: CHO 55%, PTN 20%, LIP 25%" value={data.distribuicaoMacros || ''} onChange={e => update('distribuicaoMacros', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Plano Alimentar Entregue?</Label>
              <Select value={data.planoAlimentarEntregue || ''} onValueChange={v => update('planoAlimentarEntregue', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="ajustado">Ajustado plano anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Retorno Agendado</Label>
              <Input placeholder="Ex: 30 dias, 15 dias..." value={data.retornoAgendado || ''} onChange={e => update('retornoAgendado', e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Encaminhamentos</Label>
              <Input placeholder="Ex: Endocrinologista, exames lab..." value={data.encaminhamentos || ''} onChange={e => update('encaminhamentos', e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
