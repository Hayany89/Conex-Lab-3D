import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Building2,
  Phone,
  Mail,
  MapPin,
  Tag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Trash2,
  Edit2,
  TrendingUp,
  Sparkles,
  DollarSign,
  ShoppingBag,
  ArrowRight,
  Share2,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { ClientRecord, ClosedSale, Quote } from '../types';
import { getClientMetrics, getWhatsAppDirectUrl, exportClientsToCSV } from '../utils/clientUtils';
import { formatCurrency } from '../utils/costCalculator';
import { ClientEditorModal } from './ClientEditorModal';

interface ClientsViewProps {
  clients: ClientRecord[];
  closedSales: ClosedSale[];
  onChangeClients: (updatedClients: ClientRecord[]) => void;
  onSelectClientForQuote: (client: ClientRecord) => void;
  onLoadHistoricQuote?: (quoteNumber: string) => void;
}

export function ClientsView({
  clients,
  closedSales,
  onChangeClients,
  onSelectClientForQuote,
  onLoadHistoricQuote,
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'ltv' | 'recent' | 'name' | 'orders'>('ltv');
  const [expandedClientIds, setExpandedClientIds] = useState<Record<string, boolean>>({});
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  // Calculate aggregates
  const allMetrics = useMemo(() => {
    return clients.map((c) => ({
      client: c,
      metrics: getClientMetrics(c, closedSales),
    }));
  }, [clients, closedSales]);

  const totalPortfolioLTV = allMetrics.reduce((acc, curr) => acc + curr.metrics.ltv, 0);
  const totalClosedOrdersCount = allMetrics.reduce((acc, curr) => acc + curr.metrics.totalClosedOrders, 0);
  const averagePortfolioTicket =
    totalClosedOrdersCount > 0 ? totalPortfolioLTV / totalClosedOrdersCount : 0;
  const vipClientsCount = allMetrics.filter((m) => m.metrics.isVip).length;

  // Extract unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [clients]);

  // Filtered & Sorted Clients
  const filteredAndSortedClients = useMemo(() => {
    let result = allMetrics.filter(({ client }) => {
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const matchName = client.name.toLowerCase().includes(q);
        const matchCompany = client.companyName?.toLowerCase().includes(q);
        const matchPhone = client.phone?.toLowerCase().includes(q);
        const matchEmail = client.email?.toLowerCase().includes(q);
        const matchDoc = client.document?.toLowerCase().includes(q);
        const matchNotes = client.notes?.toLowerCase().includes(q);
        const matchTags = client.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchCompany && !matchPhone && !matchEmail && !matchDoc && !matchNotes && !matchTags) {
          return false;
        }
      }

      if (selectedTag !== 'all') {
        if (selectedTag === 'vip') {
          return client.tags.includes('VIP') || getClientMetrics(client, closedSales).isVip;
        }
        if (!client.tags?.includes(selectedTag)) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'ltv') {
        return b.metrics.ltv - a.metrics.ltv;
      }
      if (sortBy === 'orders') {
        return b.metrics.totalClosedOrders - a.metrics.totalClosedOrders;
      }
      if (sortBy === 'name') {
        return a.client.name.localeCompare(b.client.name);
      }
      if (sortBy === 'recent') {
        return (b.metrics.lastActivityDate || '').localeCompare(a.metrics.lastActivityDate || '');
      }
      return 0;
    });

    return result;
  }, [allMetrics, searchTerm, selectedTag, sortBy, closedSales]);

  const toggleExpand = (id: string) => {
    setExpandedClientIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenNewClient = () => {
    setEditingClient(null);
    setIsEditorModalOpen(true);
  };

  const handleOpenEditClient = (client: ClientRecord) => {
    setEditingClient(client);
    setIsEditorModalOpen(true);
  };

  const handleSaveClient = (savedClient: ClientRecord) => {
    const exists = clients.some((c) => c.id === savedClient.id);
    let updated: ClientRecord[];
    if (exists) {
      updated = clients.map((c) => (c.id === savedClient.id ? savedClient : c));
    } else {
      updated = [savedClient, ...clients];
    }
    onChangeClients(updated);
    setIsEditorModalOpen(false);
    setEditingClient(null);
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    if (confirm(`Tem certeza que deseja remover o cliente "${clientName}" da carteira?`)) {
      onChangeClients(clients.filter((c) => c.id !== clientId));
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-indigo-900/40">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold shadow-inner">
              <Users className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Gestão Comercial & CRM 3D
                </span>
              </div>
              <h2 className="text-xl font-bold font-display text-white mt-0.5">
                Carteira de Clientes & Lifetime Value (LTV)
              </h2>
              <p className="text-xs text-slate-400">
                Histórico completo de orçamentos, ticket médio, faturamento por cliente e seleção rápida para novos pedidos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => exportClientsToCSV(clients, closedSales)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-bold text-white border border-slate-700 shadow-sm transition"
              title="Exportar base completa para planilha CSV / Excel"
            >
              <Download className="h-4 w-4 text-indigo-300" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewClient}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition"
            >
              <Plus className="h-4 w-4" />
              <span>+ Novo Cliente</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 backdrop-blur-xs">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              Clientes Ativos
            </span>
            <div className="text-xl sm:text-2xl font-black font-display text-white mt-1">
              {clients.length}
            </div>
            <span className="text-[10px] text-indigo-300 block mt-0.5">
              {vipClientsCount} VIPs / Recorrentes
            </span>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 backdrop-blur-xs">
            <span className="text-[11px] font-medium text-emerald-300 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              LTV Total Acumulado
            </span>
            <div className="text-xl sm:text-2xl font-black font-display text-emerald-300 mt-1">
              {formatCurrency(totalPortfolioLTV)}
            </div>
            <span className="text-[10px] text-emerald-200/80 block mt-0.5">
              Total faturado pela carteira
            </span>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 backdrop-blur-xs">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" />
              Pedidos Fechados
            </span>
            <div className="text-xl sm:text-2xl font-black font-display text-white mt-1">
              {totalClosedOrdersCount}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Vendas concluídas ou em produção
            </span>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 backdrop-blur-xs">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-amber-400" />
              Ticket Médio por Cliente
            </span>
            <div className="text-xl sm:text-2xl font-black font-display text-white mt-1">
              {formatCurrency(averagePortfolioTicket)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Média por pedido finalizado
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filter and Sorting Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, empresa, telefone, e-mail, CPF/CNPJ ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-semibold focus:border-indigo-600 outline-none"
            >
              <option value="ltv">Maior LTV (Lifetime Value)</option>
              <option value="orders">Mais Pedidos Fechados</option>
              <option value="recent">Mais Recentes</option>
              <option value="name">Nome (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Tag Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
              selectedTag === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTag('vip')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
              selectedTag === 'vip'
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>VIPs ({vipClientsCount})</span>
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTag(t)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                selectedTag === t
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      {filteredAndSortedClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || selectedTag !== 'all'
              ? 'Nenhum resultado corresponde aos filtros aplicados. Tente ajustar a busca.'
              : 'Cadastre o primeiro cliente da sua oficina para acompanhar o histórico de orçamentos e LTV.'}
          </p>
          <button
            type="button"
            onClick={handleOpenNewClient}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Cliente Agora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedClients.map(({ client, metrics }) => {
            const isExpanded = !!expandedClientIds[client.id];
            const whatsappUrl = getWhatsAppDirectUrl(
              client.phone,
              `Olá ${client.name.split(' ')[0]}, tudo bem? Aqui é da oficina de impressão 3D ConexLab.`
            );

            return (
              <div
                key={client.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:border-indigo-300 transition-all"
              >
                {/* Main Client Card Header */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Avatar & Basic Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold font-display text-lg shadow-sm">
                        {getInitials(client.name)}
                      </div>
                      {metrics.isVip && (
                        <div
                          title="Cliente VIP / Alto Valor"
                          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] shadow-xs border-2 border-white"
                        >
                          ★
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 font-display">
                          {client.name}
                        </h3>

                        {client.companyName && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            <Building2 className="h-3 w-3 text-slate-500" />
                            {client.companyName}
                          </span>
                        )}

                        {metrics.isVip && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            Cliente VIP
                          </span>
                        )}

                        {client.customDiscountPercent && client.customDiscountPercent > 0 ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <Percent className="h-2.5 w-2.5" />
                            {client.customDiscountPercent}% Desconto Fidelidade
                          </span>
                        ) : null}
                      </div>

                      {/* Contact Badges */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                        {client.phone && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                            {client.phone}
                          </span>
                        )}

                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {client.email}
                          </span>
                        )}

                        {client.document && (
                          <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                            Doc: {client.document}
                          </span>
                        )}

                        {client.address && (
                          <span className="hidden sm:flex items-center gap-1 text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {client.address}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {client.tags && client.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1.5">
                          {client.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center/Right: Financial Metrics (LTV, Orders, Avg Ticket) */}
                  <div className="flex items-center gap-3 self-end lg:self-center flex-wrap sm:flex-nowrap">
                    {/* Lifetime Value Metric Box */}
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 px-4 py-2.5 text-right min-w-[140px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Lifetime Value (LTV)
                      </span>
                      <div className="text-lg font-black text-emerald-950 font-display">
                        {formatCurrency(metrics.ltv)}
                      </div>
                      <span className="text-[10px] text-emerald-800/80 font-medium block">
                        {metrics.totalClosedOrders}{' '}
                        {metrics.totalClosedOrders === 1 ? 'pedido fechado' : 'pedidos fechados'}
                      </span>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-left text-xs space-y-0.5 min-w-[130px]">
                      <div className="text-[11px] text-slate-500">
                        Total Orçamentos: <strong className="text-slate-800">{metrics.totalQuotes}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ticket Médio: <strong className="text-slate-800">{formatCurrency(metrics.averageTicket)}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Atividade: {metrics.lastActivityDate || client.createdAt}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {/* Select for Quote Button */}
                      <button
                        type="button"
                        onClick={() => onSelectClientForQuote(client)}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
                        title="Carregar dados deste cliente e abrir o Editor de Orçamento"
                      >
                        <span>Novo Orçamento</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 text-[11px] font-semibold transition"
                            title="Conversar no WhatsApp"
                          >
                            <Share2 className="h-3 w-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditClient(client)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition"
                          title="Editar cadastro deste cliente"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                          title="Excluir cliente"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internal Notes Preview (if any) */}
                {client.notes && (
                  <div className="px-5 py-2 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
                    <span className="font-semibold text-slate-700 shrink-0">Nota Técnica:</span>
                    <p className="italic">{client.notes}</p>
                  </div>
                )}

                {/* Collapsible Quotes & Orders History */}
                <div className="border-t border-slate-100 bg-slate-50/30">
                  <button
                    type="button"
                    onClick={() => toggleExpand(client.id)}
                    className="w-full px-5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-indigo-700 transition"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Histórico de Orçamentos & Pedidos ({client.history?.length || 0})</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-bold">
                      {isExpanded ? (
                        <>
                          <span>Ocultar Histórico</span>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Ver Histórico Completo</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 space-y-2.5 animate-fadeIn">
                      {(!client.history || client.history.length === 0) ? (
                        <div className="text-xs text-slate-400 py-3 text-center bg-white rounded-xl border border-slate-200">
                          Nenhum orçamento anterior arquivado para este cliente.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                              <tr>
                                <th className="py-2.5 px-3">Cód. Orçamento</th>
                                <th className="py-2.5 px-3">Data</th>
                                <th className="py-2.5 px-3">Resumo das Peças</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3 text-right">Valor Total</th>
                                <th className="py-2.5 px-3 text-center">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {client.history.map((hist) => {
                                const isClosed = hist.status === 'closed' || hist.status === 'delivered';
                                return (
                                  <tr key={hist.id} className="hover:bg-indigo-50/30 transition">
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                      {hist.quoteNumber}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                      {hist.date}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-700">
                                      {hist.summary || `${hist.totalPieces} peças`}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          isClosed
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : hist.status === 'approved'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {isClosed
                                          ? 'Venda Fechada'
                                          : hist.status === 'approved'
                                          ? 'Aprovado'
                                          : 'Orçado'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-display">
                                      {formatCurrency(hist.totalValue)}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => onSelectClientForQuote(client)}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                        title="Iniciar novo orçamento para este cliente"
                                      >
                                        <span>Usar Cliente</span>
                                        <ArrowRight className="h-3 w-3" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Editor / Create Modal */}
      {isEditorModalOpen && (
        <ClientEditorModal
          client={editingClient}
          isOpen={isEditorModalOpen}
          onClose={() => {
            setIsEditorModalOpen(false);
            setEditingClient(null);
          }}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
}
