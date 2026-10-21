import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { UploadSection } from './components/UploadSection';
import { TransactionTable } from './components/TransactionTable';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { RulesCatalogModal } from './components/RulesCatalogModal';
import { PlanCuentasModal } from './components/PlanCuentasModal';
import { BankConfig, Transaction, AccountItem } from './types';
import { DEFAULT_PLAN_CUENTAS, classifyTransactionWithRules } from './data/rules';
import { exportTransactionsToExcel } from './services/excelExport';
import { getIssueSummary } from './utils/validation';
import { ShieldCheck, Sparkles, FileSpreadsheet, ArrowRight, Layers } from 'lucide-react';

const STORAGE_KEY_CONFIG = 'asientos_ve_bank_config';
const STORAGE_KEY_PLAN = 'asientos_ve_plan_cuentas';

export default function App() {
  // Configuración de la empresa y cuenta banco
  const [config, setConfig] = useState<BankConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.bankAccountCode === '1.1.1.2.10') {
          parsed.bankAccountCode = '1.1.1.2.60';
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      companyName: 'Tu Punto Verde, C.A.',
      bankAccountCode: '1.1.1.2.60',
      bankAccountName: 'BANCO PLAZA, BANCO UNIVERSAL',
      balancingAccountCode: '1.1.2.1.10',
      balancingAccountName: 'DEUDORES COMERCIALES NACIONALES'
    };
  });

  // Catálogo de Cuentas Contables
  const [planCuentas, setPlanCuentas] = useState<AccountItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PLAN);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_PLAN_CUENTAS;
  });

  // Transacciones
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Estados de interfaz y modales
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isPlanCuentasOpen, setIsPlanCuentasOpen] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isFilteringUnclassified, setIsFilteringUnclassified] = useState<boolean>(false);

  const issueSummary = useMemo(() => getIssueSummary(transactions), [transactions]);

  // Guardar configuración en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(planCuentas));
  }, [planCuentas]);

  // Cálculos de métricas
  const { totalNC, totalND, unclassifiedCount } = useMemo(() => {
    let nc = 0;
    let nd = 0;
    let unclass = 0;

    transactions.forEach(tx => {
      if (tx.tipo === 'NC') nc += tx.amount;
      else nd += tx.amount;

      if (tx.account === 'SIN CLASIFICAR') unclass++;
    });

    return {
      totalNC: nc,
      totalND: nd,
      unclassifiedCount: unclass
    };
  }, [transactions]);

  // Agregar transacciones aplicando el motor de reglas de Banco Plaza
  const handleAddTransactions = (
    rawItems: { date: string; description: string; reference: string; amount: number }[],
    replace: boolean
  ) => {
    let nextId = Date.now();
    const newItems: Transaction[] = rawItems.map(item => {
      const cls = classifyTransactionWithRules(item.description, item.amount, config.bankAccountCode, config.bankAccountName);
      return {
        id: `tx_${nextId++}_${Math.random().toString(36).slice(2, 7)}`,
        date: item.date,
        description: item.description,
        reference: item.reference,
        amount: item.amount,
        account: cls.account,
        accountName: cls.accountName,
        tipo: cls.tipo,
        regla: cls.regla,
        motivo: cls.motivo,
        isManual: false
      };
    });

    if (replace) {
      setTransactions(newItems);
    } else {
      setTransactions(prev => [...prev, ...newItems]);
    }
  };

  const handleUpdateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleBatchUpdateAccount = (ids: string[], accountCode: string) => {
    const found = planCuentas.find(c => c.code === accountCode);
    const accountName = found ? found.name : accountCode;

    setTransactions(prev =>
      prev.map(t =>
        ids.includes(t.id)
          ? {
              ...t,
              account: accountCode,
              accountName,
              motivo: 'Asignación manual en lote',
              isManual: true
            }
          : t
      )
    );

    setStatusMessage({
      text: `Se actualizaron ${ids.length} movimientos a la cuenta "${accountCode} - ${accountName}".`,
      type: 'success'
    });
  };

  const handleBatchDelete = (ids: string[]) => {
    setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
    setStatusMessage({
      text: `Se eliminaron ${ids.length} transacciones correctamente.`,
      type: 'info'
    });
  };

  const handleClearAll = () => {
    setTransactions([]);
    setStatusMessage({ text: 'Se vaciaron todas las transacciones.', type: 'info' });
  };

  const handleAddAccount = (newAcct: AccountItem) => {
    setPlanCuentas(prev => [...prev, newAcct]);
    setStatusMessage({
      text: `Cuenta "${newAcct.code} - ${newAcct.name}" agregada al Plan de Cuentas.`,
      type: 'success'
    });
  };

  const handleDeleteAccount = (code: string) => {
    setPlanCuentas(prev => prev.filter(c => c.code !== code));
    setStatusMessage({
      text: `Cuenta "${code}" eliminada del catálogo.`,
      type: 'info'
    });
  };

  const handleGenerateExcel = () => {
    if (issueSummary.blockingCount > 0) {
      setStatusMessage({
        text: `No se puede exportar aún. Hay ${issueSummary.blockingCount} movimiento(s) con errores críticos que requieren revisión antes de generar Excel.`,
        type: 'warning'
      });
      return;
    }

    try {
      const result = exportTransactionsToExcel(transactions, config);
      setStatusMessage({
        text: `¡Excel generado exitosamente! Archivo "${result.fileName}" descargado con 2 hojas: Créditos y Débitos.`,
        type: 'success'
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        text: `Error al generar Excel: ${errMsg}`,
        type: 'error'
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-slate-700 font-sans">

      {/* Encabezado Superior */}
      <Header
        config={config}
        onConfigChange={setConfig}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenPlanCuentas={() => setIsPlanCuentasOpen(true)}
        totalTransactions={transactions.length}
      />

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Banner Informativo Contable Estilo Sleek */}
        <div className="bg-[#E0F2F1] border border-white rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#4B7C32] flex items-center justify-center shadow-xs flex-shrink-0 border border-emerald-100 mt-0.5 font-bold">
              <ShieldCheck className="w-5 h-5 text-[#4B7C32]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Asientos de Banco Plaza listos para tu Sistema Contable
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
                El sistema clasifica débitos y créditos con las reglas oficiales de Banco Plaza (POS, C2P, Seniat, Socios, Comisiones y Timbres). Al exportar, genera automáticamente las hojas contables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <span className="text-[11px] font-bold px-3.5 py-1.5 rounded-full bg-white text-[#4B7C32] border border-[#CDEAC0] shadow-2xs font-mono">
              VEN-NIF · Partida Doble
            </span>
          </div>
        </div>

        {transactions.length > 0 && issueSummary.total > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold">
              Revisión requerida: {issueSummary.total} problema(s) detectado(s) en {issueSummary.blockingCount} movimiento(s) crítico(s).
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {issueSummary.byKind['empty-description'] > 0 && <span>Descripción vacía: {issueSummary.byKind['empty-description']}</span>}
              {issueSummary.byKind['invalid-date'] > 0 && <span>Fecha inválida: {issueSummary.byKind['invalid-date']}</span>}
              {issueSummary.byKind['zero-amount'] > 0 && <span>Monto inválido: {issueSummary.byKind['zero-amount']}</span>}
              {issueSummary.byKind.unclassified > 0 && <span>Sin clasificar: {issueSummary.byKind.unclassified}</span>}
            </div>
          </div>
        )}

        {/* Sección 1: Carga y Procesamiento */}
        <UploadSection
          onAddTransactions={handleAddTransactions}
          onClearAll={handleClearAll}
          totalLoaded={transactions.length}
          planCuentas={planCuentas}
          config={config}
          statusMessage={statusMessage}
          setStatusMessage={setStatusMessage}
        />

        {/* Sección 2: Métricas Rápidas (si hay movimientos) */}
        {transactions.length > 0 && (
          <MetricsCards
            totalNC={totalNC}
            totalND={totalND}
            count={transactions.length}
            unclassifiedCount={unclassifiedCount}
            onFilterUnclassified={() => setIsFilteringUnclassified(prev => !prev)}
            isFilteringUnclassified={isFilteringUnclassified}
          />
        )}

        {/* Sección 3: Tabla Editable de Asientos */}
        <TransactionTable
          transactions={transactions}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onBatchUpdateAccount={handleBatchUpdateAccount}
          onBatchDelete={handleBatchDelete}
          planCuentas={planCuentas}
          onGenerateExcel={handleGenerateExcel}
          onOpenPreview={() => setIsPreviewOpen(true)}
          bankAccountCode={config.bankAccountCode}
          bankAccountName={config.bankAccountName}
        />

        {/* Estado Vacío cuando no hay transacciones */}
        {transactions.length === 0 && (
          <div className="my-8 text-center py-14 px-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#E0F2F1] text-[#4B7C32] flex items-center justify-center mx-auto mb-4 border border-white shadow-xs">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No hay movimientos cargados todavía</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              Sube tu estado de cuenta de Banco Plaza en PDF o Excel arriba, o haz clic en el botón para cargar un ejemplo real y probar la exportación.
            </p>
            <button
              type="button"
              onClick={() => {
                import('./data/rules').then(mod => {
                  handleAddTransactions(mod.SAMPLE_BANCO_PLAZA_TRANSACTIONS, true);
                  setStatusMessage({
                    text: `Se cargó el conjunto de prueba Banco Plaza (${mod.SAMPLE_BANCO_PLAZA_TRANSACTIONS.length} movimientos) para demostración contable.`,
                    type: 'success'
                  });
                });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-slate-800 bg-[#FFD1DC] hover:bg-[#ffc0cb] shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-700" />
              <span>Cargar Ejemplo Demostrativo Banco Plaza</span>
              <ArrowRight className="w-4 h-4 ml-1 text-slate-700" />
            </button>
          </div>
        )}

      </main>

      {/* Pie de Página Sleek */}
      <footer className="bg-white border-t border-slate-100 px-6 sm:px-8 py-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="text-[11px] font-medium tracking-wide uppercase">
            Venezuela • Normas VEN-NIF • Banco Plaza C.A.
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mr-2">
              <span>Hoja 1: Créditos</span>
              <span>·</span>
              <span>Hoja 2: Débitos</span>
            </div>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 bg-[#FFD1DC] rounded-full" title="Débitos / Cargos"></div>
              <div className="w-2.5 h-2.5 bg-[#A2D2FF] rounded-full" title="Exportación Excel"></div>
              <div className="w-2.5 h-2.5 bg-[#CDEAC0] rounded-full" title="Créditos / Cuadre"></div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modales */}
      <ExportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        transactions={transactions}
        config={config}
        onDownload={handleGenerateExcel}
      />

      <RulesCatalogModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <PlanCuentasModal
        isOpen={isPlanCuentasOpen}
        onClose={() => setIsPlanCuentasOpen(false)}
        planCuentas={planCuentas}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
      />

    </div>
  );
}
