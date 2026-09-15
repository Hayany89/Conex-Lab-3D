import { useState } from 'react';
import { X, Copy, Check, ExternalLink, MessageSquare } from 'lucide-react';
import { Quote, WorkshopSettings } from '../types';
import { calculatePieceCost, formatCurrency } from '../utils/costCalculator';

interface WhatsAppShareModalProps {
  quote: Quote;
  settings: WorkshopSettings;
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppShareModal({
  quote,
  settings,
  isOpen,
  onClose,
}: WhatsAppShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let subtotal = 0;
  const itemsText = quote.items
    .map((item, idx) => {
      const calc = calculatePieceCost(item, settings.materials, settings.printers, settings);
      subtotal += calc.totalPrice;
      const descLine = item.description ? `\n   • Detalhes: ${item.description}` : '';
      return `🔹 *${idx + 1}. ${item.name}*
   • Quantidade: ${item.quantity}x
   • Processo: Manufatura Aditiva 3D (${item.technology})${descLine}
   • Valor unitário: ${formatCurrency(calc.unitPrice)}
   • Subtotal: *${formatCurrency(calc.totalPrice)}*`;
    })
    .join('\n\n');

  const discountAmount =
    quote.discountType === 'percentage'
      ? subtotal * (Math.max(0, quote.discountValue || 0) / 100)
      : Math.max(0, quote.discountValue || 0);

  const shipping = Math.max(0, quote.shippingCost || 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);

  const companyName = settings.company.name || 'ConexLab 3D';
  const paymentMethods = settings.company.paymentMethods || 'PIX, Cartão de Crédito (até 12x), Débito e Boleto';

  const message = `Olá *${quote.client.name || 'Cliente'}*! Segue a proposta comercial da *${companyName}* para sua impressão 3D:

🗓️ Data de Emissão: ${new Date(quote.issueDate).toLocaleDateString('pt-BR')} (Válido por ${quote.validityDays} dias)

📦 *PEÇAS / ESPECIFICAÇÕES:*
${itemsText}

━━━━━━━━━━━━━━━━━━━
💰 *Subtotal das peças:* ${formatCurrency(subtotal)}
${discountAmount > 0 ? `🏷️ *Desconto:* -${formatCurrency(discountAmount)}\n` : ''}${shipping > 0 ? `🚚 *Frete / Envio:* +${formatCurrency(shipping)}\n` : ''}💎 *VALOR TOTAL: ${formatCurrency(grandTotal)}*
━━━━━━━━━━━━━━━━━━━

⏳ *Prazo de produção:* ${quote.leadTime || '3 a 5 dias úteis'}
💳 *Formas de pagamento:* ${paymentMethods}
📝 *Condição comercial:* ${quote.paymentTerms || settings.company.paymentConditions || '50% entrada e 50% na entrega'}
${
  settings.company.pixKey
    ? `🔑 *Chave PIX:* \`${settings.company.pixKey}\` (${settings.company.pixKeyType || 'Chave'} - ${companyName})\n`
    : ''
}
Qualquer dúvida ou ajuste nos modelos 3D, fico à disposição! Podemos confirmar para iniciar a impressão? 🚀`;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const cleanPhone = (quote.client.phone || '').replace(/\D/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone.length <= 11 ? cleanPhone : cleanPhone.replace(/^55/, '')}?text=${encodeURIComponent(
        message
      )}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display">Enviar Orçamento no WhatsApp</h3>
              <p className="text-xs text-emerald-100">
                Texto pronto para o cliente com resumo completo e chave PIX
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-100 hover:bg-emerald-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <textarea
              readOnly
              rows={14}
              value={message}
              className="w-full bg-transparent font-mono text-xs text-slate-800 outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Mensagem Copiada!' : 'Copiar Texto'}</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Abrir no WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
