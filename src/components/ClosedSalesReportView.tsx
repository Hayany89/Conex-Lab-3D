import { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Truck,
  Trash2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowUpRight,
  Plus,
  X,
  Building2,
  FileText,
  BarChart3,
} from 'lucide-react';
import { ClosedSale } from '../types';
import { formatCurrency } from '../utils/costCalculator';
import { SalesDashboard } from './SalesDashboard';

interface ClosedSalesReportViewProps {
  sales: ClosedSale[];
  onChangeSales: (sales: ClosedSale[]) => void;
  onOpenNewQuote: () => void;
}

export function ClosedSalesReportView({
  sales,
  onChangeSales,
  onOpenNewQuote,
}: ClosedSalesReportViewProps) {
  const [showDashboard, setShowDashboard] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<ClosedSale | null>(null);

  // Manual sale registration modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSale, setManualSale] = useState<Partial<ClosedSale>>({
    quoteNumber: `PED-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    closedDate: new Date().toISOString().split('T')[0],
    clientName: '',
    clientPhone: '',
    paymentMethod: 'PIX (Chave Instantânea)',
    status: 'delivered',
    finalTotal: 0,
    productionCost: 0,
    netProfit: 0,
    totalPieces: 1,
    notes: '',
  });

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Search
      const matchesSearch =
        sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.clientPhone && sale.clientPhone.includes(searchTerm)) ||
        sale.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;

      // Period
      let matchesPeriod = true;
      if (periodFilter !== 'all') {
        const saleDate = new Date(sale.closedDate);
        const now = new Date();
        if (periodFilter === '7days') {
          const past7 = new Date();
          past7.setDate(now.getDate() - 7);
          matchesPeriod = saleDate >= past7;
        } else if (periodFilter === '30days') {
          const past30 = new Date();
          past30.setDate(now.getDate() - 30);
          matchesPeriod = saleDate >= past30;
        } else if (periodFilter === 'thisMonth') {
          matchesPeriod =
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [sales, searchTerm, statusFilter, periodFilter]);

  // Aggregate Metrics
  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.finalTotal || 0), 0);
  const totalCost = filteredSales.reduce((acc, s) => acc + (s.productionCost || 0), 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + (s.netProfit || 0), 0);
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const totalPiecesSold = filteredSales.reduce((acc, s) => acc + (s.totalPieces || 0), 0);
  const averageTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  // Handlers
  const handleUpdateStatus = (saleId: string, newStatus: ClosedSale['status']) => {
    const updated = sales.map((s) => (s.id === saleId ? { ...s, status: newStatus } : s));
    onChangeSales(updated);
  };

  const handleDeleteSale = (saleId: string) => {
    if (confirm('Tem certeza que deseja remover este registro de venda fechada?')) {
      onChangeSales(sales.filter((s) => s.id !== saleId));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveManualSale = () => {
    if (!manualSale.clientName || !manualSale.finalTotal) {
      alert('Por favor, informe o nome do cliente e o valor total da venda.');
      return;
    }

    const calculatedProfit = Math.max(0, (manualSale.finalTotal || 0) - (manualSale.productionCost || 0));
    const calculatedMargin =
      (manualSale.finalTotal || 0) > 0 ? (calculatedProfit / (manualSale.finalTotal || 1)) * 100 : 0;

    const newSale: ClosedSale = {
      id: `sale-${Date.now()}`,
      quoteNumber: manualSale.quoteNumber || `PED-${Date.now().toString().slice(-4)}`,
      closedDate: manualSale.closedDate || new Date().toISOString().split('T')[0],
      clientName: manualSale.clientName,
      clientPhone: manualSale.clientPhone,
      clientEmail: manualSale.clientEmail,
      items: [
        {
          name: 'Serviço de Manufatura 3D / Peças Sob Demanda',
          quantity: manualSale.totalPieces || 1,
          technology: 'FDM (Filamento)',
          materialName: 'Filamento Oficina 3D',
          weightGrams: 100,
          unitPrice: (manualSale.finalTotal || 0) / (manualSale.totalPieces || 1),
          totalPrice: manualSale.finalTotal || 0,
          rawCost: manualSale.productionCost || 0,
          netProfit: calculatedProfit,
        },
      ],
      totalPieces: manualSale.totalPieces || 1,
      subtotal: manualSale.finalTotal || 0,
      discountAmount: 0,
      shippingCost: 0,
      finalTotal: manualSale.finalTotal || 0,
      productionCost: manualSale.productionCost || 0,
      netProfit: calculatedProfit,
      profitMarginPercent: calculatedMargin,
      paymentMethod: manualSale.paymentMethod || 'PIX (Chave Instantânea)',
      status: (manualSale.status as any) || 'delivered',
      notes: manualSale.notes,
      filamentDeducted: false,
    };

    onChangeSales([newSale, ...sales]);
    setIsManualModalOpen(false);
    setManualSale({
      quoteNumber: `PED-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      closedDate: new Date().toISOString().split('T')[0],
      clientName: '',
      clientPhone: '',
      paymentMethod: 'PIX (Chave Instantânea)',
      status: 'delivered',
      finalTotal: 0,
      productionCost: 0,
      netProfit: 0,
      totalPieces: 1,
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Financial Intelligence */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-indigo-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Gestão Comercial & Faturamento Fechado
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-white mt-1">
              Relatório de Vendas Fechadas
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Receita consolidada, lucro líquido real, controle de pedidos entregues e faturamento.
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowDashboard(!showDashboard)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition border ${
                showDashboard
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={showDashboard ? 'Ocultar gráficos' : 'Exibir gráficos de faturamento e materiais'}
            >
              <BarChart3 className="h-4 w-4" />
              <span>{showDashboard ? 'Ocultar Gráficos' : 'Gráficos & Dashboard'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-bold text-white border border-slate-700 shadow-sm transition"
            >
              <Printer className="h-4 w-4 text-slate-300" />
              <span>Imprimir Relatório (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition"
            >
              <Plus className="h-4 w-4" />
              <span>+ Registrar Venda</span>
            </button>
          </div>
        </div>

        {/* Executive KPIs */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Faturamento Total
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-2xl font-extrabold text-white font-display">
                {formatCurrency(totalRevenue)}
              </strong>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              {filteredSales.length} pedido(s) fechado(s)
            </span>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Lucro Líquido Real
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-2xl font-extrabold text-emerald-400 font-display">
                {formatCurrency(totalProfit)}
              </strong>
            </div>
            <span className="text-[10px] text-emerald-300/80 mt-1">
              Margem média: {averageMargin.toFixed(1)}%
            </span>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Custo Total Oficina
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-2xl font-extrabold text-slate-300 font-display">
                {formatCurrency(totalCost)}
              </strong>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Filamento, energia & desgaste</span>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Peças & Ticket Médio
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-extrabold text-indigo-300 font-display">
                {totalPiecesSold}
              </strong>
              <span className="text-xs text-slate-400">peças</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              Ticket médio: {formatCurrency(averageTicket)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Dashboard (Recharts: Monthly Revenue Bars & Material Distribution Pie) */}
      {showDashboard && (
        <div className="no-print">
          <SalesDashboard sales={filteredSales.length > 0 ? filteredSales : sales} />
        </div>
      )}


      {/* Filters and Search Bar (no-print) */}
      <div className="no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido, telefone ou peça..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Período:</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="all">Todo o Histórico</option>
              <option value="thisMonth">Este Mês</option>
              <option value="30days">Últimos 30 Dias</option>
              <option value="7days">Últimos 7 Dias</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="producing">🟡 Em Impressão</option>
              <option value="ready">🔵 Pronto / Embalado</option>
              <option value="delivered">🟢 Entregue ao Cliente</option>
              <option value="cancelled">🔴 Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales List Table */}
      {filteredSales.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <TrendingUp className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 font-display">
            Nenhuma venda encontrada
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não há vendas correspondentes aos filtros selecionados. Feche um orçamento ativo para registrá-lo ou registre uma venda manualmente.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Venda Manual</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-28">Data / Pedido</th>
                  <th className="py-3 px-4">Cliente & Contato</th>
                  <th className="py-3 px-4">Itens & Produção</th>
                  <th className="py-3 px-4">Pagamento & Status</th>
                  <th className="py-3 px-4 text-right w-28">Custo Oficina</th>
                  <th className="py-3 px-4 text-right w-28">Faturamento</th>
                  <th className="py-3 px-4 text-right w-28">Lucro Líquido</th>
                  <th className="py-3 px-4 text-center w-20 no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredSales.map((sale) => {
                  const formattedDate = new Date(sale.closedDate + 'T12:00:00').toLocaleDateString(
                    'pt-BR'
                  );

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition">
                      {/* Date & Number */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900 font-display">
                          {sale.quoteNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 align-top space-y-0.5">
                        <div className="font-bold text-slate-900 text-sm font-display">
                          {sale.clientName}
                        </div>
                        {sale.clientPhone && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {sale.clientPhone}
                          </div>
                        )}
                        {sale.clientEmail && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {sale.clientEmail}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 align-top space-y-1">
                        <div className="text-xs font-semibold text-slate-800">
                          {sale.totalPieces} peça(s) no total
                        </div>
                        <div className="space-y-0.5">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="text-[11px] text-slate-600 flex items-center gap-1">
                              <span className="font-bold text-indigo-700">{item.quantity}x</span>
                              <span className="truncate max-w-[200px]">{item.name}</span>
                              <span className="text-[10px] text-slate-400">({item.technology.split(' ')[0]})</span>
                            </div>
                          ))}
                        </div>
                        {sale.filamentDeducted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ✓ Baixa no estoque efetuada
                          </span>
                        )}
                      </td>

                      {/* Payment & Status */}
                      <td className="py-3.5 px-4 align-top space-y-1.5">
                        <div className="text-xs font-medium text-slate-700">
                          {sale.paymentMethod}
                        </div>

                        {/* Interactive Status Selector */}
                        <div className="no-print">
                          <select
                            value={sale.status}
                            onChange={(e) => handleUpdateStatus(sale.id, e.target.value as any)}
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold border outline-none cursor-pointer ${
                              sale.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : sale.status === 'ready'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : sale.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="producing">🟡 Em Impressão</option>
                            <option value="ready">🔵 Pronto / Embalado</option>
                            <option value="delivered">🟢 Entregue</option>
                            <option value="cancelled">🔴 Cancelado</option>
                          </select>
                        </div>

                        {/* Print only status badge */}
                        <div className="hidden print:block text-[11px] font-bold text-slate-800 uppercase">
                          {sale.status === 'delivered'
                            ? 'Entregue'
                            : sale.status === 'ready'
                            ? 'Pronto'
                            : 'Em Produção'}
                        </div>
                      </td>

                      {/* Production Cost */}
                      <td className="py-3.5 px-4 text-right align-top font-medium text-slate-600">
                        {formatCurrency(sale.productionCost)}
                      </td>

                      {/* Gross Revenue */}
                      <td className="py-3.5 px-4 text-right align-top font-bold text-slate-900 text-sm">
                        {formatCurrency(sale.finalTotal)}
                      </td>

                      {/* Net Profit */}
                      <td className="py-3.5 px-4 text-right align-top">
                        <div className="font-extrabold text-emerald-700 text-sm">
                          {formatCurrency(sale.netProfit)}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600">
                          {sale.profitMarginPercent.toFixed(0)}% margem
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center align-top no-print">
                        <button
                          type="button"
                          onClick={() => handleDeleteSale(sale.id)}
                          title="Excluir venda do relatório"
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Footer */}
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-4">
                    TOTALIZADOR ({filteredSales.length} vendas filtradas):
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {formatCurrency(totalCost)}
                  </td>
                  <td className="py-3 px-4 text-right text-white text-sm">
                    {formatCurrency(totalRevenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 text-sm">
                    {formatCurrency(totalProfit)}
                  </td>
                  <td className="py-3 px-4 no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Manual Sale Registration Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 to-emerald-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">
                    Registrar Venda Manual
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Lançar pedido fechado diretamente no relatório financeiro
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nº do Pedido / Recibo</label>
                  <input
                    type="text"
                    value={manualSale.quoteNumber}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, quoteNumber: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data da Venda</label>
                  <input
                    type="date"
                    value={manualSale.closedDate}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, closedDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Andrade"
                    value={manualSale.clientName}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, clientName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={manualSale.clientPhone}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, clientPhone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Financial values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor Total da Venda (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={manualSale.finalTotal || ''}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, finalTotal: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold text-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Custo de Produção (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={manualSale.productionCost || ''}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, productionCost: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Qtd de Peças</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={manualSale.totalPieces || 1}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, totalPieces: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Payment and status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={manualSale.paymentMethod}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, paymentMethod: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600"
                  >
                    <option value="PIX (Chave Instantânea)">PIX (Chave Instantânea)</option>
                    <option value="Cartão de Crédito (1x à vista)">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Dinheiro / Espécie">Dinheiro / Espécie</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status da Produção</label>
                  <select
                    value={manualSale.status}
                    onChange={(e) =>
                      setManualSale({ ...manualSale, status: e.target.value as any })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600"
                  >
                    <option value="producing">🟡 Em Impressão</option>
                    <option value="ready">🔵 Pronto / Embalado</option>
                    <option value="delivered">🟢 Entregue ao Cliente</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações da Venda</label>
                <input
                  type="text"
                  placeholder="Ex: Peças técnicas impressas em PETG. Entregues presencialmente."
                  value={manualSale.notes || ''}
                  onChange={(e) => setManualSale({ ...manualSale, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveManualSale}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Salvar Venda no Relatório</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
