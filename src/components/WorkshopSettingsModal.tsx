import { useState, useEffect, FormEvent } from 'react';
import { X, Settings, Plus, Trash2, Check, Zap, Coins, Building2, Wrench, Layers, CreditCard, QrCode } from 'lucide-react';
import { WorkshopSettings, MaterialConfig, PrinterConfig } from '../types';
import { formatCurrency } from '../utils/costCalculator';

interface WorkshopSettingsModalProps {
  settings: WorkshopSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: WorkshopSettings) => void;
  initialTab?: 'materials' | 'printers' | 'rates' | 'company';
}

export function WorkshopSettingsModal({
  settings,
  isOpen,
  onClose,
  onSave,
  initialTab = 'materials',
}: WorkshopSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'materials' | 'printers' | 'rates' | 'company'>(initialTab);
  const [formData, setFormData] = useState<WorkshopSettings>({ ...settings });

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab, settings]);

  if (!isOpen) return null;

  // Add Material
  const handleAddMaterial = () => {
    const newMat: MaterialConfig = {
      id: `mat-${Date.now()}`,
      name: 'Novo Filamento PLA',
      type: 'PLA',
      brand: 'Marca Nacional',
      spoolPrice: 110,
      spoolWeightGrams: 1000,
      color: '#3b82f6',
    };
    setFormData((prev) => ({ ...prev, materials: [...prev.materials, newMat] }));
  };

  const handleUpdateMaterial = (index: number, updated: Partial<MaterialConfig>) => {
    setFormData((prev) => {
      const next = [...prev.materials];
      next[index] = { ...next[index], ...updated };
      return { ...prev, materials: next };
    });
  };

  const handleDeleteMaterial = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== id),
    }));
  };

  // Add Printer
  const handleAddPrinter = () => {
    const newPrint: PrinterConfig = {
      id: `print-${Date.now()}`,
      name: 'Nova Impressora 3D',
      powerWatts: 200,
      purchaseCost: 3000,
      lifetimeHours: 4000,
      maintenancePerHour: 1.0,
    };
    setFormData((prev) => ({ ...prev, printers: [...prev.printers, newPrint] }));
  };

  const handleUpdatePrinter = (index: number, updated: Partial<PrinterConfig>) => {
    setFormData((prev) => {
      const next = [...prev.printers];
      next[index] = { ...next[index], ...updated };
      return { ...prev, printers: next };
    });
  };

  const handleDeletePrinter = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      printers: prev.printers.filter((p) => p.id !== id),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">Configurações da Oficina & Preços Base</h2>
              <p className="text-xs text-slate-300">
                Ajuste os valores reais da sua fazenda de impressão 3D (materiais, kWh e mão de obra)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'materials'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Materiais & Filamentos ({formData.materials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('printers')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'printers'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>Impressoras ({formData.printers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rates')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'rates'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Energia & Mão de Obra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'company'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Dados da Empresa & Pagamento</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Cadastre seus filamentos e resinas com o valor pago no carretel (1kg) para cálculo exato de gramas.
                </p>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo Material</span>
                </button>
              </div>

              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden bg-white">
                {formData.materials.map((mat, idx) => (
                  <div key={mat.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1 w-full">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block">Nome / Modelo</label>
                        <input
                          type="text"
                          value={mat.name}
                          onChange={(e) => handleUpdateMaterial(idx, { name: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Tipo</label>
                        <select
                          value={mat.type}
                          onChange={(e) => handleUpdateMaterial(idx, { type: e.target.value as any })}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 bg-white text-slate-800"
                        >
                          <option value="PLA">PLA</option>
                          <option value="PETG">PETG</option>
                          <option value="ABS">ABS</option>
                          <option value="TPU">TPU</option>
                          <option value="ASA">ASA</option>
                          <option value="Nylon">Nylon</option>
                          <option value="Resina">Resina 405nm</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Preço do Carretel (R$/kg)</label>
                        <input
                          type="number"
                          step="1"
                          value={mat.spoolPrice}
                          onChange={(e) => handleUpdateMaterial(idx, { spoolPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(mat.id)}
                      disabled={formData.materials.length <= 1}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'printers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Configure o consumo elétrico e a depreciação por hora das suas impressoras 3D.
                </p>
                <button
                  type="button"
                  onClick={handleAddPrinter}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nova Impressora</span>
                </button>
              </div>

              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden bg-white">
                {formData.printers.map((pr, idx) => (
                  <div key={pr.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1 w-full">
                      <div>
                        <label className="text-[10px] text-slate-400 block">Nome da Máquina</label>
                        <input
                          type="text"
                          value={pr.name}
                          onChange={(e) => handleUpdatePrinter(idx, { name: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Potência Média (Watts)</label>
                        <input
                          type="number"
                          value={pr.powerWatts}
                          onChange={(e) => handleUpdatePrinter(idx, { powerWatts: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Valor Compra (R$)</label>
                        <input
                          type="number"
                          value={pr.purchaseCost}
                          onChange={(e) => handleUpdatePrinter(idx, { purchaseCost: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Vida Útil (Horas)</label>
                        <input
                          type="number"
                          value={pr.lifetimeHours}
                          onChange={(e) => handleUpdatePrinter(idx, { lifetimeHours: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePrinter(pr.id)}
                      disabled={formData.printers.length <= 1}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rates' && (
            <div className="space-y-5 max-w-xl">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 block">
                      Valor Médio da Tarifa de Energia Elétrica (R$ por kWh)
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      R$ 0,89 / kWh
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={formData.kwhCost ?? 0.89}
                      onChange={(e) => {
                        const newKwh = parseFloat(e.target.value) || 0.89;
                        setFormData({
                          ...formData,
                          kwhCost: newKwh,
                          energyCostPerHour: Number((0.095 * newKwh).toFixed(5)),
                        });
                      }}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm font-bold text-slate-900 bg-white focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Tarifa média de energia elétrica da concessionária com impostos (R$ 0,89 por kWh).
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 block">
                      Custo Médio Resultante por Hora de Impressão (R$ / hora)
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      ~R$ 0,085 / hora
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.005"
                      min="0.01"
                      value={formData.energyCostPerHour ?? 0.08455}
                      onChange={(e) => setFormData({ ...formData, energyCostPerHour: parseFloat(e.target.value) || 0.08455 })}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm font-bold text-slate-900 bg-white focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Calculado a partir de uma potência média de <strong>90W a 95W</strong> (consumo real estabilizado de <strong>0,095 kW</strong>): <br />
                    <span className="font-semibold text-indigo-900">0,095 kW × R$ {(formData.kwhCost ?? 0.89).toFixed(2)}/kWh = R$ {((0.095 * (formData.kwhCost ?? 0.89))).toFixed(4)} por hora de impressão</span>.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-slate-200 pt-4">
                  <label className="text-xs font-semibold text-slate-800 block">
                    Custo da Hora Técnica de Operador (R$ / hora)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.operatorHourlyRate}
                      onChange={(e) => setFormData({ ...formData, operatorHourlyRate: parseFloat(e.target.value) || 35 })}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 bg-white focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Remuneração pelo tempo de fatiamento no OrcaSlicer/Bambu Studio/Cura, setup e pós-processamento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-indigo-50/70 border border-indigo-200/80 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                <Building2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Estas informações representam sua empresa (<strong>ConexLab 3D</strong>). Elas são exibidas no cabeçalho dos orçamentos, no envio de PDF sem segredos e nas mensagens de WhatsApp para seus clientes.
                </p>
              </div>

              {/* 1. Identificação da Empresa */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span>Identificação da Empresa & Emissor</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      Nome da Empresa / Nome Fantasia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: ConexLab 3D"
                      value={formData.company.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, name: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-bold focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      CNPJ ou CPF (Documento do Titular)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 00.000.000/0001-00 ou 000.000.000-00"
                      value={formData.company.document}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, document: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-medium text-slate-700 block">Slogan / Especialidade da Oficina</label>
                    <input
                      type="text"
                      placeholder="Ex: Manufatura Aditiva, Prototipagem Rápida & Peças Técnicas"
                      value={formData.company.slogan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, slogan: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Canais de Contato & Localização */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <span>Canais de Contato & Localização</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">E-mail Comercial</label>
                    <input
                      type="email"
                      placeholder="Ex: contato@conexlab3d.com.br"
                      value={formData.company.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, email: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">WhatsApp / Telefone para Contato</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      value={formData.company.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, phone: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700 block">Endereço / Cidade - UF</label>
                    <input
                      type="text"
                      placeholder="Ex: Rua das Impressoras, 120 - São Paulo, SP"
                      value={formData.company.address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, address: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700 block">Instagram / Redes</label>
                    <input
                      type="text"
                      placeholder="Ex: @conexlab3d"
                      value={formData.company.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, instagram: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Formas de Pagamento Aceitas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <span>Formas de Pagamento Aceitas</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Exibido na proposta ao cliente</span>
                </div>

                <div className="space-y-2 text-xs">
                  <textarea
                    rows={2}
                    placeholder="Ex: PIX (Instantâneo), Cartão de Crédito em até 12x, Débito e Boleto Bancário"
                    value={formData.company.paymentMethods || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, paymentMethods: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-indigo-600 outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-medium">Adicionar rapidamente:</span>
                    {[
                      'PIX à vista',
                      'Cartão de Crédito (em até 12x)',
                      'Cartão de Débito',
                      'Boleto Bancário',
                      'Transferência Bancária',
                      'Dinheiro na Retirada',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const curr = formData.company.paymentMethods || '';
                          const updated = curr ? (curr.includes(opt) ? curr : `${curr}, ${opt}`) : opt;
                          setFormData({
                            ...formData,
                            company: { ...formData.company, paymentMethods: updated },
                          });
                        }}
                        className="rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 transition"
                      >
                        + {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Chave PIX */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  <span>Chave PIX para Recebimento</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Chave PIX</label>
                    <input
                      type="text"
                      placeholder="Ex: 000.000.000-00, CNPJ, e-mail ou telefone"
                      value={formData.company.pixKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, pixKey: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700 block">Tipo da Chave PIX</label>
                    <select
                      value={formData.company.pixKeyType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company: { ...formData.company, pixKeyType: e.target.value as any },
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:border-indigo-600 outline-none"
                    >
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="Email">E-mail</option>
                      <option value="Telefone">Telefone</option>
                      <option value="Aleatória">Chave Aleatória</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Condições Padrão de Pagamento */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <span>Condições Padrão de Pagamento</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Ex: 50% de sinal para início da produção e 50% na conclusão / entrega"
                    value={formData.company.paymentConditions || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: { ...formData.company, paymentConditions: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-600 outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-500 font-medium">Modelos comuns:</span>
                    {[
                      '50% de entrada no pedido e 50% na conclusão / entrega',
                      '100% antecipado para início da impressão',
                      'À vista na retirada das peças',
                      'Faturado em 15/30 dias (empresas parceiras)',
                    ].map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            company: { ...formData.company, paymentConditions: cond },
                          });
                        }}
                        className="rounded-md border border-slate-200 bg-white hover:bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 transition"
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition"
          >
            <Check className="h-4 w-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
}
