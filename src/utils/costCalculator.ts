import { PieceItem, MaterialConfig, PrinterConfig, WorkshopSettings, CalculatedPieceCost } from '../types';

export function calculatePieceCost(
  piece: PieceItem,
  materials: MaterialConfig[],
  printers: PrinterConfig[],
  settings: WorkshopSettings
): CalculatedPieceCost {
  const material = materials.find((m) => m.id === piece.materialId) || {
    spoolPrice: 110,
    spoolWeightGrams: 1000,
  };

  const printer = printers.find((p) => p.id === piece.printerId) || {
    powerWatts: 200,
    purchaseCost: 3500,
    lifetimeHours: 3500,
    maintenancePerHour: 1.2,
  };

  // 1. Material (Filamento)
  // O valor do filamento é o custo do quilo dividido pelo rendimento de peças que 1 kg produz (1 kg / quantidade em kg da peça)
  const weightGrams = Math.max(0, piece.weightGrams || 0);
  const weightKg = weightGrams / 1000;
  const activeSpoolPrice = (piece.customMaterialPrice !== undefined && piece.customMaterialPrice !== null && piece.customMaterialPrice > 0)
    ? piece.customMaterialPrice
    : (material.spoolPrice || 100);

  // Rendimento: quantas peças completas saem de 1 kg de filamento
  const piecesPerKg = weightKg > 0 ? (1 / weightKg) : 0;
  // Custo por peça = Custo do quilo / peças por quilo
  const materialCost = piecesPerKg > 0 ? (activeSpoolPrice / piecesPerKg) : 0;

  // 2. Tempo de impressão total em horas
  const totalPrintHours = Math.max(0, (piece.printTimeHours || 0) + (piece.printTimeMinutes || 0) / 60);

  // 3. Energia elétrica
  // Potência / consumo médio da máquina: 0,095 kW (média estabilizada de 90W a 95W)
  const powerKw = (piece.customPrinterWatts !== undefined && piece.customPrinterWatts !== null && piece.customPrinterWatts > 0)
    ? (piece.customPrinterWatts / 1000)
    : (printer?.powerWatts && printer.powerWatts > 0 ? (printer.powerWatts / 1000) : 0.095);

  // Valor médio da tarifa de energia elétrica: R$ 0,89 por kWh
  const kwhCost = (settings?.kwhCost !== undefined && settings.kwhCost !== null && settings.kwhCost > 0)
    ? settings.kwhCost
    : 0.89;

  // Custo por hora de energia (0,095 kW * R$ 0,89/kWh = ~R$ 0,08455/h)
  const hourlyEnergyCost = (piece.customEnergyCostPerHour !== undefined && piece.customEnergyCostPerHour !== null && piece.customEnergyCostPerHour >= 0)
    ? piece.customEnergyCostPerHour
    : (powerKw * kwhCost);

  const kwhConsumed = totalPrintHours * powerKw;
  const energyCost = totalPrintHours * hourlyEnergyCost;

  // 4. Depreciação e manutenção da máquina
  const depreciationPerHour = (printer.purchaseCost || 3000) / (printer.lifetimeHours || 3500);
  const maintenancePerHour = printer.maintenancePerHour || 1.0;
  const machinePerHour = depreciationPerHour + maintenancePerHour;
  const depreciationCost = totalPrintHours * machinePerHour;

  // 5. Mão de obra (fatiamento, setup, remoção de suportes, pós-processamento)
  const operatorHours = Math.max(0, (piece.operatorMinutes || 0) / 60);
  const operatorHourlyRate = settings.operatorHourlyRate || 35.0;
  const laborCost = operatorHours * operatorHourlyRate;

  // 6. Insumos adicionais (parafusos, cola, embalagem)
  const additionalCost = Math.max(0, piece.additionalCosts || 0);

  // Custo bruto unitário
  const rawCost = materialCost + energyCost + depreciationCost + laborCost + additionalCost;

  // Custo com margem de risco de falha
  const riskFactor = 1 + Math.max(0, piece.failureRiskPercent || 0) / 100;
  const costWithRisk = rawCost * riskFactor;

  // Preço de venda unitário
  let unitPrice = 0;
  if (piece.customPriceOverride && piece.customPriceOverride > 0) {
    unitPrice = piece.customPriceOverride;
  } else {
    const marginFactor = 1 + Math.max(0, piece.profitMarginPercent || 0) / 100;
    unitPrice = costWithRisk * marginFactor;
  }

  // Quantidade
  const quantity = Math.max(1, piece.quantity || 1);
  const totalPrice = unitPrice * quantity;

  // Lucro
  const unitProfit = unitPrice - costWithRisk;
  const totalProfit = unitProfit * quantity;
  const profitPercentage = costWithRisk > 0 ? ((unitPrice - costWithRisk) / costWithRisk) * 100 : 0;

  return {
    weightKg,
    piecesPerKg,
    powerKw,
    kwhConsumed,
    hourlyEnergyCost,
    materialCost,
    energyCost,
    depreciationCost,
    laborCost,
    additionalCost,
    rawCost,
    costWithRisk,
    unitPrice,
    totalPrice,
    unitProfit,
    totalProfit,
    profitPercentage,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
