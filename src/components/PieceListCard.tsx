import { useState } from 'react';
import { Edit2, Copy, Trash2, ChevronDown, ChevronUp, ShieldCheck, Box, Sparkles, Zap, Clock, Coins, Wrench } from 'lucide-react';
import { PieceItem, MaterialConfig, PrinterConfig, WorkshopSettings } from '../types';
import { calculatePieceCost, formatCurrency, formatNumber } from '../utils/costCalculator';

interface PieceListCardProps {
  key?: string;
  piece: PieceItem;
  materials: MaterialConfig[];
  printers: PrinterConfig[];
  settings: WorkshopSettings;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function PieceListCard({
  piece,
  materials,
  printers,
  settings,
  onEdit,
  onDuplicate,
  onDelete,
}: PieceListCardProps) {
  const [showInternalCosts, setShowInternalCosts] = useState(false);

  const calculated = calculatePieceCost(piece, materials, printers, settings);
  const material = materials.find((m) => m.id === piece.materialId);
  const printer = printers.find((p) => p.id === piece.printerId);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all overflow-hidden">
      {/* Top Banner with Piece Name and Client Price */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                <Box className="h-3.5 w-3.5" />
                {piece.quantity}x {piece.quantity === 1 ? 'unidade' : 'unidades'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {piece.technology}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                <span
                  className="h-2 w-2 rounded-full border border-slate-300"
                  style={{ backgroundColor: piece.materialColor || '#475569' }}
                />
                {piece.materialName} ({piece.materialType || material?.type || 'Filamento'})
              </span>
              {(piece.printerName || printer?.name) && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200/60">
                  {piece.printerName || printer?.name} ({piece.customPrinterWatts || printer?.powerWatts || 150}W)
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
              {piece.name}
            </h3>

            {piece.description && (
              <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl">
                {piece.description}
              </p>
            )}

            {/* Private Technical Production Specs (Maker Only) */}
            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1 text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Especificações de Produção (Visão Privada):
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Oculto da proposta do cliente
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 border border-slate-200 shadow-2xs">
                  <span className="text-slate-400">Camada:</span>
                  <strong className="text-slate-800">{piece.layerHeight}</strong>
                </span>

                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 border border-slate-200 shadow-2xs">
                  <span className="text-slate-400">Preenchimento:</span>
                  <strong className="text-slate-800">{piece.infill}</strong>
                </span>

                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 border border-slate-200 shadow-2xs">
                  <span className="text-slate-400">Acabamento:</span>
                  <strong className="text-slate-800">{piece.finish || 'Natural'}</strong>
                </span>

                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200/80">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span>{piece.printTimeHours}h {piece.printTimeMinutes}m</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800 border border-indigo-200/80">
                  <Zap className="h-3 w-3 text-indigo-600" />
                  <span>{piece.weightGrams}g</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Box (Client Sale Price) */}
          <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-start border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 sm:text-right">
            <div>
              <span className="text-[11px] font-medium uppercase text-slate-400 block">
                Valor para o Cliente
              </span>
              <div className="text-xl font-extrabold text-slate-900">
                {formatCurrency(calculated.totalPrice)}
              </div>
              <div className="text-xs text-slate-500">
                {formatCurrency(calculated.unitPrice)} / un
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 mt-2">
              <button
                type="button"
                onClick={onEdit}
                title="Editar parâmetros e custos"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onDuplicate}
                title="Duplicar peça"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                title="Excluir peça"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Cost Accordion Toggle */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setShowInternalCosts(!showInternalCosts)}
            className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-indigo-600 transition"
          >
            {showInternalCosts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>{showInternalCosts ? 'Ocultar Custos Internos da Oficina' : 'Ver Custos Internos da Oficina (Segredo Maker)'}</span>
          </button>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <ShieldCheck className="h-3 w-3" />
            Não visível no PDF do cliente
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            Custo total: <strong className="text-slate-800">{formatCurrency(calculated.costWithRisk * piece.quantity)}</strong>
          </span>
          <span className="text-emerald-600 font-semibold">
            Lucro: +{formatCurrency(calculated.totalProfit)}
          </span>
        </div>
      </div>

      {/* Internal Cost Breakdown Panel (Maker View Only) */}
      {showInternalCosts && (
        <div className="border-t border-slate-200/80 bg-slate-900 text-slate-100 p-4 text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-300 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold text-white">Composição de Custo Unitário de Fabricação</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Máquina: {piece.printerName || printer?.name || 'Bambu Lab A1 Combo'} | Risco falha: {piece.failureRiskPercent}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-700/60">
              <span className="text-[10px] uppercase text-slate-400 block">
                Material ({piece.weightGrams}g / {calculated.weightKg.toFixed(3)}kg)
              </span>
              <span className="text-sm font-bold text-white block">{formatCurrency(calculated.materialCost)}</span>
              <span className="text-[10px] text-slate-400">
                1kg rende {calculated.piecesPerKg > 0 ? calculated.piecesPerKg.toFixed(1) : '0'} pçs • {formatCurrency(piece.customMaterialPrice ?? material?.spoolPrice ?? 100)}/kg
              </span>
            </div>

            <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-700/60">
              <span className="text-[10px] uppercase text-slate-400 block">
                Energia ({piece.printTimeHours}h {piece.printTimeMinutes}m)
              </span>
              <span className="text-sm font-bold text-white block">{formatCurrency(calculated.energyCost)}</span>
              <span className="text-[10px] text-slate-400">
                {calculated.powerKw.toFixed(3)} kW (~95W) • {calculated.kwhConsumed.toFixed(2)} kWh @ {formatCurrency(settings.kwhCost || 0.89)}
              </span>
            </div>

            <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-700/60">
              <span className="text-[10px] uppercase text-slate-400 block">Desgaste Máquina</span>
              <span className="text-sm font-bold text-white block">{formatCurrency(calculated.depreciationCost)}</span>
              <span className="text-[10px] text-slate-400">Depreciação + Peças</span>
            </div>

            <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-700/60">
              <span className="text-[10px] uppercase text-slate-400 block">Mão de Obra ({piece.operatorMinutes}m)</span>
              <span className="text-sm font-bold text-white block">{formatCurrency(calculated.laborCost)}</span>
              <span className="text-[10px] text-slate-400">Fatiamento & Pós-processo</span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-lg bg-emerald-950/60 p-2 border border-emerald-800/60">
              <span className="text-[10px] uppercase text-emerald-300 block">Lucro Líquido Unit.</span>
              <span className="text-sm font-bold text-emerald-400 block">+{formatCurrency(calculated.unitProfit)}</span>
              <span className="text-[10px] text-emerald-300/80">{formatNumber(calculated.profitPercentage, 0)}% margem</span>
            </div>
          </div>

          {piece.additionalCosts > 0 && (
            <p className="text-[11px] text-slate-400">
              * Custos adicionais de insumos (parafusos/embalagem): {formatCurrency(piece.additionalCosts)} por unidade.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
