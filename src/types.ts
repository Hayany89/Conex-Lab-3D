export interface MaterialConfig {
  id: string;
  name: string;
  type: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'Nylon' | 'Resina' | 'Outro';
  brand?: string;
  spoolPrice: number; // R$
  spoolWeightGrams: number; // usually 1000g
  color?: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  powerWatts: number; // Watts, e.g. 200W
  purchaseCost: number; // R$
  lifetimeHours: number; // e.g. 3000h
  maintenancePerHour: number; // R$ per hour
}

export interface PieceItem {
  id: string;
  name: string;
  description: string;
  // Specifications for client
  technology: 'FDM (Filamento)' | 'MSLA / SLA (Resina)';
  materialName: string;
  materialType?: string; // tipo de filamento (PLA, PETG, ABS, TPU, ASA, Nylon, Resina, etc.)
  materialColor: string;
  layerHeight: string; // e.g. '0.20mm (Padrão)', '0.12mm (Alta Definição)'
  infill: string; // e.g. '20% Gyroid', '50% Tri-Hex'
  finish: string; // e.g. 'Natural (Sem pós-processo)', 'Lixado', 'Pintado'
  
  // Production variables (internal maker calculation)
  printerId: string;
  printerName?: string;
  customPrinterWatts?: number | null; // Potência em Watts editável para a máquina
  materialId: string;
  customMaterialPrice?: number | null; // Preço do carretel/kg editável diretamente (R$/kg)
  customEnergyCostPerHour?: number | null; // Custo de energia por hora customizado (R$/h, padrão 0.09)
  weightGrams: number; // gramas de filamento ou resina
  printTimeHours: number;
  printTimeMinutes: number;
  operatorMinutes: number; // fatiamento, preparação, pós-cura, acabamento
  additionalCosts: number; // insertos roscados, embalagem especial, etc.
  failureRiskPercent: number; // margem de segurança de falha (ex: 10%)
  profitMarginPercent: number; // margem de lucro sobre o custo total (ex: 60%)
  customPriceOverride?: number | null; // se quiser forçar um valor unitário específico
  quantity: number;
}

export interface CompanySettings {
  name: string;
  slogan: string;
  document: string; // CNPJ ou CPF
  phone: string;
  email: string;
  address: string;
  instagram: string;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatória';
  paymentMethods?: string; // Formas de pagamento aceitas (PIX, Cartão, Boleto, etc.)
  paymentConditions?: string; // Condições padrão de pagamento
  logoUrl?: string;
}

export interface ClientInfo {
  clientId?: string;
  name: string;
  companyName?: string;
  document?: string; // CPF ou CNPJ
  phone: string;
  email?: string;
  address?: string;
}

export interface ClientQuoteHistoryItem {
  id: string; // quote id or sale id
  quoteNumber: string;
  date: string; // YYYY-MM-DD
  itemCount: number;
  totalPieces: number;
  totalValue: number;
  status: 'quoted' | 'approved' | 'closed' | 'delivered';
  summary?: string; // e.g. "Gabinete IoT (2x), Engrenagem Z18 (4x)"
  quoteSnapshot?: Partial<Quote>;
}

export interface ClientRecord {
  id: string;
  name: string;
  companyName?: string;
  document?: string; // CPF ou CNPJ
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  tags: string[]; // e.g. ["Industrial", "B2B", "Recorrente", "VIP"]
  createdAt: string; // YYYY-MM-DD
  history: ClientQuoteHistoryItem[];
  customDiscountPercent?: number; // optional preferred discount for VIP/partner clients
}

export interface Quote {
  id: string;
  quoteNumber: string;
  issueDate: string; // YYYY-MM-DD
  validityDays: number; // e.g. 15
  client: ClientInfo;
  items: PieceItem[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  shippingCost: number;
  shippingMethod?: string;
  leadTime: string; // e.g. "3 a 5 dias úteis após aprovação"
  paymentTerms: string; // e.g. "50% de sinal para início da produção e 50% na conclusão"
  notes: string;
  termsAndWarranty: string;
}

export interface WorkshopSettings {
  energyCostPerHour: number; // Custo médio de energia por hora de impressão (padrão: 0.09 R$/h)
  kwhCost: number; // R$/kWh de referência (ex: 0.90)
  operatorHourlyRate: number; // R$/h (e.g. 35.00)
  materials: MaterialConfig[];
  printers: PrinterConfig[];
  company: CompanySettings;
}

export interface CalculatedPieceCost {
  weightKg: number;
  piecesPerKg: number;
  powerKw: number;
  kwhConsumed: number;
  hourlyEnergyCost: number;
  materialCost: number;
  energyCost: number;
  depreciationCost: number;
  laborCost: number;
  additionalCost: number;
  rawCost: number;
  costWithRisk: number;
  unitPrice: number;
  totalPrice: number;
  unitProfit: number;
  totalProfit: number;
  profitPercentage: number;
}

export interface FilamentSpool {
  id: string;
  name: string;
  brand: string;
  materialType: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'Nylon' | 'Resina' | 'Outro';
  colorName: string;
  colorHex: string;
  diameterMm: number; // usually 1.75
  initialWeightGrams: number; // e.g. 1000
  currentWeightGrams: number; // e.g. 780
  emptySpoolWeightGrams: number; // peso do carretel vazio (tara ex: 200g)
  purchasePrice: number; // R$
  purchaseDate?: string;
  location?: string; // ex: "AMS Slot 1", "Dry Box A", "Prateleira"
  status: 'sealed' | 'in_use' | 'empty';
  minStockAlertGrams: number; // ex: 150g
  batchNumber?: string;
  notes?: string;
}

export interface ClosedSaleItem {
  name: string;
  quantity: number;
  technology: string;
  materialName: string;
  materialType?: string;
  weightGrams: number;
  unitPrice: number;
  totalPrice: number;
  rawCost: number;
  netProfit: number;
}

export interface ClosedSale {
  id: string;
  quoteNumber: string;
  closedDate: string; // YYYY-MM-DD
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientDocument?: string;
  items: ClosedSaleItem[];
  totalPieces: number;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  finalTotal: number;
  productionCost: number;
  netProfit: number;
  profitMarginPercent: number;
  paymentMethod: string; // "PIX", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Dinheiro"
  status: 'producing' | 'ready' | 'delivered' | 'cancelled';
  notes?: string;
  filamentDeducted?: boolean;
}
