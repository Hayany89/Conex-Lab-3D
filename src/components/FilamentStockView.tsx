import { useState, useMemo } from 'react';
import {
  Box,
  Plus,
  Search,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Filter,
  Sparkles,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  X,
  RefreshCw,
  Info,
  DollarSign,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { FilamentSpool } from '../types';
import { formatCurrency } from '../utils/costCalculator';

interface FilamentStockViewProps {
  spools: FilamentSpool[];
  onChangeSpools: (spools: FilamentSpool[]) => void;
}

// Tare reference values for popular 3D printing brands in Brazil & Global
const POPULAR_SPOOL_TARES: { [key: string]: number } = {
  'Voolt3D': 230,
  'eSun': 215,
  'Bambu Lab': 195,
  '3D Fila': 225,
  'Printalot': 240,
  'Creality': 210,
  'Suntop': 220,
  'Polymaker': 200,
  'Elegoo (Resina 1kg)': 90,
  'Outro': 220,
};

export function FilamentStockView({ spools, onChangeSpools }: FilamentStockViewProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal states
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingSpool, setEditingSpool] = useState<FilamentSpool | null>(null);

  // Scale Calculator Modal state
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [scaleTargetSpool, setScaleTargetSpool] = useState<FilamentSpool | null>(null);
  const [scaleGrossWeight, setScaleGrossWeight] = useState<number>(0);
  const [scaleTareWeight, setScaleTareWeight] = useState<number>(220);

  // Filtered Spools
  const filteredSpools = useMemo(() => {
    return spools.filter((spool) => {
      const matchesSearch =
        spool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spool.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spool.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (spool.location && spool.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMaterial =
        selectedMaterialFilter === 'all' || spool.materialType === selectedMaterialFilter;

      const matchesStatus =
        selectedStatusFilter === 'all'
          ? true
          : selectedStatusFilter === 'critical'
          ? spool.currentWeightGrams <= spool.minStockAlertGrams && spool.status !== 'empty'
          : spool.status === selectedStatusFilter;

      return matchesSearch && matchesMaterial && matchesStatus;
    });
  }, [spools, searchTerm, selectedMaterialFilter, selectedStatusFilter]);

  // Aggregate Metrics
  const totalWeightRemainingKg = spools.reduce((acc, s) => acc + (s.currentWeightGrams || 0), 0) / 1000;
  
  const totalValueInStock = spools.reduce((acc, s) => {
    const fraction = s.initialWeightGrams > 0 ? s.currentWeightGrams / s.initialWeightGrams : 0;
    return acc + s.purchasePrice * fraction;
  }, 0);

  const inUseCount = spools.filter((s) => s.status === 'in_use' && s.currentWeightGrams > 0).length;
  const sealedCount = spools.filter((s) => s.status === 'sealed').length;
  const criticalCount = spools.filter(
    (s) => s.currentWeightGrams <= s.minStockAlertGrams && s.status !== 'empty'
  ).length;

  // Handlers for spool adjustments
  const handleQuickWeightAdjust = (spoolId: string, deltaGrams: number) => {
    const updated = spools.map((s) => {
      if (s.id === spoolId) {
        const newWeight = Math.max(0, Math.min(s.initialWeightGrams * 1.5, s.currentWeightGrams + deltaGrams));
        return {
          ...s,
          currentWeightGrams: newWeight,
          status: newWeight === 0 ? ('empty' as const) : s.status === 'sealed' ? 'in_use' : s.status,
        };
      }
      return s;
    });
    onChangeSpools(updated);
  };

  const handleDeleteSpool = (spoolId: string) => {
    if (confirm('Tem certeza que deseja remover este carretel do estoque?')) {
      onChangeSpools(spools.filter((s) => s.id !== spoolId));
    }
  };

  const handleOpenEdit = (spool: FilamentSpool) => {
    setEditingSpool(spool);
    setIsEditorModalOpen(true);
  };

  const handleOpenNew = () => {
    const newSpool: FilamentSpool = {
      id: `spool-${Date.now()}`,
      name: 'PLA Premium Preto',
      brand: 'Voolt3D',
      materialType: 'PLA',
      colorName: 'Preto',
      colorHex: '#1e293b',
      diameterMm: 1.75,
      initialWeightGrams: 1000,
      currentWeightGrams: 1000,
      emptySpoolWeightGrams: 230,
      purchasePrice: 99.9,
      purchaseDate: new Date().toISOString().split('T')[0],
      location: 'Armário de Estoque',
      status: 'sealed',
      minStockAlertGrams: 150,
      notes: '',
    };
    setEditingSpool(newSpool);
    setIsEditorModalOpen(true);
  };

  const handleSaveSpool = (saved: FilamentSpool) => {
    const exists = spools.some((s) => s.id === saved.id);
    if (exists) {
      onChangeSpools(spools.map((s) => (s.id === saved.id ? saved : s)));
    } else {
      onChangeSpools([saved, ...spools]);
    }
    setIsEditorModalOpen(false);
    setEditingSpool(null);
  };

  // Open Scale Tare Calculator
  const handleOpenScale = (spool: FilamentSpool) => {
    setScaleTargetSpool(spool);
    setScaleTareWeight(spool.emptySpoolWeightGrams || POPULAR_SPOOL_TARES[spool.brand] || 220);
    setScaleGrossWeight((spool.currentWeightGrams || 0) + (spool.emptySpoolWeightGrams || 220));
    setIsScaleModalOpen(true);
  };

  const handleApplyScaleCalculation = () => {
    if (!scaleTargetSpool) return;
    const netWeight = Math.max(0, scaleGrossWeight - scaleTareWeight);
    const updated = spools.map((s) => {
      if (s.id === scaleTargetSpool.id) {
        return {
          ...s,
          currentWeightGrams: netWeight,
          emptySpoolWeightGrams: scaleTareWeight,
          status: netWeight === 0 ? ('empty' as const) : s.status === 'sealed' ? 'in_use' : s.status,
        };
      }
      return s;
    });
    onChangeSpools(updated);
    setIsScaleModalOpen(false);
    setScaleTargetSpool(null);
  };

  // CSV Inventory Export for purchasing and external audits
  const handleExportCSV = (targetList: FilamentSpool[] = spools) => {
    if (targetList.length === 0) {
      alert('Não há carretéis de filamento no estoque para exportar.');
      return;
    }

    const headers = [
      'Nome do Filamento',
      'Fabricante / Marca',
      'Tipo de Material',
      'Cor',
      'Diâmetro (mm)',
      'Peso Restante (g)',
      'Peso Restante (kg)',
      'Peso Inicial (g)',
      'Tara Carretel Vazio (g)',
      'Peso Bruto c/ Carretel (g)',
      'Status do Estoque',
      'Estoque Mínimo Alerta (g)',
      'Necessidade de Compra / Reposição',
      'Preço de Compra (R$)',
      'Valor Residual em Estoque (R$)',
      'Localização / Dry Box',
      'Lote / Batch',
      'Data da Compra',
      'Observações',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = targetList.map((spool) => {
      const isCritical =
        spool.currentWeightGrams <= spool.minStockAlertGrams && spool.status !== 'empty';
      const isEmpty = spool.status === 'empty' || spool.currentWeightGrams === 0;

      let statusLabel = 'Em uso';
      if (spool.status === 'sealed') statusLabel = 'Lacrado (Novo)';
      else if (isEmpty) statusLabel = 'Esgotado (Vazio)';
      else if (isCritical) statusLabel = 'Crítico (Abaixo do limite)';

      let purchaseNeed = 'Estoque Regular';
      if (isEmpty) purchaseNeed = 'URGENTE: Carretel Esgotado';
      else if (isCritical) purchaseNeed = 'RECOMENDADO: Reposição Necessária';

      const fraction =
        spool.initialWeightGrams > 0 ? spool.currentWeightGrams / spool.initialWeightGrams : 0;
      const residualValue = (spool.purchasePrice * fraction).toFixed(2);
      const grossWeight = (spool.currentWeightGrams || 0) + (spool.emptySpoolWeightGrams || 0);

      return [
        escapeCsv(spool.name),
        escapeCsv(spool.brand),
        escapeCsv(spool.materialType),
        escapeCsv(spool.colorName),
        escapeCsv(spool.diameterMm.toFixed(2)),
        escapeCsv(spool.currentWeightGrams),
        escapeCsv((spool.currentWeightGrams / 1000).toFixed(3)),
        escapeCsv(spool.initialWeightGrams),
        escapeCsv(spool.emptySpoolWeightGrams || 0),
        escapeCsv(grossWeight),
        escapeCsv(statusLabel),
        escapeCsv(spool.minStockAlertGrams),
        escapeCsv(purchaseNeed),
        escapeCsv(spool.purchasePrice.toFixed(2)),
        escapeCsv(residualValue),
        escapeCsv(spool.location || 'Oficina'),
        escapeCsv(spool.batchNumber || '-'),
        escapeCsv(spool.purchaseDate || '-'),
        escapeCsv(spool.notes || '-'),
      ].join(';');
    });

    // UTF-8 BOM ensures Excel / Sheets parses special accented characters correctly
    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    const isFiltered = targetList.length < spools.length;
    link.href = url;
    link.setAttribute(
      'download',
      `estoque_filamentos_conexlab_${today}${isFiltered ? '_filtrado' : ''}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Dashboard Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-indigo-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Almoxarifado & Estoque de Matéria-Prima
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-white mt-1">
              Estoque de Filamentos & Resinas
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Controle preciso de carretéis, pesagem por tara da balança e consumo por orçamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleExportCSV(spools)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-bold text-white border border-slate-700 shadow-sm transition"
              title="Exportar inventário completo em formato CSV para Excel/Google Sheets e compras"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNew}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition"
            >
              <Plus className="h-4 w-4" />
              <span>+ Adicionar Carretel</span>
            </button>
          </div>
        </div>

        {/* Inventory KPI Cards */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total em Estoque
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-2xl font-extrabold text-white font-display">
                {totalWeightRemainingKg.toFixed(2)}
              </strong>
              <span className="text-xs text-indigo-300 font-semibold">kg</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              {spools.length} carretel(is) cadastrados
            </span>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Valor Imobilizado
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-2xl font-extrabold text-emerald-400 font-display">
                {formatCurrency(totalValueInStock)}
              </strong>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Valor proporcional restante</span>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Carretéis Ativos
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-extrabold text-indigo-300 font-display">
                {inUseCount}
              </strong>
              <span className="text-xs text-slate-400">em uso • {sealedCount} lacrado(s)</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Alocados em máquinas e dry boxes</span>
          </div>

          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Estoque Baixo / Crítico
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <strong
                className={`text-2xl font-extrabold font-display ${
                  criticalCount > 0 ? 'text-amber-400' : 'text-slate-300'
                }`}
              >
                {criticalCount}
              </strong>
              <span className="text-xs text-slate-400">carretel(is)</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Abaixo do limite de segurança</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cor, marca, polímero ou localização (ex: AMS, Dry Box)..."
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
          {/* Material Type filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Material:</span>
            <select
              value={selectedMaterialFilter}
              onChange={(e) => setSelectedMaterialFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="all">Todos os Tipos</option>
              <option value="PLA">PLA</option>
              <option value="PETG">PETG</option>
              <option value="ABS">ABS</option>
              <option value="TPU">TPU Flex</option>
              <option value="ASA">ASA</option>
              <option value="Nylon">Nylon</option>
              <option value="Resina">Resina</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="in_use">Em Uso</option>
              <option value="sealed">Lacrados / Novos</option>
              <option value="critical">⚠️ Estoque Baixo</option>
              <option value="empty">Vazios</option>
            </select>
          </div>

          {/* Quick CSV Export for active filter */}
          <button
            type="button"
            onClick={() => handleExportCSV(filteredSpools)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl px-2.5 py-2 transition"
            title="Exportar a lista atual para planilha CSV"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>CSV {filteredSpools.length < spools.length ? `(${filteredSpools.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Spools Grid */}
      {filteredSpools.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Package className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 font-display">
            Nenhum carretel encontrado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não há materiais correspondentes aos filtros aplicados. Tente limpar os filtros ou adicionar um novo carretel ao estoque.
          </p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Primeiro Carretel</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpools.map((spool) => {
            const percentage =
              spool.initialWeightGrams > 0
                ? Math.min(100, Math.round((spool.currentWeightGrams / spool.initialWeightGrams) * 100))
                : 0;

            const isCritical = spool.currentWeightGrams <= spool.minStockAlertGrams && spool.status !== 'empty';
            const isEmpty = spool.currentWeightGrams <= 0 || spool.status === 'empty';

            // Progress bar color
            const barColor = isEmpty
              ? 'bg-slate-300'
              : isCritical
              ? 'bg-amber-500'
              : percentage > 40
              ? 'bg-emerald-500'
              : 'bg-indigo-500';

            return (
              <div
                key={spool.id}
                className={`rounded-2xl border bg-white p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                  isCritical
                    ? 'border-amber-300 bg-amber-50/20'
                    : isEmpty
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header: Color chip + Material badge + Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-7 w-7 rounded-full border border-slate-300 shadow-inner shrink-0"
                        style={{ backgroundColor: spool.colorHex || '#1e293b' }}
                        title={`Cor: ${spool.colorName} (${spool.colorHex})`}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {spool.materialType}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {spool.brand}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 font-display mt-0.5 line-clamp-1">
                          {spool.name}
                        </h4>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isEmpty
                          ? 'bg-slate-100 text-slate-500 border border-slate-200'
                          : isCritical
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : spool.status === 'sealed'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isEmpty
                        ? 'Vazio'
                        : isCritical
                        ? 'Estoque Baixo'
                        : spool.status === 'sealed'
                        ? 'Lacrado'
                        : 'Em Uso'}
                    </span>
                  </div>

                  {/* Location & Color info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pt-1 border-t border-slate-100">
                    <span className="truncate">
                      Cor: <strong className="text-slate-700">{spool.colorName}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      📍 {spool.location || 'Oficina'}
                    </span>
                  </div>

                  {/* Weight Progress Bar */}
                  <div className="space-y-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Saldo Restante:</span>
                      <span className="font-extrabold text-slate-900">
                        {spool.currentWeightGrams}g{' '}
                        <span className="text-slate-400 font-normal">/ {spool.initialWeightGrams}g</span>
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full ${barColor} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>{percentage}% disponível</span>
                      <span>
                        R$ {((spool.purchasePrice * (spool.currentWeightGrams / (spool.initialWeightGrams || 1)))).toFixed(2)} em filamento
                      </span>
                    </div>
                  </div>

                  {/* Quick Usage Increment/Decrement Buttons */}
                  <div className="flex items-center justify-between gap-1.5 mb-3">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Consumo Rápido:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickWeightAdjust(spool.id, -20)}
                        title="Consumir 20g (ex: purga / teste rápido)"
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 transition"
                      >
                        -20g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeightAdjust(spool.id, -50)}
                        title="Consumir 50g de impressão"
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 transition"
                      >
                        -50g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeightAdjust(spool.id, -100)}
                        title="Consumir 100g de impressão"
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 transition"
                      >
                        -100g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeightAdjust(spool.id, 100)}
                        title="Adicionar / Ajustar 100g"
                        className="rounded-lg bg-indigo-50 hover:bg-indigo-100 px-2 py-1 text-[11px] font-bold text-indigo-700 transition"
                      >
                        +100g
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenScale(spool)}
                    title="Pesar com o carretel na balança e descontar a tara automaticamente"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 transition"
                  >
                    <Scale className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Pesar na Balança</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(spool)}
                      title="Editar dados do carretel"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSpool(spool.id)}
                      title="Excluir carretel"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scale Tare Calculator Modal */}
      {isScaleModalOpen && scaleTargetSpool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">
                    Pesagem com Tara da Balança
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {scaleTargetSpool.brand} {scaleTargetSpool.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScaleModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-indigo-900 leading-relaxed">
                Coloque o carretel inteiro na balança digital de precisão. Digite o peso total lido e a tara do carretel vazio. O sistema calcula a quantidade líquida de filamento restante!
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Peso Total Lido na Balança (g)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={scaleGrossWeight || ''}
                    onChange={(e) => setScaleGrossWeight(Number(e.target.value))}
                    placeholder="Ex: 850"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    gramas
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Tara do Carretel Vazio (g)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Padrão {scaleTargetSpool.brand}: ~{POPULAR_SPOOL_TARES[scaleTargetSpool.brand] || 220}g
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={scaleTareWeight || ''}
                    onChange={(e) => setScaleTareWeight(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                    tara (g)
                  </span>
                </div>

                {/* Popular Tare presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                  <span className="text-[10px] text-slate-400">Taras comuns:</span>
                  {Object.entries(POPULAR_SPOOL_TARES).slice(0, 5).map(([brand, weight]) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setScaleTareWeight(weight)}
                      className="rounded-md bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 transition"
                    >
                      {brand} ({weight}g)
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Calculation Result */}
              <div className="rounded-xl bg-slate-900 text-white p-4 space-y-1 text-center">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Filamento Líquido Restante
                </span>
                <div className="text-2xl font-black font-display text-emerald-400">
                  {Math.max(0, scaleGrossWeight - scaleTareWeight)} gramas
                </div>
                <span className="text-[10px] text-slate-400 block">
                  (Peso Balança: {scaleGrossWeight}g - Tara Carretel: {scaleTareWeight}g)
                </span>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsScaleModalOpen(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyScaleCalculation}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Salvar Saldo no Estoque</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spool Editor / Creator Modal */}
      {isEditorModalOpen && editingSpool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">
                    {editingSpool.id.startsWith('spool-') && spools.some((s) => s.id === editingSpool.id)
                      ? 'Editar Carretel de Filamento'
                      : 'Novo Carretel de Filamento'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Cadastro de especificações de material e pesagem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              {/* Name and Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome / Descrição do Carretel
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSpool.name}
                    onChange={(e) => setEditingSpool({ ...editingSpool, name: e.target.value })}
                    placeholder="Ex: PLA Premium Preto Ônix"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={editingSpool.brand}
                    onChange={(e) => setEditingSpool({ ...editingSpool, brand: e.target.value })}
                    placeholder="Ex: Voolt3D, eSun, Bambu Lab"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Material Type & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Polímero</label>
                  <select
                    value={editingSpool.materialType}
                    onChange={(e) =>
                      setEditingSpool({ ...editingSpool, materialType: e.target.value as any })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU (Flexível)</option>
                    <option value="ASA">ASA</option>
                    <option value="Nylon">Nylon</option>
                    <option value="Resina">Resina 405nm</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Cor</label>
                  <input
                    type="text"
                    value={editingSpool.colorName}
                    onChange={(e) =>
                      setEditingSpool({ ...editingSpool, colorName: e.target.value })
                    }
                    placeholder="Ex: Preto, Branco, Cinza"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amostra Visual Cor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingSpool.colorHex || '#1e293b'}
                      onChange={(e) =>
                        setEditingSpool({ ...editingSpool, colorHex: e.target.value })
                      }
                      className="h-9 w-12 rounded-xl border border-slate-300 p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingSpool.colorHex || '#1e293b'}
                      onChange={(e) =>
                        setEditingSpool({ ...editingSpool, colorHex: e.target.value })
                      }
                      className="flex-1 rounded-xl border border-slate-300 px-2 py-2 text-[11px] font-mono text-slate-700 outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Weights: Initial & Current */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peso Inicial (g)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={editingSpool.initialWeightGrams}
                    onChange={(e) =>
                      setEditingSpool({
                        ...editingSpool,
                        initialWeightGrams: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Saldo Atual (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editingSpool.currentWeightGrams}
                    onChange={(e) =>
                      setEditingSpool({
                        ...editingSpool,
                        currentWeightGrams: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-1.5 font-bold text-indigo-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tara Vazia (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={editingSpool.emptySpoolWeightGrams}
                    onChange={(e) =>
                      setEditingSpool({
                        ...editingSpool,
                        emptySpoolWeightGrams: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Price & Location & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Pago (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingSpool.purchasePrice}
                    onChange={(e) =>
                      setEditingSpool({ ...editingSpool, purchasePrice: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Localização</label>
                  <input
                    type="text"
                    value={editingSpool.location || ''}
                    onChange={(e) =>
                      setEditingSpool({ ...editingSpool, location: e.target.value })
                    }
                    placeholder="Ex: AMS Slot 1, Dry Box #1"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingSpool.status}
                    onChange={(e) =>
                      setEditingSpool({ ...editingSpool, status: e.target.value as any })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-indigo-600"
                  >
                    <option value="sealed">Lacrado / Novo</option>
                    <option value="in_use">Em Uso</option>
                    <option value="empty">Vazio / Finalizado</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações Técnicas / Lote
                </label>
                <input
                  type="text"
                  value={editingSpool.notes || ''}
                  onChange={(e) => setEditingSpool({ ...editingSpool, notes: e.target.value })}
                  placeholder="Ex: Lote 2026-A, secagem prévia a 50°C por 6h necessária."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditorModalOpen(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveSpool(editingSpool)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Salvar Carretel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
