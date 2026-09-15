import { useRef, useState } from 'react';
import { Download, Printer, Share2, Copy, Check, ArrowLeft, ShieldCheck, QrCode, Phone, Mail, MapPin, Calendar, Clock, Sparkles, AlertCircle, Building2, CreditCard } from 'lucide-react';
import { Quote, WorkshopSettings } from '../types';
import { calculatePieceCost, formatCurrency } from '../utils/costCalculator';
import { exportProposalToPdf } from '../utils/pdfExport';

interface ClientProposalViewProps {
  quote: Quote;
  settings: WorkshopSettings;
  onBackToEdit: () => void;
  onOpenWhatsApp: () => void;
  onOpenCompanySettings?: () => void;
  onOpenCloseSale?: () => void;
}

export function ClientProposalView({
  quote,
  settings,
  onBackToEdit,
  onOpenWhatsApp,
  onOpenCompanySettings,
  onOpenCloseSale,
}: ClientProposalViewProps) {
  const proposalRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  // Totals calculations
  let subtotal = 0;
  quote.items.forEach((item) => {
    const calc = calculatePieceCost(item, settings.materials, settings.printers, settings);
    subtotal += calc.totalPrice;
  });

  const discountAmount =
    quote.discountType === 'percentage'
      ? subtotal * (Math.max(0, quote.discountValue || 0) / 100)
      : Math.max(0, quote.discountValue || 0);

  const shipping = Math.max(0, quote.shippingCost || 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);

  // Validity calculation
  const issueDateObj = new Date(quote.issueDate + 'T12:00:00');
  const validUntilObj = new Date(issueDateObj);
  validUntilObj.setDate(validUntilObj.getDate() + (quote.validityDays || 15));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleExportPdf = async () => {
    if (!proposalRef.current) return;
    setIsExporting(true);
    setExportProgress('Iniciando geração do PDF...');

    try {
      const cleanClient = (quote.client.companyName || quote.client.name || 'Cliente')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 25);
      const filename = `Proposta_ConexLab3D_${cleanClient}.pdf`;

      await exportProposalToPdf(proposalRef.current, filename, (status) => {
        setExportProgress(status);
      });
    } catch (err) {
      console.error(err);
      alert('Houve um problema ao exportar o PDF. Tente usar o botão Imprimir como alternativa.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copyPix = () => {
    if (settings.company.pixKey) {
      navigator.clipboard.writeText(settings.company.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Security Notification Bar */}
      <div className="no-print rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight font-display">
              Formato de Envio ao Cliente — ConexLab 3D
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Proposta limpa para o cliente <strong>{quote.client.name || 'Cliente'}</strong> com custos internos protegidos e dados da empresa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {onOpenCompanySettings && (
            <button
              type="button"
              onClick={onOpenCompanySettings}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 px-3.5 py-2 text-xs font-semibold text-white border border-indigo-700 transition"
              title="Alterar CNPJ/CPF, Nome da Empresa, Email e Formas de Pagamento"
            >
              <Building2 className="h-3.5 w-3.5 text-indigo-300" />
              <span>Dados da Empresa</span>
            </button>
          )}

          {onOpenCloseSale && (
            <button
              type="button"
              onClick={onOpenCloseSale}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Fechar Venda</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBackToEdit}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white border border-slate-700 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Editar Peças</span>
          </button>

          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white border border-slate-700 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? (exportProgress || 'Gerando PDF...') : 'Exportar PDF'}</span>
          </button>
        </div>
      </div>

      {/* PDF / Proposal Canvas (Border-less A4 Design) */}
      <div className="flex justify-center overflow-x-auto pb-10">
        <div
          ref={proposalRef}
          id="client-proposal-document"
          className="pdf-a4-page w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl relative flex flex-col justify-between overflow-hidden"
          style={{ width: '210mm' }}
        >
          {/* Top Edge-to-Edge Borderless Header (Full Bleed Accent) */}
          <div className="w-full bg-slate-950 text-white relative">
            {/* Top Indigo/Purple Accent Strip */}
            <div className="h-2 w-full bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-500" />

            <div className="p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-start gap-6">
              {/* Company Info */}
              <div className="space-y-2 max-w-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-700 to-purple-600 text-white font-bold text-lg shadow-md">
                    3D
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white font-display">
                      {settings.company.name || 'ConexLab 3D'}
                    </h1>
                    <p className="text-xs text-indigo-300 font-medium">
                      {settings.company.slogan || 'Manufatura Aditiva & Engenharia 3D'}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 space-y-0.5 pt-1">
                  {settings.company.document && <p>CNPJ / CPF: {settings.company.document}</p>}
                  {settings.company.address && <p>{settings.company.address}</p>}
                  <div className="flex flex-wrap gap-x-3 text-slate-300">
                    {settings.company.phone && <span>Tel/Whats: {settings.company.phone}</span>}
                    {settings.company.email && <span>Email: {settings.company.email}</span>}
                  </div>
                </div>
              </div>

              {/* Proposal Header: Customer Name and Validity (No Quote Number) */}
              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 text-right min-w-[200mm_auto] sm:min-w-[200px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                  Proposta Comercial
                </span>
                <span className="text-base font-extrabold text-white font-display block truncate max-w-[220px]">
                  {quote.client.name || 'Cliente'}
                </span>

                <div className="text-[11px] text-slate-300 mt-2 space-y-0.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Emissão:</span>
                    <span className="font-semibold text-white">{formatDate(issueDateObj)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Válido até:</span>
                    <span className="font-semibold text-emerald-400">{formatDate(validUntilObj)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-8 sm:p-10 flex-1 space-y-6">
            {/* Client Information Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200/80 pb-1">
                Destinatário / Dados do Cliente
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Cliente / Responsável</span>
                  <span className="font-bold text-slate-900 text-sm">{quote.client.name}</span>
                  {quote.client.companyName && (
                    <span className="text-slate-600 block text-xs font-medium">{quote.client.companyName}</span>
                  )}
                  {quote.client.document && (
                    <span className="text-slate-500 block text-[11px]">Doc: {quote.client.document}</span>
                  )}
                </div>

                <div className="sm:text-right space-y-0.5">
                  {quote.client.phone && (
                    <p className="text-slate-700">
                      <strong className="text-slate-500">Contato:</strong> {quote.client.phone}
                    </p>
                  )}
                  {quote.client.email && (
                    <p className="text-slate-700">
                      <strong className="text-slate-500">Email:</strong> {quote.client.email}
                    </p>
                  )}
                  {quote.client.address && (
                    <p className="text-slate-700">
                      <strong className="text-slate-500">Endereço:</strong> {quote.client.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pieces Table (Clean, Professional, Zero Internal Costs) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">
                    Itens do Pedido / Serviços de Manufatura 3D
                  </h3>
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                    Proposta Comercial
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Total de {quote.items.reduce((acc, i) => acc + i.quantity, 0)} peça(s)
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Item & Descrição Comercial</th>
                      <th className="py-3 px-4 text-center w-20">Qtd</th>
                      <th className="py-3 px-4 text-right w-32">Valor Unit.</th>
                      <th className="py-3 px-4 text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {quote.items.map((item, index) => {
                      const calc = calculatePieceCost(item, settings.materials, settings.printers, settings);

                      return (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-3.5 px-4 text-center text-slate-400 font-semibold align-top">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3.5 px-4 align-top space-y-1.5">
                            <div className="font-bold text-slate-900 text-sm font-display tracking-tight">
                              {item.name}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                                {item.description}
                              </p>
                            )}

                            {/* Clean Commercial Badge (No technical layer height, infill, or finish) */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50/90 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-100/80">
                                Manufatura Aditiva 3D
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-900 align-top text-sm">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">
                              {item.quantity}x
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-700 align-top text-sm">
                            {formatCurrency(calc.unitPrice)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 align-top text-sm">
                            {formatCurrency(calc.totalPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Totals */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
              <div className="flex-1 space-y-3">
                {/* Delivery and Production Info */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span>Prazo de Produção & Entrega</span>
                  </div>
                  <p className="text-slate-700 font-medium">
                    {quote.leadTime || '3 a 5 dias úteis após aprovação formal.'}
                  </p>
                  {quote.shippingMethod && (
                    <p className="text-[11px] text-slate-500">
                      Envio por: {quote.shippingMethod}
                    </p>
                  )}
                </div>

                {/* Payment Condition & Methods Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                      <span>Formas de Pagamento Aceitas</span>
                    </div>
                    <p className="text-slate-700 mt-0.5">
                      {settings.company.paymentMethods || 'PIX (Instantâneo), Cartão de Crédito em até 12x, Débito e Boleto Bancário'}
                    </p>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/70">
                    <span className="font-bold text-slate-900 block">Condições Comerciais:</span>
                    <p className="text-slate-700 mt-0.5">
                      {quote.paymentTerms || settings.company.paymentConditions || '50% de entrada no pedido e 50% na conclusão / entrega.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Totals Table */}
              <div className="w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal das peças:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Desconto concedido {quote.discountType === 'percentage' ? `(${quote.discountValue}%)` : ''}:
                    </span>
                    <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {shipping > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa de Envio / Frete:</span>
                    <span className="font-semibold text-slate-900">+{formatCurrency(shipping)}</span>
                  </div>
                )}

                <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">TOTAL DA PROPOSTA:</span>
                  <span className="text-xl font-extrabold text-indigo-700 font-display">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* PIX Payment Section */}
            {settings.company.pixKey && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      Pagamento Instantâneo via PIX
                    </span>
                    <div className="font-mono font-semibold text-slate-900 text-sm">
                      {settings.company.pixKey}
                    </div>
                    <span className="text-[11px] text-emerald-700">
                      Tipo: {settings.company.pixKeyType || 'Chave'} | Titular: {settings.company.name || 'ConexLab 3D'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyPix}
                  className="no-print flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-semibold text-xs shadow-xs transition"
                >
                  {copiedPix ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Chave PIX'}</span>
                </button>
              </div>
            )}

            {/* Technical Notes & Warranty */}
            <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-600 space-y-2">
              {quote.notes && (
                <p>
                  <strong className="text-slate-800">Observações Técnicas:</strong> {quote.notes}
                </p>
              )}
              {quote.termsAndWarranty && (
                <p>
                  <strong className="text-slate-800">Garantia & Termos:</strong> {quote.termsAndWarranty}
                </p>
              )}
            </div>

            {/* Approval / Signature Area */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div>
                <div className="border-b border-slate-400 mx-auto w-4/5 h-8 mb-1.5" />
                <span className="font-semibold text-slate-800 block">{settings.company.name || 'ConexLab 3D'}</span>
                <span className="text-[10px] text-slate-400">Responsável Técnico</span>
              </div>
              <div>
                <div className="border-b border-slate-400 mx-auto w-4/5 h-8 mb-1.5" />
                <span className="font-semibold text-slate-800 block">{quote.client.name || 'Cliente'}</span>
                <span className="text-[10px] text-slate-400">De acordo / Aceite da Proposta</span>
              </div>
            </div>
          </div>

          {/* Bottom Edge-to-Edge Borderless Footer without quote number */}
          <div className="w-full bg-slate-900 text-white px-8 py-3 text-[10px] flex justify-between items-center border-t border-slate-800">
            <span className="text-slate-400">
              {settings.company.name || 'ConexLab 3D'} • {settings.company.email || settings.company.phone || 'Atendimento'}
            </span>
            <span className="text-slate-400">
              Cliente: {quote.client.name || 'Cliente'} • ConexLab 3D
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
