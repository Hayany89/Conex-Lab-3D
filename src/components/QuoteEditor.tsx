import { useState, useMemo } from 'react';
import { Plus, User, FileText, DollarSign, Eye, Share2, Sparkles, TrendingUp, ShieldAlert, ShieldCheck, Box, Tag, Truck, Check, Building2, CreditCard, Clock, Zap, Users, UserCheck, ChevronDown, History, ArrowRight } from 'lucide-react';
import { Quote, PieceItem, WorkshopSettings, ClientRecord, ClosedSale } from '../types';
import { PieceListCard } from './PieceListCard';
import { calculatePieceCost, formatCurrency, formatNumber } from '../utils/costCalculator';
import { getClientMetrics } from '../utils/clientUtils';

interface QuoteEditorProps {
  quote: Quote;
  settings: WorkshopSettings;
  clients?: ClientRecord[];
  closedSales?: ClosedSale[];
  onChangeQuote: (updated: Quote) => void;
  onOpenPieceModal: (piece?: PieceItem | null) => void;
  onViewProposal: () => void;
  onOpenWhatsApp: () => void;
  onOpenCompanySettings?: () => void;
  onOpenCloseSale?: () => void;
  onOpenClientsTab?: () => void;
  onSaveClientToPortfolio?: (client: ClientRecord) => void;
}

export function QuoteEditor({
  quote,
  settings,
  clients = [],
  closedSales = [],
  onChangeQuote,
  onOpenPieceModal,
  onViewProposal,
  onOpenWhatsApp,
  onOpenCompanySettings,
  onOpenCloseSale,
  onOpenClientsTab,
  onSaveClientToPortfolio,
}: QuoteEditorProps) {
  // Aggregate calculations for the maker
  let totalRawCost = 0;
  let totalCostWithRisk = 0;
  let totalSalePrice = 0;
  let totalPiecesCount = 0;

  quote.items.forEach((item) => {
    const calc = calculatePieceCost(item, settings.materials, settings.printers, settings);
    totalRawCost += calc.rawCost * item.quantity;
    totalCostWithRisk += calc.costWithRisk * item.quantity;
    totalSalePrice += calc.totalPrice;
    totalPiecesCount += item.quantity;
  });

  const discountAmount =
    quote.discountType === 'percentage'
      ? totalSalePrice * (Math.max(0, quote.discountValue || 0) / 100)
      : Math.max(0, quote.discountValue || 0);

  const shipping = Math.max(0, quote.shippingCost || 0);
  const finalClientTotal = Math.max(0, totalSalePrice - discountAmount + shipping);

  // Maker's net profit
  const netProfit = finalClientTotal - totalCostWithRisk;
  const netProfitPercent = totalCostWithRisk > 0 ? (netProfit / totalCostWithRisk) * 100 : 0;

  const handleDuplicatePiece = (piece: PieceItem) => {
    const duplicated: PieceItem = {
      ...piece,
      id: `piece-${Date.now()}`,
      name: `${piece.name} (Cópia)`,
    };
    onChangeQuote({
      ...quote,
      items: [...quote.items, duplicated],
    });
  };

  const handleDeletePiece = (pieceId: string) => {
    if (quote.items.length <= 1) {
      alert('O orçamento deve ter pelo menos uma peça.');
      return;
    }
    onChangeQuote({
      ...quote,
      items: quote.items.filter((i) => i.id !== pieceId),
    });
  };

  // Workshop aggregates
  const totalWeightGrams = quote.items.reduce((acc, item) => acc + (item.weightGrams || 0) * (item.quantity || 1), 0);
  const totalPrintMinutes = quote.items.reduce(
    (acc, item) => acc + ((item.printTimeHours || 0) * 60 + (item.printTimeMinutes || 0)) * (item.quantity || 1),
    0
  );
  const totalPrintHours = Math.floor(totalPrintMinutes / 60);
  const totalPrintRemainingMinutes = totalPrintMinutes % 60;
  const costPercentage = finalClientTotal > 0 ? Math.min(100, (totalCostWithRisk / finalClientTotal) * 100) : 0;
  const profitPercentage = finalClientTotal > 0 ? Math.max(0, 100 - costPercentage) : 0;

  // Check if current quote client is already a saved client in the portfolio
  const matchedSavedClient = useMemo(() => {
    if (quote.client.clientId) {
      const found = clients.find((c) => c.id === quote.client.clientId);
      if (found) return found;
    }
    const cleanName = quote.client.name?.trim().toLowerCase();
    if (!cleanName || cleanName === 'novo cliente') return null;
    return (
      clients.find(
        (c) =>
          c.name.trim().toLowerCase() === cleanName ||
          (c.companyName && c.companyName.trim().toLowerCase() === cleanName) ||
          (quote.client.phone && c.phone && quote.client.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, ''))
      ) || null
    );
  }, [quote.client, clients]);

  const matchedMetrics = useMemo(() => {
    if (!matchedSavedClient) return null;
    return getClientMetrics(matchedSavedClient, closedSales);
  }, [matchedSavedClient, closedSales]);

  const [showClientHistory, setShowClientHistory] = useState(false);

  const handleSelectReturningClient = (clientId: string) => {
    if (!clientId) {
      onChangeQuote({
        ...quote,
        client: {
          clientId: undefined,
          name: '',
          companyName: '',
          document: '',
          phone: '',
          email: '',
          address: '',
        },
      });
      return;
    }
    const target = clients.find((c) => c.id === clientId);
    if (target) {
      let newDiscountValue = quote.discountValue;
      let newDiscountType = quote.discountType;
      // Auto-apply VIP discount if configured on client and currently quote has 0 discount
      if (
        target.customDiscountPercent &&
        target.customDiscountPercent > 0 &&
        (!quote.discountValue || quote.discountValue === 0)
      ) {
        newDiscountValue = target.customDiscountPercent;
        newDiscountType = 'percentage';
      }

      onChangeQuote({
        ...quote,
        client: {
          clientId: target.id,
          name: target.name,
          companyName: target.companyName,
          document: target.document,
          phone: target.phone,
          email: target.email,
          address: target.address,
        },
        discountValue: newDiscountValue,
        discountType: newDiscountType,
      });
    }
  };

  const handleQuickSaveCurrentClient = () => {
    if (!quote.client.name.trim() || quote.client.name.trim() === 'Novo Cliente') {
      alert('Por favor, digite o nome do cliente antes de salvar.');
      return;
    }
    const newClientRecord: ClientRecord = {
      id: `cli-${Date.now()}`,
      name: quote.client.name.trim(),
      companyName: quote.client.companyName?.trim() || '',
      document: quote.client.document?.trim() || '',
      phone: quote.client.phone?.trim() || '',
      email: quote.client.email?.trim() || '',
      address: quote.client.address?.trim() || '',
      notes: 'Cadastrado diretamente pelo Editor de Orçamento.',
      tags: ['Recorrente'],
      createdAt: new Date().toISOString().split('T')[0],
      history: [
        {
          id: `hist-${Date.now()}`,
          quoteNumber: quote.quoteNumber,
          date: quote.issueDate,
          itemCount: quote.items.length,
          totalPieces: quote.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
          totalValue: finalClientTotal,
          status: 'quoted',
          summary: quote.items.map((i) => `${i.name} (${i.quantity}x)`).join(', '),
        },
      ],
    };
    if (onSaveClientToPortfolio) {
      onSaveClientToPortfolio(newClientRecord);
      onChangeQuote({
        ...quote,
        client: {
          ...quote.client,
          clientId: newClientRecord.id,
        },
      });
    }
  };

  // Client initials for dynamic avatar
  const getInitials = (name: string) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Maker Financial Intelligence Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-indigo-900/40">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold font-display text-base shadow-inner">
              {getInitials(quote.client.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Painel de Custos da Oficina (Visão Privada)
                </span>
              </div>
              <h2 className="text-xl font-bold font-display text-white mt-0.5">
                Cliente: {quote.client.name || 'Novo Cliente'}
              </h2>
              <p className="text-xs text-slate-400">
                Custos internos protegidos: filamento, energia, depreciação e risco de falha.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {onOpenCloseSale && (
              <button
                type="button"
                onClick={onOpenCloseSale}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition"
              >
                <Check className="h-4 w-4" />
                <span>Fechar Venda</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-bold text-white border border-slate-700 shadow-sm transition"
            >
              <Share2 className="h-4 w-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onViewProposal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Proposta Comercial (PDF)</span>
            </button>
          </div>
        </div>

        {/* Real-time Maker KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4">
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 block">Custo Total de Fabricação</span>
            <span className="text-lg sm:text-xl font-bold text-slate-200 block mt-0.5">
              {formatCurrency(totalCostWithRisk)}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Oculto do cliente
            </span>
          </div>

          <div className="rounded-xl bg-emerald-950/50 p-3 border border-emerald-800/50">
            <span className="text-[11px] font-medium text-emerald-300 block">Lucro Líquido Estimado</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 block mt-0.5">
              +{formatCurrency(netProfit)}
            </span>
            <span className="text-[10px] text-emerald-300/80 mt-0.5 block font-medium">
              {formatNumber(netProfitPercent, 0)}% sobre custo
            </span>
          </div>

          <div className="rounded-xl bg-indigo-950/60 p-3 border border-indigo-800/60">
            <span className="text-[11px] font-medium text-indigo-300 block">Total a Cobrar do Cliente</span>
            <span className="text-lg sm:text-xl font-bold text-indigo-200 block mt-0.5">
              {formatCurrency(finalClientTotal)}
            </span>
            <span className="text-[10px] text-indigo-300/80 mt-0.5 block">
              {totalPiecesCount} peça(s) no pedido
            </span>
          </div>

          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/60 flex flex-col justify-center">
            <span className="text-[11px] font-medium text-slate-400 block">Status da Proposta</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Pronto para envio
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Válido por {quote.validityDays} dias</span>
          </div>
        </div>

        {/* Dynamic Profit Gauge & Production Telemetry Strip */}
        <div className="mt-4 pt-3.5 border-t border-indigo-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Visual Profit Ratio Bar */}
          <div className="w-full md:w-1/2 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Distribuição: <strong className="text-slate-300">Custo ({costPercentage.toFixed(0)}%)</strong></span>
              <span>Margem: <strong className="text-emerald-400 font-bold">Lucro ({profitPercentage.toFixed(0)}%)</strong></span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.max(4, costPercentage)}%` }}
                className="bg-slate-500 transition-all duration-300"
                title={`Custo: ${formatCurrency(totalCostWithRisk)}`}
              />
              <div
                style={{ width: `${Math.max(4, profitPercentage)}%` }}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                title={`Lucro: ${formatCurrency(netProfit)}`}
              />
            </div>
          </div>

          {/* Machine & Material Aggregates */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 border border-slate-700/60">
              <Clock className="h-3 w-3 text-amber-400" />
              {totalPrintHours}h {totalPrintRemainingMinutes}m de impressão
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 border border-slate-700/60">
              <Zap className="h-3 w-3 text-indigo-400" />
              {(totalWeightGrams / 1000).toFixed(3)} kg de filamento
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Client Info & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pieces Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 font-display">
                Peças do Orçamento ({quote.items.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onOpenPieceModal(null)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Peça 3D</span>
            </button>
          </div>

          {/* List of Pieces */}
          <div className="space-y-3">
            {quote.items.map((item) => (
              <PieceListCard
                key={item.id}
                piece={item}
                materials={settings.materials}
                printers={settings.printers}
                settings={settings}
                onEdit={() => onOpenPieceModal(item)}
                onDuplicate={() => handleDuplicatePiece(item)}
                onDelete={() => handleDeletePiece(item.id)}
              />
            ))}
          </div>

          {/* Commercial Conditions & Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Condições Comerciais & Pagamento</span>
              </h4>
              {onOpenCompanySettings && (
                <button
                  type="button"
                  onClick={onOpenCompanySettings}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Alterar Dados da Empresa / Pagamento</span>
                </button>
              )}
            </div>

            {/* Quick Summary of Active Company Payment Data */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  Formas de pagamento da empresa ({settings.company.name || 'ConexLab 3D'}):
                </span>
                <p className="text-slate-600 text-[11px]">
                  {settings.company.paymentMethods || 'PIX (Instantâneo), Cartão de Crédito (até 12x), Débito e Boleto Bancário'}
                </p>
              </div>
              {onOpenCompanySettings && (
                <button
                  type="button"
                  onClick={onOpenCompanySettings}
                  className="shrink-0 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 underline"
                >
                  Editar CNPJ, Email e Pagamentos →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Prazo de Produção & Entrega</label>
                <input
                  type="text"
                  value={quote.leadTime}
                  onChange={(e) => onChangeQuote({ ...quote, leadTime: e.target.value })}
                  placeholder="Ex: 3 a 5 dias úteis"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Condições de Pagamento</label>
                <input
                  type="text"
                  value={quote.paymentTerms}
                  onChange={(e) => onChangeQuote({ ...quote, paymentTerms: e.target.value })}
                  placeholder="Ex: 50% entrada e 50% na conclusão"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Observações Técnicas das Peças</label>
                <textarea
                  rows={2}
                  value={quote.notes}
                  onChange={(e) => onChangeQuote({ ...quote, notes: e.target.value })}
                  placeholder="Ex: Tolerância dimensional, recomendações de furação ou montagem..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Termos de Garantia</label>
                <textarea
                  rows={2}
                  value={quote.termsAndWarranty}
                  onChange={(e) => onChangeQuote({ ...quote, termsAndWarranty: e.target.value })}
                  placeholder="Ex: Garantia de 30 dias contra falhas de fabricação..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Client Info & Totals Editor */}
        <div className="space-y-5">
          {/* Client Details Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                  {getInitials(quote.client.name)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display">Dados do Cliente</h4>
                  <span className="text-[10px] text-slate-400 block">Identificação e faturamento</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onOpenClientsTab && (
                  <button
                    type="button"
                    onClick={onOpenClientsTab}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                    title="Ver toda a Carteira de Clientes"
                  >
                    <Users className="h-3 w-3 text-indigo-600" />
                    <span className="hidden sm:inline">Carteira</span>
                  </button>
                )}

                {quote.client.phone && (
                  <button
                    type="button"
                    onClick={onOpenWhatsApp}
                    title="Abrir prévia do WhatsApp para este cliente"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    <Share2 className="h-3 w-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Selector for Returning Clients */}
            <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Selecionar Cliente Recorrente</span>
                </label>
                {matchedSavedClient && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                    Cliente Reconhecido
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={quote.client.clientId || matchedSavedClient?.id || ''}
                  onChange={(e) => handleSelectReturningClient(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 font-medium focus:border-indigo-600 outline-none"
                >
                  <option value="">-- Escolha um cliente da carteira ({clients.length}) --</option>
                  {clients.map((c) => {
                    const cMetrics = getClientMetrics(c, closedSales);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''} - LTV: {formatCurrency(cMetrics.ltv)}
                      </option>
                    );
                  })}
                </select>

                {(quote.client.name || quote.client.clientId) && (
                  <button
                    type="button"
                    onClick={() => handleSelectReturningClient('')}
                    className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 transition"
                    title="Limpar campos do cliente para criar um novo"
                  >
                    Novo
                  </button>
                )}
              </div>
            </div>

            {/* Returning Client Intelligence Banner */}
            {matchedSavedClient && matchedMetrics && (
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50/40 border border-indigo-200/80 p-3 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-indigo-950 font-display">
                        {matchedSavedClient.name}
                      </span>
                      {matchedMetrics.isVip && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md">
                          <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                          VIP
                        </span>
                      )}
                      {matchedSavedClient.customDiscountPercent ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                          {matchedSavedClient.customDiscountPercent}% desc. fidelidade
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                      <span>
                        LTV Acumulado: <strong className="text-emerald-700 font-black">{formatCurrency(matchedMetrics.ltv)}</strong>
                      </span>
                      <span>
                        Pedidos: <strong className="text-slate-900">{matchedMetrics.totalClosedOrders}</strong>
                      </span>
                      <span>
                        Ticket Médio: <strong className="text-slate-900">{formatCurrency(matchedMetrics.averageTicket)}</strong>
                      </span>
                    </div>
                  </div>

                  {matchedSavedClient.history && matchedSavedClient.history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowClientHistory(!showClientHistory)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 transition shrink-0"
                    >
                      <History className="h-3 w-3 text-indigo-600" />
                      <span>{showClientHistory ? 'Ocultar' : 'Histórico'} ({matchedSavedClient.history.length})</span>
                    </button>
                  )}
                </div>

                {/* Popover of past quotes if requested */}
                {showClientHistory && matchedSavedClient.history && matchedSavedClient.history.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100 space-y-1.5 animate-fadeIn">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Últimos Orçamentos & Pedidos:
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {matchedSavedClient.history.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-900 mr-2">{h.quoteNumber}</span>
                            <span className="text-slate-500 text-[10px]">{h.date}</span>
                            <p className="text-slate-600 text-[10px] truncate max-w-[180px]">{h.summary}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">{formatCurrency(h.totalValue)}</span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded ${
                                h.status === 'closed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {h.status === 'closed' ? 'Fechada' : 'Orçado'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Save to Portfolio button if client is not in portfolio */}
            {!matchedSavedClient && quote.client.name.trim() && quote.client.name.trim() !== 'Novo Cliente' && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
                <span className="text-[11px] text-indigo-900 font-medium">
                  Cliente ainda não cadastrado na sua carteira.
                </span>
                <button
                  type="button"
                  onClick={handleQuickSaveCurrentClient}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs transition"
                >
                  <Plus className="h-3 w-3" />
                  <span>Salvar na Carteira</span>
                </button>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente ou empresa"
                  value={quote.client.name}
                  onChange={(e) =>
                    onChangeQuote({
                      ...quote,
                      client: { ...quote.client, name: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Empresa / Razão Social</label>
                <input
                  type="text"
                  value={quote.client.companyName || ''}
                  onChange={(e) =>
                    onChangeQuote({
                      ...quote,
                      client: { ...quote.client, companyName: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">WhatsApp / Tel</label>
                  <input
                    type="text"
                    value={quote.client.phone}
                    onChange={(e) =>
                      onChangeQuote({
                        ...quote,
                        client: { ...quote.client, phone: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={quote.client.document || ''}
                    onChange={(e) =>
                      onChangeQuote({
                        ...quote,
                        client: { ...quote.client, document: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">E-mail</label>
                <input
                  type="email"
                  value={quote.client.email || ''}
                  onChange={(e) =>
                    onChangeQuote({
                      ...quote,
                      client: { ...quote.client, email: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Endereço de Entrega</label>
                <input
                  type="text"
                  value={quote.client.address || ''}
                  onChange={(e) =>
                    onChangeQuote({
                      ...quote,
                      client: { ...quote.client, address: e.target.value },
                    })
                  }
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Quote Parameters Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900 font-display">Validade & Descontos</h4>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Cód. Interno (Opcional)</label>
                  <input
                    type="text"
                    value={quote.quoteNumber}
                    onChange={(e) => onChangeQuote({ ...quote, quoteNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-700 font-mono text-xs"
                    placeholder="Ref. interna"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Validade (dias)</label>
                  <input
                    type="number"
                    min="1"
                    value={quote.validityDays}
                    onChange={(e) => onChangeQuote({ ...quote, validityDays: parseInt(e.target.value) || 15 })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">Desconto Comercial</label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onChangeQuote({ ...quote, discountType: 'percentage' })}
                      className={`px-2 py-0.5 rounded ${
                        quote.discountType === 'percentage'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeQuote({ ...quote, discountType: 'fixed' })}
                      className={`px-2 py-0.5 rounded ${
                        quote.discountType === 'fixed'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      R$
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">
                    {quote.discountType === 'percentage' ? '%' : 'R$'}
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={quote.discountValue || 0}
                    onChange={(e) => onChangeQuote({ ...quote, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-slate-900 font-semibold"
                  />
                </div>
              </div>

              {/* Shipping */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Taxa de Envio / Frete (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={quote.shippingCost || 0}
                    onChange={(e) => onChangeQuote({ ...quote, shippingCost: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-slate-900 font-semibold"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Método: Sedex, Motoboy, Retirada no local..."
                  value={quote.shippingMethod || ''}
                  onChange={(e) => onChangeQuote({ ...quote, shippingMethod: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-slate-700 mt-1.5"
                />
              </div>
            </div>

            {/* Quick Summary Total */}
            <div className="border-t-2 border-slate-100 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(totalSalePrice)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Desconto:</span>
                  <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {shipping > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Frete:</span>
                  <span className="font-semibold">+{formatCurrency(shipping)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 text-sm">TOTAL CLIENTE:</span>
                <span className="font-extrabold text-indigo-700 text-lg font-display">
                  {formatCurrency(finalClientTotal)}
                </span>
              </div>

              {onOpenCloseSale && (
                <button
                  type="button"
                  onClick={onOpenCloseSale}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 px-3 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>Fechar Venda & Salvar no Relatório</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
