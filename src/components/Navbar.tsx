import { Layers, FileText, Settings, Building2, CreditCard, Sparkles, CheckCircle2, TrendingUp, Box, Users } from 'lucide-react';
import { formatCurrency } from '../utils/costCalculator';

export type AppTab = 'editor' | 'proposal' | 'sales' | 'stock' | 'clients';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenCompanySettings: () => void;
  onOpenWorkshopSettings: () => void;
  companyName?: string;
  totalPieces?: number;
  grandTotal?: number;
  clientName?: string;
  closedSalesCount?: number;
  criticalSpoolsCount?: number;
  clientsCount?: number;
}

export function Navbar({
  currentTab,
  onSelectTab,
  onOpenCompanySettings,
  onOpenWorkshopSettings,
  companyName = 'ConexLab 3D',
  totalPieces = 0,
  grandTotal = 0,
  clientName,
  closedSalesCount = 0,
  criticalSpoolsCount = 0,
  clientsCount = 0,
}: NavbarProps) {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-md shadow-indigo-600/20 font-bold">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight font-display">
                {companyName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Manufatura 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Gestão de Vendas, Estoque de Filamentos & Custos ConexLab
            </p>
          </div>
        </div>

        {/* Center View Selector Tabs (Dynamic Pill with 4 modes) */}
        <div className="flex items-center rounded-xl bg-slate-100/90 p-1 border border-slate-200 shadow-2xs overflow-x-auto max-w-full">
          {/* 1. Painel & Custos */}
          <button
            type="button"
            onClick={() => onSelectTab('editor')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'editor'
                ? 'bg-white text-indigo-700 shadow-xs scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-indigo-600" />
            <span>Orçamento</span>
            {totalPieces > 0 && (
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                {totalPieces}
              </span>
            )}
          </button>

          {/* 2. Proposta Comercial PDF */}
          <button
            type="button"
            onClick={() => onSelectTab('proposal')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'proposal'
                ? 'bg-white text-indigo-700 shadow-xs scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Proposta</span>
            <span className="sm:hidden">PDF</span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          </button>

          {/* 3. Vendas Fechadas (Report) */}
          <button
            type="button"
            onClick={() => onSelectTab('sales')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'sales'
                ? 'bg-white text-emerald-700 shadow-xs scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span>Vendas Fechadas</span>
            {closedSalesCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {closedSalesCount}
              </span>
            )}
          </button>

          {/* 4. Estoque de Filamentos */}
          <button
            type="button"
            onClick={() => onSelectTab('stock')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'stock'
                ? 'bg-white text-indigo-700 shadow-xs scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="h-3.5 w-3.5 text-indigo-600" />
            <span>Estoque</span>
            {criticalSpoolsCount > 0 && (
              <span
                title={`${criticalSpoolsCount} carretel(is) com estoque baixo!`}
                className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse"
              >
                !
              </span>
            )}
          </button>

          {/* 5. Clientes & LTV */}
          <button
            type="button"
            onClick={() => onSelectTab('clients')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'clients'
                ? 'bg-white text-indigo-700 shadow-xs scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            <span>Clientes</span>
            {clientsCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {clientsCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Tools & Live Total Pill */}
        <div className="flex items-center gap-2">
          {grandTotal > 0 && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400">Total:</span>
              <strong className="text-slate-900 font-extrabold">{formatCurrency(grandTotal)}</strong>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCompanySettings}
            title="Alterar Dados da Empresa (CNPJ/CPF, Email, Telefone e Formas de Pagamento)"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-2 text-xs font-semibold text-indigo-800 transition shadow-2xs"
          >
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span className="hidden lg:inline">Empresa & Pagamento</span>
            <span className="lg:hidden">Empresa</span>
          </button>

          <button
            type="button"
            onClick={onOpenWorkshopSettings}
            title="Configurações da Oficina (Materiais, Impressoras e Energia)"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition shadow-2xs"
          >
            <Settings className="h-4 w-4 text-slate-600" />
            <span className="hidden md:inline">Oficina & Preços</span>
          </button>
        </div>
      </div>
    </header>
  );
}

