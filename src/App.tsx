import { useState, useEffect } from 'react';
import { Quote, WorkshopSettings, PieceItem, FilamentSpool, ClosedSale, ClientRecord } from './types';
import { defaultQuote, defaultWorkshopSettings, defaultFilamentSpools, defaultClosedSales, defaultClients } from './utils/defaultData';
import { calculatePieceCost, formatCurrency } from './utils/costCalculator';
import { Navbar, AppTab } from './components/Navbar';
import { QuoteEditor } from './components/QuoteEditor';
import { ClientProposalView } from './components/ClientProposalView';
import { PieceEditorModal } from './components/PieceEditorModal';
import { WorkshopSettingsModal } from './components/WorkshopSettingsModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { ClosedSalesReportView } from './components/ClosedSalesReportView';
import { FilamentStockView } from './components/FilamentStockView';
import { CloseSaleModal } from './components/CloseSaleModal';
import { ClientsView } from './components/ClientsView';

export default function App() {
  // Load settings with localStorage fallback
  const [settings, setSettings] = useState<WorkshopSettings>(() => {
    try {
      const saved = localStorage.getItem('orca3d_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Atualizar valor padrão de energia para R$ 0,89/kWh e potência média 0,095 kW (95W)
        if (!parsed.kwhCost || parsed.kwhCost === 0.90 || parsed.kwhCost === 0.85) {
          parsed.kwhCost = 0.89;
        }
        parsed.energyCostPerHour = 0.08455; // 0,095 kW * R$ 0,89/kWh

        // Garantir que os dados da empresa estejam com ConexLab 3D e formas de pagamento
        if (!parsed.company || !parsed.company.name || parsed.company.name.includes('ProtoLab')) {
          parsed.company = {
            ...defaultWorkshopSettings.company,
            ...(parsed.company || {}),
            name: 'ConexLab 3D',
          };
        }
        if (!parsed.company.paymentMethods) {
          parsed.company.paymentMethods = 'PIX (Instantâneo), Cartão de Crédito (até 12x), Débito e Boleto Bancário';
        }
        if (!parsed.company.paymentConditions) {
          parsed.company.paymentConditions = '50% de sinal para início da produção e 50% na conclusão / entrega';
        }

        // Garantir que a Bambu Lab A1 Combo esteja presente na lista de impressoras e com 95W
        const hasA1 = parsed.printers?.some((p: any) => p.name?.toLowerCase().includes('a1'));
        if (!hasA1) {
          const a1Printer = {
            id: 'print-a1-combo',
            name: 'Bambu Lab A1 Combo',
            powerWatts: 95,
            purchaseCost: 4400,
            lifetimeHours: 4000,
            maintenancePerHour: 0.8,
          };
          parsed.printers = [a1Printer, ...(parsed.printers || [])];
        } else if (parsed.printers) {
          parsed.printers = parsed.printers.map((p: any) =>
            p.name?.toLowerCase().includes('a1') && p.powerWatts === 150 ? { ...p, powerWatts: 95 } : p
          );
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultWorkshopSettings;
  });

  // Load quote with localStorage fallback
  const [quote, setQuote] = useState<Quote>(() => {
    try {
      const saved = localStorage.getItem('orca3d_active_quote');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items) {
          parsed.items = parsed.items.map((item: any) => ({
            ...item,
            customPrinterWatts: item.customPrinterWatts === 150 ? 95 : item.customPrinterWatts,
          }));
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultQuote;
  });

  // Spools inventory state with localStorage fallback
  const [spools, setSpools] = useState<FilamentSpool[]>(() => {
    try {
      const saved = localStorage.getItem('conexlab_spools');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return defaultFilamentSpools;
  });

  // Closed Sales report state with localStorage fallback
  const [closedSales, setClosedSales] = useState<ClosedSale[]>(() => {
    try {
      const saved = localStorage.getItem('conexlab_closed_sales');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return defaultClosedSales;
  });

  // Clients Portfolio state with localStorage fallback
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    try {
      const saved = localStorage.getItem('conexlab_clients');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return defaultClients;
  });

  const [activeTab, setActiveTab] = useState<AppTab>('editor');
  const [isPieceModalOpen, setIsPieceModalOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState<PieceItem | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<'materials' | 'printers' | 'rates' | 'company'>('company');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isCloseSaleModalOpen, setIsCloseSaleModalOpen] = useState(false);

  const handleOpenCompanySettings = () => {
    setSettingsModalTab('company');
    setIsSettingsModalOpen(true);
  };

  const handleOpenWorkshopSettings = () => {
    setSettingsModalTab('materials');
    setIsSettingsModalOpen(true);
  };

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orca3d_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('orca3d_active_quote', JSON.stringify(quote));
    } catch (e) {
      console.error(e);
    }
  }, [quote]);

  useEffect(() => {
    try {
      localStorage.setItem('conexlab_spools', JSON.stringify(spools));
    } catch (e) {
      console.error(e);
    }
  }, [spools]);

  useEffect(() => {
    try {
      localStorage.setItem('conexlab_closed_sales', JSON.stringify(closedSales));
    } catch (e) {
      console.error(e);
    }
  }, [closedSales]);

  useEffect(() => {
    try {
      localStorage.setItem('conexlab_clients', JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  }, [clients]);

  // Open Piece Editor
  const handleOpenPieceModal = (piece?: PieceItem | null) => {
    setEditingPiece(piece || null);
    setIsPieceModalOpen(true);
  };

  // Save Piece from Modal
  const handleSavePiece = (piece: PieceItem) => {
    setQuote((prev) => {
      const exists = prev.items.some((i) => i.id === piece.id);
      let updatedItems: PieceItem[];
      if (exists) {
        updatedItems = prev.items.map((i) => (i.id === piece.id ? piece : i));
      } else {
        updatedItems = [...prev.items, piece];
      }
      return { ...prev, items: updatedItems };
    });
    setIsPieceModalOpen(false);
    setEditingPiece(null);
  };

  const handleConfirmSale = (newSale: ClosedSale, updatedSpools: FilamentSpool[]) => {
    setClosedSales((prev) => [newSale, ...prev]);
    setSpools(updatedSpools);

    // Synchronize client history and Lifetime Value (LTV)
    setClients((prevClients) => {
      const clientName = newSale.clientName.trim().toLowerCase();
      const clientPhone = newSale.clientPhone?.replace(/\D/g, '');
      const existingClient = prevClients.find(
        (c) =>
          (quote.client.clientId && c.id === quote.client.clientId) ||
          c.name.trim().toLowerCase() === clientName ||
          (c.companyName && c.companyName.trim().toLowerCase() === clientName) ||
          (clientPhone && c.phone && c.phone.replace(/\D/g, '') === clientPhone)
      );

      const totalPieces = newSale.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
      const itemsSummary = newSale.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ');

      const historyItem = {
        id: `hist-${Date.now()}`,
        quoteNumber: newSale.quoteNumber,
        date: newSale.closedDate || new Date().toISOString().split('T')[0],
        itemCount: newSale.items.length,
        totalPieces: totalPieces,
        totalValue: newSale.finalTotal,
        status: 'closed' as const,
        summary: itemsSummary,
      };

      if (existingClient) {
        return prevClients.map((c) => {
          if (c.id === existingClient.id) {
            return {
              ...c,
              history: [historyItem, ...(c.history || []).filter((h) => h.quoteNumber !== newSale.quoteNumber)],
            };
          }
          return c;
        });
      } else {
        // Automatically create client record for future retention and LTV tracking
        const newClient: ClientRecord = {
          id: `cli-${Date.now()}`,
          name: newSale.clientName,
          companyName: quote.client.companyName || '',
          phone: newSale.clientPhone || '',
          email: quote.client.email || '',
          document: quote.client.document || '',
          address: quote.client.address || '',
          notes: 'Cliente cadastrado automaticamente após fechamento de venda.',
          tags: ['Recorrente'],
          createdAt: newSale.closedDate || new Date().toISOString().split('T')[0],
          history: [historyItem],
        };
        return [newClient, ...prevClients];
      }
    });

    setIsCloseSaleModalOpen(false);
    setActiveTab('sales');
  };

  // Select returning client directly into active quote
  const handleSelectClientForQuote = (selectedClient: ClientRecord) => {
    let newDiscountValue = quote.discountValue;
    let newDiscountType = quote.discountType;
    if (
      selectedClient.customDiscountPercent &&
      selectedClient.customDiscountPercent > 0 &&
      (!quote.discountValue || quote.discountValue === 0)
    ) {
      newDiscountValue = selectedClient.customDiscountPercent;
      newDiscountType = 'percentage';
    }

    setQuote((prev) => ({
      ...prev,
      client: {
        clientId: selectedClient.id,
        name: selectedClient.name,
        companyName: selectedClient.companyName || '',
        document: selectedClient.document || '',
        phone: selectedClient.phone || '',
        email: selectedClient.email || '',
        address: selectedClient.address || '',
      },
      discountValue: newDiscountValue,
      discountType: newDiscountType,
    }));
    setActiveTab('editor');
  };

  // Save new client to portfolio from QuoteEditor
  const handleSaveClientToPortfolio = (newOrUpdatedClient: ClientRecord) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === newOrUpdatedClient.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newOrUpdatedClient;
        return copy;
      }
      return [newOrUpdatedClient, ...prev];
    });
  };

  const handleResetDemo = () => {
    if (confirm('Deseja restaurar os dados de exemplo padrão (orçamento, estoque, clientes e vendas)?')) {
      setQuote(defaultQuote);
      setSettings(defaultWorkshopSettings);
      setSpools(defaultFilamentSpools);
      setClosedSales(defaultClosedSales);
      setClients(defaultClients);
    }
  };

  const handleNewQuote = () => {
    const nextNumber = `ORC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newEmptyQuote: Quote = {
      ...defaultQuote,
      id: `quote-${Date.now()}`,
      quoteNumber: nextNumber,
      issueDate: new Date().toISOString().split('T')[0],
      client: {
        name: 'Novo Cliente',
        phone: '',
      },
      items: [
        {
          id: `piece-${Date.now()}`,
          name: 'Nova Peça 3D',
          description: 'Modelo tridimensional personalizado em manufatura aditiva.',
          technology: 'FDM (Filamento)',
          materialId: settings.materials[0]?.id || 'mat-1',
          materialName: settings.materials[0]?.name || 'PLA Premium',
          materialColor: settings.materials[0]?.color || '#1e293b',
          layerHeight: '0.20mm',
          infill: '20% Giroide',
          finish: 'Natural sem suportes',
          printerId: settings.printers[0]?.id || 'print-1',
          weightGrams: 40,
          printTimeHours: 2,
          printTimeMinutes: 30,
          operatorMinutes: 15,
          additionalCosts: 0,
          failureRiskPercent: 10,
          profitMarginPercent: 60,
          quantity: 1,
        },
      ],
      discountValue: 0,
      shippingCost: 0,
    };
    setQuote(newEmptyQuote);
    setActiveTab('editor');
  };

  const totalPiecesCount = quote.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
  let aggregateTotal = 0;
  quote.items.forEach((item) => {
    const calc = calculatePieceCost(item, settings.materials, settings.printers, settings);
    aggregateTotal += calc.totalPrice;
  });
  const discountAmount =
    quote.discountType === 'percentage'
      ? aggregateTotal * (Math.max(0, quote.discountValue || 0) / 100)
      : Math.max(0, quote.discountValue || 0);
  const finalTotalWithShipping = Math.max(0, aggregateTotal - discountAmount + (quote.shippingCost || 0));

  const criticalSpoolsCount = spools.filter(
    (s) => s.currentWeightGrams <= s.minStockAlertGrams && s.status !== 'empty'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
      <Navbar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCompanySettings={handleOpenCompanySettings}
        onOpenWorkshopSettings={handleOpenWorkshopSettings}
        companyName={settings.company?.name || 'ConexLab 3D'}
        totalPieces={totalPiecesCount}
        grandTotal={finalTotalWithShipping}
        clientName={quote.client.name}
        closedSalesCount={closedSales.length}
        criticalSpoolsCount={criticalSpoolsCount}
        clientsCount={clients.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        {/* Quick Helper Sub-header for active quote view */}
        {(activeTab === 'editor' || activeTab === 'proposal') && (
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-5 border-b border-slate-200/90">
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <span className="text-slate-500">
                  Orçamento Atual: <strong className="text-slate-900 font-bold">{quote.client.name || 'Novo Cliente'}</strong>
                </span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="text-slate-500">
                {totalPiecesCount} {totalPiecesCount === 1 ? 'peça configurada' : 'peças configuradas'}
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="font-bold text-slate-800">
                {formatCurrency(finalTotalWithShipping)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewQuote}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50/60 border border-slate-200 shadow-2xs transition"
              >
                + Novo Orçamento
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/70 transition"
              >
                Restaurar Exemplo
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        {activeTab === 'editor' && (
          <QuoteEditor
            quote={quote}
            settings={settings}
            clients={clients}
            closedSales={closedSales}
            onChangeQuote={setQuote}
            onOpenPieceModal={handleOpenPieceModal}
            onViewProposal={() => setActiveTab('proposal')}
            onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
            onOpenCompanySettings={handleOpenCompanySettings}
            onOpenCloseSale={() => setIsCloseSaleModalOpen(true)}
            onOpenClientsTab={() => setActiveTab('clients')}
            onSaveClientToPortfolio={handleSaveClientToPortfolio}
          />
        )}

        {activeTab === 'proposal' && (
          <ClientProposalView
            quote={quote}
            settings={settings}
            onBackToEdit={() => setActiveTab('editor')}
            onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
            onOpenCompanySettings={handleOpenCompanySettings}
            onOpenCloseSale={() => setIsCloseSaleModalOpen(true)}
          />
        )}

        {activeTab === 'sales' && (
          <ClosedSalesReportView
            sales={closedSales}
            onChangeSales={setClosedSales}
            onOpenNewQuote={handleNewQuote}
          />
        )}

        {activeTab === 'stock' && (
          <FilamentStockView
            spools={spools}
            onChangeSpools={setSpools}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            closedSales={closedSales}
            onChangeClients={setClients}
            onSelectClientForQuote={handleSelectClientForQuote}
          />
        )}
      </main>

      {/* Piece Cost & Specs Modal */}
      {isPieceModalOpen && (
        <PieceEditorModal
          piece={editingPiece}
          materials={settings.materials}
          printers={settings.printers}
          settings={settings}
          isOpen={isPieceModalOpen}
          onClose={() => {
            setIsPieceModalOpen(false);
            setEditingPiece(null);
          }}
          onSave={handleSavePiece}
          onOpenSettings={handleOpenWorkshopSettings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
        />
      )}

      {/* Workshop Settings Modal */}
      {isSettingsModalOpen && (
        <WorkshopSettingsModal
          settings={settings}
          isOpen={isSettingsModalOpen}
          initialTab={settingsModalTab}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={(newSettings) => setSettings(newSettings)}
        />
      )}

      {/* WhatsApp Share Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppShareModal
          quote={quote}
          settings={settings}
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}

      {/* Close Sale Modal (Deducts Stock & Registers in Closed Sales Report) */}
      {isCloseSaleModalOpen && (
        <CloseSaleModal
          quote={quote}
          settings={settings}
          spools={spools}
          isOpen={isCloseSaleModalOpen}
          onClose={() => setIsCloseSaleModalOpen(false)}
          onConfirmSale={handleConfirmSale}
        />
      )}

      {/* Clean Minimalist Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          ConexLab 3D • Orçamentos Comerciais, Vendas Fechadas & Controle de Estoque de Filamentos
        </div>
      </footer>
    </div>
  );
}
