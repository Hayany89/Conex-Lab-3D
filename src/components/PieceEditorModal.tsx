import { useState, useId, FormEvent } from 'react';
import {
  X,
  Calculator,
  Wrench,
  ShieldAlert,
  TrendingUp,
  Sparkles,
  Box,
  Check,
  Zap,
  Settings,
  Lightbulb,
  HelpCircle,
  Info,
  Layers,
} from 'lucide-react';
import { PieceItem, MaterialConfig, PrinterConfig, WorkshopSettings } from '../types';
import { calculatePieceCost, formatCurrency, formatNumber } from '../utils/costCalculator';

interface InfillRecommendation {
  id: string;
  category: string;
  label: string;
  range: string;
  recommendedValue: string;
  pattern: string;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
  examples: string;
  benefits: string;
}

const INFILL_RECOMMENDATIONS: InfillRecommendation[] = [
  {
    id: 'aesthetic',
    category: 'Estética / Visual',
    label: 'Peças Estéticas & Visual',
    range: '10% a 15%',
    recommendedValue: '15% Giroide',
    pattern: 'Giroide Leve ou Linhas',
    badgeColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    borderColor: 'border-amber-300',
    examples: 'Action figures, maquetes de arquitetura, estátuas, troféus, capas de exposição e protótipos visuais.',
    benefits: 'Economia máxima de filamento e tempo de impressão muito mais rápido. Foco puramente na casca externa.',
  },
  {
    id: 'functional',
    category: 'Funcional',
    label: 'Peças Funcionais de Uso Geral',
    range: '20% a 30%',
    recommendedValue: '20% Giroide',
    pattern: 'Giroide ou Cúbico',
    badgeColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    examples: 'Cases de eletrônicos, gabinetes, organizadores de bancada, suportes leves e tampas.',
    benefits: 'O padrão de ouro da impressão 3D: equilíbrio ideal entre rigidez estrutural, consumo de peso e tempo.',
  },
  {
    id: 'mechanical',
    category: 'Mecânica',
    label: 'Peças Mecânicas & Carga',
    range: '40% a 60%',
    recommendedValue: '50% Tri-Hexagonal',
    pattern: 'Tri-Hexagonal ou Giroide',
    badgeColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    examples: 'Garras robóticas, engrenagens, suportes de parede/monitor, peças para drones e veículos.',
    benefits: 'Resistência mecânica a torção, vibrações e peso. Mantém a integridade sob tensões contínuas.',
  },
  {
    id: 'solid',
    category: 'Industrial',
    label: 'Industrial & Extrema Resistência',
    range: '80% a 100%',
    recommendedValue: '100% Sólido',
    pattern: 'Retilíneo Concêntrico / 100%',
    badgeColor: 'text-purple-700',
    badgeBg: 'bg-purple-100',
    borderColor: 'border-purple-300',
    examples: 'Buchas de fixação, ferramentas, peças que serão perfuradas ou roscadas com inserts metálicos.',
    benefits: 'Densidade maciça equivalente a termoplástico injetado industrial. Máxima resistência ao impacto.',
  },
];

interface PieceEditorModalProps {
  piece?: PieceItem | null;
  materials: MaterialConfig[];
  printers: PrinterConfig[];
  settings: WorkshopSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (piece: PieceItem) => void;
  onOpenSettings?: () => void;
  onUpdateSettings?: (settings: WorkshopSettings) => void;
}

export function PieceEditorModal({
  piece,
  materials,
  printers,
  settings,
  isOpen,
  onClose,
  onSave,
  onOpenSettings,
  onUpdateSettings,
}: PieceEditorModalProps) {
  const isEditing = Boolean(piece);

  const [formData, setFormData] = useState<PieceItem>(() => {
    if (piece) {
      const currentMat = materials.find((m) => m.id === piece.materialId);
      const currentPrint = printers.find((p) => p.id === piece.printerId);
      return {
        ...piece,
        materialType: piece.materialType || currentMat?.type || 'PLA',
        customMaterialPrice: (piece.customMaterialPrice !== undefined && piece.customMaterialPrice !== null)
          ? piece.customMaterialPrice
          : (currentMat?.spoolPrice || 100),
        printerName: piece.printerName || currentPrint?.name || 'Bambu Lab A1 Combo',
        customPrinterWatts: (piece.customPrinterWatts !== undefined && piece.customPrinterWatts !== null)
          ? piece.customPrinterWatts
          : (currentPrint?.powerWatts || 150),
      };
    }
    const defaultMat = materials[0] || { id: 'mat-1', name: 'PLA Premium', type: 'PLA', spoolPrice: 99.9, color: '#1e293b' };
    const defaultPrint = printers.find((p) => p.name.includes('A1')) || printers[0] || { id: 'print-a1-combo', name: 'Bambu Lab A1 Combo', powerWatts: 150 };

    return {
      id: `piece-${Date.now()}`,
      name: '',
      description: '',
      technology: 'FDM (Filamento)',
      materialId: defaultMat.id,
      materialName: defaultMat.name,
      materialType: defaultMat.type || 'PLA',
      materialColor: defaultMat.color || '#1e293b',
      customMaterialPrice: defaultMat.spoolPrice || 99.9,
      layerHeight: '0.20mm (Balanceado)',
      infill: '20% Giroide',
      finish: 'Natural sem pós-processo',
      printerId: defaultPrint.id,
      printerName: defaultPrint.name,
      customPrinterWatts: defaultPrint.powerWatts,
      weightGrams: 50,
      printTimeHours: 3,
      printTimeMinutes: 0,
      operatorMinutes: 15,
      additionalCosts: 0,
      failureRiskPercent: 10,
      profitMarginPercent: 60,
      customPriceOverride: null,
      quantity: 1,
    };
  });

  const [activeSubTab, setActiveSubTab] = useState<'costs' | 'specs'>('costs');
  const [useCustomPrice, setUseCustomPrice] = useState<boolean>(Boolean(piece?.customPriceOverride && piece.customPriceOverride > 0));
  const [showInfillGuide, setShowInfillGuide] = useState<boolean>(false);
  const [isHoveringInfillGuide, setIsHoveringInfillGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  const calculated = calculatePieceCost(formData, materials, printers, settings);

  const handleMaterialChange = (matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    if (mat) {
      setFormData((prev) => ({
        ...prev,
        materialId: mat.id,
        materialName: mat.name,
        materialType: mat.type,
        materialColor: mat.color || prev.materialColor,
        customMaterialPrice: mat.spoolPrice,
        technology: mat.type === 'Resina' ? 'MSLA / SLA (Resina)' : 'FDM (Filamento)',
      }));
    }
  };

  const handlePrinterChange = (printerId: string) => {
    const pr = printers.find((p) => p.id === printerId);
    if (pr) {
      setFormData((prev) => ({
        ...prev,
        printerId: pr.id,
        printerName: pr.name,
        customPrinterWatts: pr.powerWatts,
      }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalPiece: PieceItem = {
      ...formData,
      customPriceOverride: useCustomPrice ? formData.customPriceOverride : null,
    };
    onSave(finalPiece);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight font-display">
                {isEditing ? 'Editar Peça & Parâmetros de Custo' : 'Nova Peça 3D para o Orçamento'}
              </h2>
              <p className="text-xs text-slate-300">
                Configure os dados técnicos para o cliente e os custos reais de produção
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch inside modal */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('costs')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              activeSubTab === 'costs'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="h-4 w-4 text-indigo-600" />
            <span>Cálculo de Custos & Margem (Interno)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('specs')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              activeSubTab === 'specs'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Especificações para o Cliente</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Info (Always visible) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nome da Peça / Item *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Suporte para Câmera GoPro, Gabinete de Controle..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Quantidade de Unidades
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
              />
            </div>
          </div>

          {activeSubTab === 'costs' ? (
            <div className="space-y-6">
              {/* Cost Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Filament & Machine */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-semibold text-slate-900">1. Material & Filamento</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Editável
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Preset Selector */}
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Predefinição do Catálogo
                      </label>
                      <select
                        value={formData.materialId}
                        onChange={(e) => handleMaterialChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.type}) — {formatCurrency(m.spoolPrice)}/kg
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Editable Filament Type & Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">
                          Tipo de Filamento *
                        </label>
                        <select
                          value={formData.materialType || 'PLA'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              materialType: val,
                              technology: val === 'Resina' ? 'MSLA / SLA (Resina)' : 'FDM (Filamento)',
                            }));
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-indigo-600 outline-none"
                        >
                          <option value="PLA">PLA</option>
                          <option value="PETG">PETG</option>
                          <option value="ABS">ABS</option>
                          <option value="TPU">TPU (Flexível)</option>
                          <option value="ASA">ASA</option>
                          <option value="Nylon">Nylon (PA)</option>
                          <option value="Fibra de Carbono">Fibra de Carbono (CF)</option>
                          <option value="Resina">Resina 405nm</option>
                          <option value="Outro">Outro Especial</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">
                          Valor do Carretel (R$/kg) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={formData.customMaterialPrice ?? 100}
                            onChange={(e) => setFormData({ ...formData, customMaterialPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1">
                        Nome / Marca do Filamento
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: PLA Premium Preto Voolt3D, PETG XT..."
                        value={formData.materialName}
                        onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-800">
                          Peso da Peça (Gramas do Fatiador) *
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Custo: <strong className="text-indigo-700">{formatCurrency(calculated.materialCost)}</strong>
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={formData.weightGrams}
                          onChange={(e) => setFormData({ ...formData, weightGrams: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-14 text-sm font-bold text-slate-900 focus:border-indigo-600 outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                          gramas
                        </span>
                      </div>
                      {/* Detalhamento do cálculo em Kg e rendimento */}
                      <div className="mt-1.5 rounded-lg bg-indigo-50/70 border border-indigo-100 p-2 text-[11px] text-indigo-950 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>Peso em Kg: <strong>{calculated.weightKg.toFixed(3)} kg</strong></span>
                          <span>Rendimento: <strong>{calculated.piecesPerKg > 0 ? calculated.piecesPerKg.toFixed(1) : '0'} pçs / kg</strong></span>
                        </div>
                        <p className="text-[10px] text-indigo-700 font-medium">
                          Cálculo: Custo do Kg ({formatCurrency(formData.customMaterialPrice ?? 100)}) ÷ {calculated.piecesPerKg > 0 ? calculated.piecesPerKg.toFixed(2) : '0'} peças = <strong>{formatCurrency(calculated.materialCost)}</strong>
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-indigo-200/50 mt-1">
                          <span className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Layers className="h-3 w-3 text-indigo-600" />
                            Infill definido: <strong className="text-indigo-950 font-semibold">{formData.infill || '20% Giroide'}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubTab('specs');
                              setShowInfillGuide(true);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                            title="Ver sugestões de preenchimento baseadas na finalidade da peça (Estética, Mecânica, Funcional)"
                          >
                            <Lightbulb className="h-3 w-3 text-amber-500" />
                            <span>Dica de Infill</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Printer section inside machine & material */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-600" />
                          <label className="text-xs font-bold text-slate-900">
                            Impressora 3D
                          </label>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Editável
                        </span>
                      </div>

                      <div>
                        <select
                          value={formData.printerId}
                          onChange={(e) => handlePrinterChange(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 outline-none"
                        >
                          {printers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.powerWatts}W)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                            Nome da Impressora
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Bambu Lab A1 Combo..."
                            value={formData.printerName || ''}
                            onChange={(e) => setFormData({ ...formData, printerName: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                            Potência Média (Watts)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="10"
                              max="3000"
                              value={formData.customPrinterWatts ?? 95}
                              onChange={(e) => setFormData({ ...formData, customPrinterWatts: Math.max(1, parseInt(e.target.value) || 0) })}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 pr-8 text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                            />
                            <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400">W</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Consumo: {((formData.customPrinterWatts ?? 95) / 1000).toFixed(3)} kW
                          </span>
                        </div>
                      </div>

                      {onOpenSettings && (
                        <button
                          type="button"
                          onClick={onOpenSettings}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-medium pt-1"
                        >
                          <Settings className="h-3 w-3" />
                          Configurar catálogo de impressoras e materiais da oficina
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Print Time & Energy */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                    <Calculator className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-slate-900">2. Tempo de Impressão & Mão de Obra</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-700">
                          Tempo de Máquina (Horas e Minutos)
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Energia: <strong className="text-indigo-700">{formatCurrency(calculated.energyCost)}</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={formData.printTimeHours}
                            onChange={(e) => setFormData({ ...formData, printTimeHours: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">h</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={formData.printTimeMinutes}
                            onChange={(e) => setFormData({ ...formData, printTimeMinutes: Math.max(0, Math.min(59, parseInt(e.target.value) || 0)) })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">min</span>
                        </div>
                      </div>
                      <div className="mt-2 rounded-lg bg-amber-50/70 border border-amber-200/80 p-2 text-[11px] text-amber-950 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-semibold text-amber-900">
                            <Zap className="h-3.5 w-3.5 text-amber-600" />
                            Consumo: <strong>{calculated.kwhConsumed.toFixed(3)} kWh</strong> ({formatCurrency(calculated.energyCost)})
                          </span>
                          <span className="text-amber-800 font-medium">
                            {formatCurrency(calculated.hourlyEnergyCost)} / hora
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-amber-800/90 pt-0.5 border-t border-amber-200/50">
                          <span>Potência: {calculated.powerKw.toFixed(3)} kW (~90-95W) • Tarifa: {formatCurrency(settings.kwhCost || 0.89)}/kWh</span>
                          <span>Depreciação: {formatCurrency(calculated.depreciationCost)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Mão de Obra Técnica (Fatiamento + Remoção + Acabamento)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={formData.operatorMinutes}
                          onChange={(e) => setFormData({ ...formData, operatorMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-12 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">minutos</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Custo operador: {formatCurrency(calculated.laborCost)} (Taxa {formatCurrency(settings.operatorHourlyRate)}/h)
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Insumos Extras (Insertos de latão, parafusos, imãs, embalagem)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={formData.additionalCosts}
                          onChange={(e) => setFormData({ ...formData, additionalCosts: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk & Profit Margin Bar */}
              <div className="rounded-xl border border-slate-200 bg-indigo-50/40 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-slate-900">3. Risco de Perda & Margem de Lucro</h3>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={useCustomPrice}
                      onChange={(e) => {
                        setUseCustomPrice(e.target.checked);
                        if (e.target.checked && !formData.customPriceOverride) {
                          setFormData({ ...formData, customPriceOverride: Math.round(calculated.unitPrice) });
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Definir Preço Manualmente</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        Risco de Falha / Perda de Impressão
                      </label>
                      <span className="text-xs font-bold text-slate-900">{formData.failureRiskPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="35"
                      step="1"
                      value={formData.failureRiskPercent}
                      onChange={(e) => setFormData({ ...formData, failureRiskPercent: parseInt(e.target.value) || 0 })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500">
                      Adiciona cobertura para possíveis falhas de filamento, bico entupido ou delaminação.
                    </p>
                  </div>

                  {useCustomPrice ? (
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Preço de Venda Unitário Manual (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={formData.customPriceOverride || ''}
                          onChange={(e) => setFormData({ ...formData, customPriceOverride: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-indigo-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none font-semibold"
                        />
                      </div>
                      <p className="text-[11px] text-indigo-700 font-medium mt-1">
                        Lucro resultante: {formatCurrency(calculated.unitProfit)} ({formatNumber(calculated.profitPercentage, 0)}%)
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-700">
                          Margem de Lucro Desejada
                        </label>
                        <span className="text-xs font-bold text-emerald-700">{formData.profitMarginPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="250"
                        step="5"
                        value={formData.profitMarginPercent}
                        onChange={(e) => setFormData({ ...formData, profitMarginPercent: parseInt(e.target.value) || 0 })}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-500">
                        Aplicada sobre o custo total de fabricação (peça + máquina + energia + mão de obra).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Cost Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <span className="text-[11px] font-medium text-slate-500 block">Custo de Produção (Unit.)</span>
                  <span className="text-base font-bold text-slate-900 block mt-0.5">
                    {formatCurrency(calculated.costWithRisk)}
                  </span>
                  <span className="text-[10px] text-slate-400">Inclui material, energia e máquina</span>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <span className="text-[11px] font-medium text-emerald-700 block">Lucro Líquido (Unit.)</span>
                  <span className="text-base font-bold text-emerald-800 block mt-0.5">
                    +{formatCurrency(calculated.unitProfit)}
                  </span>
                  <span className="text-[10px] text-emerald-600">{formatNumber(calculated.profitPercentage, 0)}% sobre custo</span>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
                  <span className="text-[11px] font-medium text-indigo-700 block">Preço de Venda (Unit.)</span>
                  <span className="text-base font-bold text-indigo-950 block mt-0.5">
                    {formatCurrency(calculated.unitPrice)}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">Preço visível ao cliente</span>
                </div>

                <div className="rounded-xl border border-slate-900 bg-slate-900 text-white p-3">
                  <span className="text-[11px] font-medium text-slate-300 block">Total ({formData.quantity}x unidades)</span>
                  <span className="text-base font-bold text-white block mt-0.5">
                    {formatCurrency(calculated.totalPrice)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Lucro Total: +{formatCurrency(calculated.totalProfit)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Specifications for Client tab */
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-800 flex items-start gap-2">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>Importante:</strong> Estas especificações aparecerão claramente na proposta do cliente e no PDF gerado. Os custos internos (filamento, eletricidade, horas gastas) NÃO serão mostrados.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Descrição Técnica / Finalidade da Peça
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Case protetor com encaixes precisos, fixação por parafusos M3, uso em ambiente interno."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tecnologia de Impressão</label>
                  <select
                    value={formData.technology}
                    onChange={(e) => setFormData({ ...formData, technology: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  >
                    <option value="FDM (Filamento)">FDM (Filamento Termoplástico)</option>
                    <option value="MSLA / SLA (Resina)">MSLA / SLA (Resina Fotopolimérica)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Cor do Material</label>
                  <input
                    type="text"
                    placeholder="Ex: Preto Fosco, Cinza Industrial, Laranja"
                    value={formData.materialColor}
                    onChange={(e) => setFormData({ ...formData, materialColor: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Altura de Camada (Resolução)</label>
                  <input
                    type="text"
                    placeholder="Ex: 0.20mm (Padrão), 0.12mm (Alta Definição)"
                    value={formData.layerHeight}
                    onChange={(e) => setFormData({ ...formData, layerHeight: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-indigo-600" />
                      Preenchimento (Infill)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInfillGuide(!showInfillGuide)}
                      onMouseEnter={() => setIsHoveringInfillGuide(true)}
                      onMouseLeave={() => setIsHoveringInfillGuide(false)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                        showInfillGuide
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-amber-50/80 hover:bg-amber-100 text-amber-700 border-amber-200'
                      }`}
                      title="Clique para fixar ou passe o mouse para ver dicas de infill por finalidade da peça (Estética, Mecânica, Funcional)"
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                      <span>Dica de Infill</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: 20% Giroide, 50% Tri-Hexagonal, 100% Sólido"
                    value={formData.infill}
                    onChange={(e) => setFormData({ ...formData, infill: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] font-medium text-slate-400">Sugestões:</span>
                    {INFILL_RECOMMENDATIONS.map((rec) => {
                      const isSelected = formData.infill === rec.recommendedValue;
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, infill: rec.recommendedValue })}
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                          }`}
                          title={`Aplicar ${rec.recommendedValue} (${rec.label})`}
                        >
                          {rec.category.split('/')[0].trim()} ({rec.range})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Acabamento Superficial</label>
                  <input
                    type="text"
                    placeholder="Ex: Natural sem suportes, Lixado e polido, Pós-cura UV completa"
                    value={formData.finish}
                    onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  />
                </div>

                {/* Infill Guidance Card (Triggered by button click or hover) */}
                {(showInfillGuide || isHoveringInfillGuide) && (
                  <div
                    className="col-span-full rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-indigo-50/50 p-4 shadow-lg space-y-3.5 transition-all"
                    onMouseEnter={() => setIsHoveringInfillGuide(true)}
                    onMouseLeave={() => setIsHoveringInfillGuide(false)}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              Guia Prático de Preenchimento (Infill)
                            </h4>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Por Finalidade da Peça
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Passe o mouse para ler e clique em qualquer botão <strong>"Usar..."</strong> para aplicar o valor na peça.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInfillGuide(false);
                          setIsHoveringInfillGuide(false);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                        title="Fechar guia de infill"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 4 Purpose Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {INFILL_RECOMMENDATIONS.map((rec) => {
                        const isSelected = formData.infill === rec.recommendedValue;
                        return (
                          <div
                            key={rec.id}
                            className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-400'
                                : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.badgeBg} ${rec.badgeColor}`}
                                >
                                  {rec.category}
                                </span>
                                <span className="text-xs font-black text-slate-900">{rec.range}</span>
                              </div>

                              <h5 className="text-xs font-bold text-slate-900 leading-tight">{rec.label}</h5>

                              <div className="space-y-1 text-[11px]">
                                <p className="text-slate-600">
                                  <strong className="text-slate-700 font-semibold">Uso:</strong> {rec.examples}
                                </p>
                                <p className="text-slate-500 text-[10px]">
                                  Padrão: <strong className="text-slate-700">{rec.pattern}</strong>
                                </p>
                                <p className="text-slate-500 text-[10px] italic leading-tight">
                                  {rec.benefits}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, infill: rec.recommendedValue });
                              }}
                              className={`mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Selecionado</span>
                                </>
                              ) : (
                                <>
                                  <span>Usar {rec.recommendedValue}</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pro Engineering Tip */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-xs text-amber-950 flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Dica de Resistência 3D:</strong> Para peças com esforços mecânicos, aumentar o número de <strong>paredes externas / perímetros (4 a 6 voltas)</strong> gera até <em>40% mais resistência mecânica</em> do que aumentar o infill acima de 50%, com menos material e menor tempo de impressão!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition"
            >
              <Check className="h-4 w-4" />
              <span>{isEditing ? 'Salvar Alterações' : 'Adicionar ao Orçamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
