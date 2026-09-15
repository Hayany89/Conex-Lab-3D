import { useState, FormEvent } from 'react';
import { X, User, Building2, Phone, Mail, MapPin, Tag, FileText, Check, Plus, Percent } from 'lucide-react';
import { ClientRecord } from '../types';

interface ClientEditorModalProps {
  client?: ClientRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientRecord) => void;
}

const COMMON_TAGS = ['B2B', 'Industrial', 'Recorrente', 'VIP', 'Arquitetura', 'Drones', 'Odonto', 'Brindes', 'Hobby'];

export function ClientEditorModal({
  client,
  isOpen,
  onClose,
  onSave,
}: ClientEditorModalProps) {
  const [formData, setFormData] = useState<Partial<ClientRecord>>(() => {
    if (client) {
      return { ...client };
    }
    return {
      name: '',
      companyName: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      tags: ['Recorrente'],
      customDiscountPercent: 0,
      history: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
  });

  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (!clean) return;
    const currentTags = formData.tags || [];
    if (!currentTags.includes(clean)) {
      setFormData({ ...formData, tags: [...currentTags, clean] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tagToRemove),
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    const finalClient: ClientRecord = {
      id: client?.id || `cli-${Date.now()}`,
      name: formData.name.trim(),
      companyName: formData.companyName?.trim() || '',
      document: formData.document?.trim() || '',
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim() || '',
      address: formData.address?.trim() || '',
      notes: formData.notes?.trim() || '',
      tags: formData.tags && formData.tags.length > 0 ? formData.tags : ['Geral'],
      createdAt: client?.createdAt || formData.createdAt || new Date().toISOString().split('T')[0],
      history: client?.history || [],
      customDiscountPercent: Number(formData.customDiscountPercent || 0),
    };

    onSave(finalClient);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {client ? 'Editar Cadastro de Cliente' : 'Novo Cliente na Carteira'}
              </h3>
              <p className="text-xs text-slate-500">
                Informações de contato, histórico comercial e condições especiais.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                <span>Nome Completo do Cliente *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Eng. Roberto Albuquerque"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                <span>Empresa / Razão Social</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Mecatec Soluções Industriais"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                <span>CPF ou CNPJ</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 29.384.192/0001-05"
                value={formData.document || ''}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp / Telefone</span>
              </label>
              <input
                type="text"
                placeholder="Ex: (11) 99123-8877"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-indigo-600" />
                <span>E-mail</span>
              </label>
              <input
                type="email"
                placeholder="Ex: roberto@mecatecind.com.br"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                <span>Endereço de Envio / Faturamento</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Rua das Indústrias, 450 - Campinas, SP"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5 pt-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-indigo-600" />
                <span>Tags / Segmentação do Cliente</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(formData.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-indigo-400 hover:text-indigo-700 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Tag Quick Selector */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digitar nova tag e pressionar Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 font-bold text-slate-700 transition flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] text-slate-400">Sugestões rápidas:</span>
                {COMMON_TAGS.filter((t) => !(formData.tags || []).includes(t)).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddTag(t)}
                    className="text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-md px-1.5 py-0.5 border border-slate-200 transition"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-indigo-600" />
                <span>Desconto Padrão de Fidelidade (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                placeholder="Ex: 5"
                value={formData.customDiscountPercent || ''}
                onChange={(e) => setFormData({ ...formData, customDiscountPercent: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Aplicado automaticamente ao selecionar este cliente no orçamento.
              </span>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                <span>Observações Internas / Preferências do Cliente</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Prefere entrega por motoboy express. Sempre orça peças em PETG ou ABS. Tolerância dimensional rigorosa..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{client ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
