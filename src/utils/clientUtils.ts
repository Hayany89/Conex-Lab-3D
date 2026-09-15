import { ClientRecord, ClosedSale } from '../types';

export interface ClientCalculatedMetrics {
  ltv: number; // Lifetime value (total faturado em vendas fechadas)
  totalQuotedValue: number; // Total somado de todos os orçamentos emitidos
  totalClosedOrders: number; // Quantidade de pedidos fechados/entregues
  totalQuotes: number; // Quantidade total de orçamentos gerados
  averageTicket: number; // Ticket médio por pedido fechado
  lastActivityDate: string; // Data da última interação/pedido/orçamento
  isVip: boolean; // Flag para destacar clientes de alto valor
}

/**
 * Calculates dynamic client lifetime value and statistics combining
 * recorded history and actual closed sales in the system.
 */
export function getClientMetrics(
  client: ClientRecord,
  closedSales: ClosedSale[] = []
): ClientCalculatedMetrics {
  const normalize = (str?: string) =>
    str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

  const clientNormalizedName = normalize(client.name);
  const clientNormalizedCompany = normalize(client.companyName);
  const clientNormalizedPhone = normalize(client.phone);

  // Match closed sales in system
  const matchingSales = closedSales.filter((sale) => {
    const saleClientName = normalize(sale.clientName);
    const salePhone = normalize(sale.clientPhone);

    if (clientNormalizedPhone && salePhone && clientNormalizedPhone === salePhone) {
      return true;
    }
    if (clientNormalizedName && saleClientName.includes(clientNormalizedName)) {
      return true;
    }
    if (clientNormalizedCompany && saleClientName.includes(clientNormalizedCompany)) {
      return true;
    }
    return false;
  });

  // Calculate LTV from system sales
  let salesTotalFromSystem = 0;
  matchingSales.forEach((sale) => {
    if (sale.status !== 'cancelled') {
      salesTotalFromSystem += sale.finalTotal || 0;
    }
  });

  // Calculate from client's direct history items (avoiding duplicates if quote number is already in matchingSales)
  let historySalesTotal = 0;
  let historySalesCount = 0;
  let totalQuotesCount = client.history.length;
  let totalQuotedSum = 0;

  const matchedQuoteNumbers = new Set(matchingSales.map((s) => s.quoteNumber));

  client.history.forEach((hist) => {
    totalQuotedSum += hist.totalValue || 0;
    if (
      (hist.status === 'closed' || hist.status === 'delivered') &&
      !matchedQuoteNumbers.has(hist.quoteNumber)
    ) {
      historySalesTotal += hist.totalValue || 0;
      historySalesCount += 1;
    }
  });

  const ltv = salesTotalFromSystem + historySalesTotal;
  const totalClosedOrders = matchingSales.length + historySalesCount;
  const averageTicket = totalClosedOrders > 0 ? ltv / totalClosedOrders : 0;

  // Find latest date among history and sales
  let latestDate = client.createdAt || '';
  matchingSales.forEach((s) => {
    if (!latestDate || s.closedDate > latestDate) {
      latestDate = s.closedDate;
    }
  });
  client.history.forEach((h) => {
    if (!latestDate || h.date > latestDate) {
      latestDate = h.date;
    }
  });

  const totalQuotes = Math.max(totalQuotesCount, totalClosedOrders);
  const isVip = ltv >= 800 || totalClosedOrders >= 3 || client.tags.includes('VIP');

  return {
    ltv,
    totalQuotedValue: Math.max(totalQuotedSum, ltv),
    totalClosedOrders,
    totalQuotes,
    averageTicket,
    lastActivityDate: latestDate,
    isVip,
  };
}

/**
 * Normalizes phone numbers to generate WhatsApp direct links
 */
export function getWhatsAppDirectUrl(phone: string, text?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Add Brazil country code 55 if not present and length is 10 or 11
  const fullPhone = digits.length <= 11 ? `55${digits}` : digits;
  const encodedText = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${fullPhone}${encodedText}`;
}

/**
 * Format CSV export for mailing and CRM
 */
export function exportClientsToCSV(clients: ClientRecord[], closedSales: ClosedSale[] = []) {
  if (clients.length === 0) {
    alert('Nenhum cliente cadastrado para exportar.');
    return;
  }

  const headers = [
    'Nome Completo',
    'Empresa / Razão Social',
    'Telefone / WhatsApp',
    'E-mail',
    'CPF / CNPJ',
    'Endereço',
    'LTV - Total Faturado (R$)',
    'Total de Pedidos Fechados',
    'Total de Orçamentos',
    'Ticket Médio (R$)',
    'Tags / Segmento',
    'Data de Cadastro',
    'Última Atividade',
    'Observações do Cliente',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = clients.map((client) => {
    const metrics = getClientMetrics(client, closedSales);
    return [
      escapeCsv(client.name),
      escapeCsv(client.companyName || '-'),
      escapeCsv(client.phone || '-'),
      escapeCsv(client.email || '-'),
      escapeCsv(client.document || '-'),
      escapeCsv(client.address || '-'),
      escapeCsv(metrics.ltv.toFixed(2)),
      escapeCsv(metrics.totalClosedOrders),
      escapeCsv(metrics.totalQuotes),
      escapeCsv(metrics.averageTicket.toFixed(2)),
      escapeCsv(client.tags.join(', ')),
      escapeCsv(client.createdAt || '-'),
      escapeCsv(metrics.lastActivityDate || '-'),
      escapeCsv(client.notes || '-'),
    ].join(';');
  });

  // UTF-8 BOM for Excel
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  link.href = url;
  link.setAttribute('download', `carteira_clientes_conexlab_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
