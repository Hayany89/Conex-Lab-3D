import { useState } from 'react';
import { CheckCircle2, DollarSign, X, Package, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Quote, FilamentSpool, ClosedSale, WorkshopSettings } from '../types';
import { calculatePieceCost, formatCurrency } from '../utils/costCalculator';

interface CloseSaleModalProps {
  quote: Quote;
  settings: WorkshopSettings;
  spools: FilamentSpool[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmSale: (sale: ClosedSale, updatedSpools: FilamentSpool[]) => void;
}

export function CloseSaleModal({
  quote,
  settings,
  spools,
  isOpen,
  onClose,
  onConfirmSale,
}: CloseSaleModalProps) {
  if (!isOpen) return null;

  // Calculate quote financial figures
  let itemsSubtotal = 0;
  let itemsProductionCost = 0;
  let totalWeightGrams = 0;

  const saleItems = quote.items.map((item) => {
    const calc = calculatePieceCost(item, settings.materials, settings.printers, settings);
    itemsSubtotal += calc.totalPrice;
    itemsProductionCost += calc.costWithRisk * item.quantity;
    totalWeightGrams += (item.weightGrams || 0) * (item.quantity || 1);

    return {
      name: item.name,
      quantity: item.quantity,
      technology: item.technology,
      materialName: item.materialName,
      materialType: item.materialType || 'PLA',
      weightGrams: item.weightGrams,
      unitPrice: calc.unitPrice,
      totalPrice: calc.totalPrice,
      rawCost: calc.costWithRisk * item.quantity,
      netProfit: calc.totalProfit,
    };
  });

  const discountAmount =
    quote.discountType === 'percentage'
      ? itemsSubtotal * (Math.max(0, quote.discountValue || 0) / 100)
      : Math.max(0, quote.discountValue || 0);

  const finalTotal = Math.max(0, itemsSubtotal - discountAmount + (quote.shippingCost || 0));
  const netProfit = Math.max(0, finalTotal - itemsProductionCost);
  const profitMarginPercent = finalTotal > 0 ? (netProfit / finalTotal) * 100 : 0;

  // Form states
  const [closedDate, setClosedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX (Chave Instantânea)');
  const [saleStatus, setSaleStatus] = useState<'producing' | 'ready' | 'delivered'>('producing');
  const [deductStock, setDeductStock] = useState<boolean>(true);
  const [saleNotes, setSaleNotes] = useState<string>(
    `Orçamento ${quote.quoteNumber} aprovado pelo cliente. ${totalWeightGrams}g de filamento estimado.`
  );

  // Selected spool mapping for deduction
  const [selectedSpoolId, setSelectedSpoolId] = useState<string>(() => {
    // Try to find a matching spool by first item material type
    const firstItem = quote.items[0];
    const match = spools.find(
      (s) =>
        s.status !== 'empty' &&
        (firstItem?.materialName?.toLowerCase().includes(s.name.toLowerCase()) ||
          s.materialType === firstItem?.materialType)
    );
    return match ? match.id : spools[0]?.id || '';
  });

  const handleConfirm = () => {
    let updatedSpools = [...spools];

    if (deductStock && selectedSpoolId && totalWeightGrams > 0) {
      updatedSpools = spools.map((spool) => {
        if (spool.id === selectedSpoolId) {
          const newWeight = Math.max(0, spool.currentWeightGrams - totalWeightGrams);
          return {
            ...spool,
            currentWeightGrams: newWeight,
            status: newWeight === 0 ? ('empty' as const) : spool.status,
          };
        }
        return spool;
      });
    }

    const newClosedSale: ClosedSale = {
      id: `sale-${Date.now()}`,
      quoteNumber: quote.quoteNumber || `ORC-${Date.now().toString().slice(-4)}`,
      closedDate,
      clientName: quote.client.name || 'Cliente Sem Nome',
      clientPhone: quote.client.phone,
      clientEmail: quote.client.email,
      clientDocument: quote.client.document,
      items: saleItems,
      totalPieces: quote.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      subtotal: itemsSubtotal,
      discountAmount,
      shippingCost: quote.shippingCost || 0,
      finalTotal,
      productionCost: itemsProductionCost,
      netProfit,
      profitMarginPercent,
      paymentMethod,
      status: saleStatus,
      notes: saleNotes,
      filamentDeducted: deductStock,
    };

    onConfirmSale(newClosedSale, updatedSpools);
    onClose();
  };

  const selectedSpool = spools.find((s) => s.id === selectedSpoolId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">
                Fechar Venda & Salvar no Relatório
              </h3>
              <p className="text-xs text-slate-300">
                Registrar pedido aprovado, faturamento, lucro e baixa no estoque
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-700 text-sm">
          {/* Summary Card */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Cliente do Pedido
                </span>
                <strong className="text-base font-bold text-slate-900 font-display">
                  {quote.client.name || 'Cliente'}
                </strong>
                <span className="text-xs text-slate-500 block">
                  {quote.quoteNumber} • {quote.items.reduce((acc, i) => acc + i.quantity, 0)} peça(s)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total a Receber
                </span>
                <strong className="text-xl font-black text-emerald-600 font-display">
                  {formatCurrency(finalTotal)}
                </strong>
                <span className="text-[11px] font-medium text-emerald-700 block">
                  Lucro Real: {formatCurrency(netProfit)} ({profitMarginPercent.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Micro production costs breakdown */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>Custo de Produção da Oficina:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(itemsProductionCost)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Filamento total a ser consumido:</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {totalWeightGrams}g ({quote.items.length} modelo(s))
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data do Fechamento
              </label>
              <input
                type="date"
                value={closedDate}
                onChange={(e) => setClosedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              >
                <option value="PIX (Chave Instantânea)">PIX (Chave Instantânea)</option>
                <option value="PIX (50% sinal + 50% entrega)">PIX (50% sinal + 50% entrega)</option>
                <option value="Cartão de Crédito (1x à vista)">Cartão de Crédito (1x à vista)</option>
                <option value="Cartão de Crédito (Parcelado)">Cartão de Crédito (Parcelado)</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Boleto Bancário">Boleto Bancário</option>
                <option value="Dinheiro / Espécie">Dinheiro / Espécie</option>
                <option value="Transferência Bancária (TED/DOC)">Transferência Bancária</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Inicial do Pedido
              </label>
              <select
                value={saleStatus}
                onChange={(e) => setSaleStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              >
                <option value="producing">🟡 Em Impressão / Produção</option>
                <option value="ready">🔵 Pronto / Embalado</option>
                <option value="delivered">🟢 Entregue ao Cliente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Previsão / Prazo
              </label>
              <input
                type="text"
                value={quote.leadTime || '3 a 5 dias úteis'}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Stock Deduction Box */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deductStock}
                onChange={(e) => setDeductStock(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                Dar baixa automática de {totalWeightGrams}g no estoque de filamentos
              </span>
            </label>

            {deductStock && (
              <div className="pl-6 space-y-1.5">
                <p className="text-[11px] text-slate-500">
                  Selecione o carretel da oficina para descontar o consumo:
                </p>
                <select
                  value={selectedSpoolId}
                  onChange={(e) => setSelectedSpoolId(e.target.value)}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  {spools.map((spool) => (
                    <option key={spool.id} value={spool.id}>
                      {spool.brand} {spool.name} ({spool.colorName}) - Restam {spool.currentWeightGrams}g de {spool.initialWeightGrams}g [{spool.location || 'Estoque'}]
                    </option>
                  ))}
                </select>

                {selectedSpool && (
                  <div className="text-[11px] text-indigo-700 font-medium pt-1 flex items-center justify-between">
                    <span>
                      Saldo após baixa:{' '}
                      <strong>{Math.max(0, selectedSpool.currentWeightGrams - totalWeightGrams)}g</strong>
                    </span>
                    {selectedSpool.currentWeightGrams < totalWeightGrams && (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Atenção: Carretel com saldo menor que o necessário!
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações Internas da Venda
            </label>
            <input
              type="text"
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              placeholder="Ex: Cliente pagou 50% adiantado pelo PIX. Peça urgente."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirmar e Salvar no Relatório</span>
          </button>
        </div>
      </div>
    </div>
  );
}
