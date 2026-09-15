import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Layers, DollarSign, Package } from 'lucide-react';
import { ClosedSale } from '../types';
import { formatCurrency, formatNumber } from '../utils/costCalculator';

interface SalesDashboardProps {
  sales: ClosedSale[];
}

// Color palette for materials
const MATERIAL_COLORS: Record<string, string> = {
  PLA: '#6366f1', // Indigo
  PETG: '#06b6d4', // Cyan
  ABS: '#f59e0b', // Amber
  TPU: '#ec4899', // Pink
  Resina: '#8b5cf6', // Violet
  Nylon: '#10b981', // Emerald
  Outros: '#64748b', // Slate
};

const FALLBACK_PALETTE = [
  '#6366f1',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#f97316',
  '#14b8a6',
];

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function SalesDashboard({ sales }: SalesDashboardProps) {
  const [metricView, setMetricView] = useState<'both' | 'revenueOnly'>('both');

  // 1. Process Monthly Billing & Profit Data
  const monthlyData = useMemo(() => {
    const monthsMap: Record<
      string,
      {
        key: string;
        label: string;
        faturamento: number;
        lucro: number;
        custo: number;
        pedidos: number;
        pecas: number;
      }
    > = {};

    sales.forEach((sale) => {
      if (!sale.closedDate) return;
      const date = new Date(sale.closedDate + 'T12:00:00');
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[monthIdx]}/${String(year).slice(-2)}`;

      if (!monthsMap[key]) {
        monthsMap[key] = {
          key,
          label,
          faturamento: 0,
          lucro: 0,
          custo: 0,
          pedidos: 0,
          pecas: 0,
        };
      }

      monthsMap[key].faturamento += sale.finalTotal || 0;
      monthsMap[key].lucro += sale.netProfit || 0;
      monthsMap[key].custo += sale.productionCost || 0;
      monthsMap[key].pedidos += 1;
      monthsMap[key].pecas += sale.totalPieces || 0;
    });

    // Sort chronologically
    return Object.values(monthsMap).sort((a, b) => a.key.localeCompare(b.key));
  }, [sales]);

  // 2. Process Material Distribution Data (Grams & Percent)
  const materialData = useMemo(() => {
    const materialsMap: Record<
      string,
      {
        name: string;
        weightGrams: number;
        piecesCount: number;
        revenue: number;
      }
    > = {};

    let totalWeightAll = 0;

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        // Detect material group (PLA, PETG, ABS, TPU, Resina or extract from name)
        let matType = (item.materialType || '').trim();
        if (!matType) {
          const nameUpper = (item.materialName || '').toUpperCase();
          if (nameUpper.includes('PLA')) matType = 'PLA';
          else if (nameUpper.includes('PETG')) matType = 'PETG';
          else if (nameUpper.includes('ABS')) matType = 'ABS';
          else if (nameUpper.includes('TPU') || nameUpper.includes('FLEX')) matType = 'TPU';
          else if (nameUpper.includes('RESIN') || nameUpper.includes('SLA')) matType = 'Resina';
          else if (nameUpper.includes('NYLON')) matType = 'Nylon';
          else matType = 'Outros';
        }

        const grams = (item.weightGrams || 0) * (item.quantity || 1);
        totalWeightAll += grams;

        if (!materialsMap[matType]) {
          materialsMap[matType] = {
            name: matType,
            weightGrams: 0,
            piecesCount: 0,
            revenue: 0,
          };
        }

        materialsMap[matType].weightGrams += grams;
        materialsMap[matType].piecesCount += item.quantity || 1;
        materialsMap[matType].revenue += item.totalPrice || 0;
      });
    });

    // Calculate percentage and format
    const list = Object.values(materialsMap).map((m, idx) => ({
      ...m,
      percentage: totalWeightAll > 0 ? (m.weightGrams / totalWeightAll) * 100 : 0,
      color: MATERIAL_COLORS[m.name] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
    }));

    // Sort by weight descending
    return list.sort((a, b) => b.weightGrams - a.weightGrams);
  }, [sales]);

  // Highlights
  const totalWeightRecorded = materialData.reduce((acc, m) => acc + m.weightGrams, 0);
  const topMaterial = materialData[0] || null;

  const peakMonth = useMemo(() => {
    if (monthlyData.length === 0) return null;
    return [...monthlyData].sort((a, b) => b.faturamento - a.faturamento)[0];
  }, [monthlyData]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-6">
      {/* Header with Title and Legend Highlights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Dashboard de Faturamento & Materiais Consumidos
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Análise visual do histórico de faturamento mensal e participação dos materiais em vendas concluídas.
          </p>
        </div>

        {/* View switcher for bar chart */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setMetricView('both')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              metricView === 'both'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faturamento + Lucro
          </button>
          <button
            type="button"
            onClick={() => setMetricView('revenueOnly')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              metricView === 'revenueOnly'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Apenas Faturamento
          </button>
        </div>
      </div>

      {/* Grid: 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Monthly Revenue Bar Chart (7 columns on large screens) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-slate-50/70 border border-slate-200/80 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Evolução do Faturamento Mensal (R$)
              </span>
            </div>
            {peakMonth && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-indigo-100/80 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                Pico: {peakMonth.label} ({formatCurrency(peakMonth.faturamento)})
              </span>
            )}
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <BarChart3 className="h-10 w-10 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-medium">Nenhuma venda registrada no período selecionado.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Feche um orçamento ou registre uma venda manual para visualizar os gráficos.
              </p>
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1.5 min-w-[170px]">
                            <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
                              <span>{label}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {data.pedidos} pedido(s)
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-indigo-700 font-semibold">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600 inline-block" />
                                Faturamento:
                              </span>
                              <span>{formatCurrency(data.faturamento)}</span>
                            </div>
                            {metricView === 'both' && (
                              <>
                                <div className="flex items-center justify-between gap-4 text-emerald-600 font-semibold">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
                                    Lucro Líquido:
                                  </span>
                                  <span>{formatCurrency(data.lucro)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                                  <span>Custo Oficina:</span>
                                  <span>{formatCurrency(data.custo)}</span>
                                </div>
                              </>
                            )}
                            <div className="text-[10px] text-slate-400 text-right pt-0.5">
                              {data.pecas} peça(s) produzida(s)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                    iconType="circle"
                    formatter={(val) => {
                      if (val === 'faturamento') return 'Faturamento (Receita)';
                      if (val === 'lucro') return 'Lucro Líquido';
                      return val;
                    }}
                  />
                  <Bar
                    dataKey="faturamento"
                    name="faturamento"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  {metricView === 'both' && (
                    <Bar
                      dataKey="lucro"
                      name="lucro"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bottom Bar Sub-metric */}
          <div className="mt-2 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Períodos analisados: <strong>{monthlyData.length} mês(es)</strong></span>
            <span>
              Total no período:{' '}
              <strong className="text-slate-900 font-bold">
                {formatCurrency(monthlyData.reduce((acc, m) => acc + m.faturamento, 0))}
              </strong>
            </span>
          </div>
        </div>

        {/* Chart 2: Material Distribution Pie Chart (5 columns on large screens) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-slate-50/70 border border-slate-200/80 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Materiais Mais Utilizados em Vendas
              </span>
            </div>
            {topMaterial && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: `${topMaterial.color}18`, color: topMaterial.color }}
              >
                Top 1: {topMaterial.name} ({topMaterial.percentage.toFixed(0)}%)
              </span>
            )}
          </div>

          {materialData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <PieIcon className="h-10 w-10 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-medium">Nenhum consumo de material registrado.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Os materiais consumidos nas peças vendidas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              {/* Donut Chart */}
              <div className="w-full sm:w-1/2 h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialData}
                      dataKey="weightGrams"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {materialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg text-xs space-y-1">
                              <div className="font-bold flex items-center gap-1.5" style={{ color: data.color }}>
                                <span
                                  className="h-2.5 w-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: data.color }}
                                />
                                {data.name}
                              </div>
                              <div className="text-slate-700">
                                <strong>{(data.weightGrams / 1000).toFixed(3)} kg</strong> ({data.weightGrams}g)
                              </div>
                              <div className="text-slate-500 text-[11px]">
                                Participação: <strong>{data.percentage.toFixed(1)}%</strong>
                              </div>
                              <div className="text-slate-500 text-[11px]">
                                Peças produzidas: <strong>{data.piecesCount}</strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Badge inside donut */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
                  <span className="text-xs font-bold text-slate-800">
                    {(totalWeightRecorded / 1000).toFixed(2)} kg
                  </span>
                </div>
              </div>

              {/* Material Legend & Details List */}
              <div className="w-full sm:w-1/2 space-y-2 text-xs">
                {materialData.slice(0, 5).map((mat) => (
                  <div
                    key={mat.name}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/80 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 rounded-md shrink-0"
                        style={{ backgroundColor: mat.color }}
                      />
                      <span className="font-semibold text-slate-800 truncate" title={mat.name}>
                        {mat.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 block text-[11px]">
                        {(mat.weightGrams / 1000).toFixed(2)} kg
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {mat.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Pie Sub-metric */}
          <div className="mt-2 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Variedades de materiais: <strong>{materialData.length}</strong></span>
            <span>
              Filamento Total:{' '}
              <strong className="text-emerald-700 font-bold">
                {(totalWeightRecorded / 1000).toFixed(3)} kg
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
