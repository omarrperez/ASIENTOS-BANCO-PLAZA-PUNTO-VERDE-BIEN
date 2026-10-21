import React, { useState, useMemo } from 'react';
import { Search, CheckSquare, Square, Trash2, FileSpreadsheet, Eye } from 'lucide-react';
import { AccountItem, Transaction, TransactionType } from '../types';
import { parseAnyNumber } from '../services/parser';
import { classifyTransactionWithRules } from '../data/rules';
import {
  collectTransactionIssues,
  getTransactionReviewState,
  TransactionReviewState
} from '../utils/validation';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onBatchUpdateAccount: (ids: string[], accountCode: string) => void;
  onBatchDelete: (ids: string[]) => void;
  planCuentas: AccountItem[];
  onGenerateExcel: () => void;
  onOpenPreview: () => void;
  bankAccountCode: string;
  bankAccountName: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onBatchUpdateAccount,
  onBatchDelete,
  planCuentas,
  onGenerateExcel,
  onOpenPreview,
  bankAccountCode,
  bankAccountName,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'NC' | 'ND' | 'UNCLASSIFIED' | 'ISSUES' | TransactionReviewState>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAccountSelect, setBatchAccountSelect] = useState<string>('');

  const rowIssuesMap = useMemo(() => {
    return Object.fromEntries(
      transactions.map(tx => [tx.id, collectTransactionIssues(tx)])
    ) as Record<string, ReturnType<typeof collectTransactionIssues>>;
  }, [transactions]);

  const reviewCounts = useMemo(() => {
    const counts = { ok: 0, warning: 0, error: 0 };
    transactions.forEach(tx => {
      const state = getTransactionReviewState(tx);
      if (state === 'ok') counts.ok += 1;
      if (state === 'warning') counts.warning += 1;
      if (state === 'error') counts.error += 1;
    });
    return counts;
  }, [transactions]);

  const issuesCount = useMemo(() => {
    return transactions.filter(tx => rowIssuesMap[tx.id]?.length).length;
  }, [transactions, rowIssuesMap]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType === 'NC' && tx.tipo !== 'NC') return false;
      if (filterType === 'ND' && tx.tipo !== 'ND') return false;
      if (filterType === 'UNCLASSIFIED' && tx.account !== 'SIN CLASIFICAR') return false;
      if (filterType === 'ISSUES' && !rowIssuesMap[tx.id]?.length) return false;
      if (filterType === 'ok' && getTransactionReviewState(tx) !== 'ok') return false;
      if (filterType === 'warning' && getTransactionReviewState(tx) !== 'warning') return false;
      if (filterType === 'error' && getTransactionReviewState(tx) !== 'error') return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const inDesc = tx.description.toLowerCase().includes(query);
        const inRef = tx.reference.toLowerCase().includes(query);
        const inAcct = tx.account.toLowerCase().includes(query) || tx.accountName.toLowerCase().includes(query);
        const inAmt = tx.amount.toString().includes(query);
        const inDate = tx.date.toLowerCase().includes(query);
        if (!inDesc && !inRef && !inAcct && !inAmt && !inDate) return false;
      }

      return true;
    });
  }, [transactions, filterType, searchTerm, rowIssuesMap]);

  const unclassifiedCount = useMemo(() => {
    return transactions.filter(t => t.account === 'SIN CLASIFICAR').length;
  }, [transactions]);

  const ncCount = useMemo(() => {
    return transactions.filter(t => t.tipo === 'NC').length;
  }, [transactions]);

  const ndCount = useMemo(() => {
    return transactions.filter(t => t.tipo === 'ND').length;
  }, [transactions]);

  const getStateBadge = (state: TransactionReviewState, issues: ReturnType<typeof collectTransactionIssues>) => {
    const title = issues.length
      ? issues.map(issue => issue.message).join(' • ')
      : 'Sin problemas detectados';

    if (state === 'error') {
      return {
        label: 'ERROR',
        className: 'bg-red-100 text-red-700 border border-red-200',
        title
      };
    }

    if (state === 'warning') {
      return {
        label: 'AVISO',
        className: 'bg-amber-100 text-amber-800 border border-amber-200',
        title
      };
    }

    return {
      label: 'OK',
      className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      title
    };
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleApplyBatchAccount = () => {
    if (!batchAccountSelect || selectedIds.size === 0) return;
    onBatchUpdateAccount(Array.from(selectedIds), batchAccountSelect);
    setSelectedIds(new Set());
    setBatchAccountSelect('');
  };

  const handleApplyBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`¿Deseas eliminar los ${selectedIds.size} movimientos seleccionados?`)) {
      onBatchDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleAmountChange = (tx: Transaction, rawValue: string) => {
    const n = parseAnyNumber(rawValue);
    if (n === null) return;

    const newTipo: TransactionType = n >= 0 ? 'NC' : 'ND';
    const cls = classifyTransactionWithRules(tx.description, n, bankAccountCode, bankAccountName);

    onUpdateTransaction(tx.id, {
      amount: n,
      tipo: newTipo,
      account: cls.account,
      accountName: cls.accountName,
      motivo: cls.motivo,
      regla: cls.regla
    });
  };

  const handleAccountChange = (tx: Transaction, newAccountCode: string) => {
    const found = planCuentas.find(c => c.code === newAccountCode);
    onUpdateTransaction(tx.id, {
      account: newAccountCode,
      accountName: found ? found.name : newAccountCode,
      motivo: 'Asignación manual del contador',
      isManual: true
    });
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm my-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#CDEAC0] text-[#4B7C32] font-mono text-xs font-black flex items-center justify-center border border-[#b7e2a4]">
              2
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Revisar y Asignar Cuentas Contables
            </h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              {transactions.length} registros
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verifica la imputación contable de cada movimiento. Puedes editar cualquier celda antes de generar el Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            Vista Previa de Asientos
          </button>

          <button
            type="button"
            onClick={onGenerateExcel}
            className="inline-flex items-center gap-2 bg-[#A2D2FF] hover:bg-[#8ecae6] text-slate-800 px-6 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-md transition-all transform active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-700" />
            DESCARGAR PARA EXCEL (2 HOJAS)
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-5 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-[#FDFBF7] text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            Todos ({transactions.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('NC')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'NC'
                ? 'bg-[#4B7C32] text-white shadow-xs'
                : 'bg-[#CDEAC0]/30 text-[#4B7C32] hover:bg-[#CDEAC0]/60 border border-[#CDEAC0]'
            }`}
          >
            Créditos NC ({ncCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('ND')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterType === 'ND'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-[#FFD1DC]/40 text-rose-800 hover:bg-[#FFD1DC]/70 border border-[#FFD1DC]'
            }`}
          >
            Débitos ND ({ndCount})
          </button>

          {unclassifiedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('UNCLASSIFIED')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'UNCLASSIFIED'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200/70 border border-amber-300'
              }`}
            >
              <span>⚠️ Sin Clasificar ({unclassifiedCount})</span>
            </button>
          )}

          {issuesCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('ISSUES')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'ISSUES'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'bg-red-100/80 text-red-700 hover:bg-red-200/80 border border-red-200'
              }`}
            >
              <span>Revisión ({issuesCount})</span>
            </button>
          )}

          {reviewCounts.error > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('error')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterType === 'error'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-100/80 text-red-700 hover:bg-red-200/80 border border-red-200'
              }`}
            >
              Errores ({reviewCounts.error})
            </button>
          )}

          {reviewCounts.warning > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('warning')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterType === 'warning'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-100/80 text-amber-800 hover:bg-amber-200/80 border border-amber-200'
              }`}
            >
              Avisos ({reviewCounts.warning})
            </button>
          )}

          {reviewCounts.ok > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('ok')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterType === 'ok'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200/80 border border-emerald-200'
              }`}
            >
              OK ({reviewCounts.ok})
            </button>
          )}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción, ref, monto..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-[#FDFBF7] border border-slate-200 rounded-full outline-none focus:bg-white focus:border-[#4B7C32] focus:ring-2 focus:ring-[#CDEAC0]/40 transition-all"
          />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#E0F2F1] border border-white rounded-2xl mb-4 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-[#4B7C32] font-bold">
            <CheckSquare className="w-4 h-4 text-[#4B7C32]" />
            <span>{selectedIds.size} movimiento(s) seleccionado(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold hidden sm:inline">Asignar cuenta en lote:</span>
            <select
              value={batchAccountSelect}
              onChange={(e) => setBatchAccountSelect(e.target.value)}
              className="text-xs p-2 bg-white border border-[#CDEAC0] rounded-xl outline-none font-medium max-w-[220px]"
            >
              <option value="">Seleccionar cuenta...</option>
              {planCuentas.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleApplyBatchAccount}
              disabled={!batchAccountSelect}
              className="px-4 py-2 rounded-full text-xs font-bold text-slate-800 bg-[#FFD1DC] hover:bg-[#ffc0cb] disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={handleApplyBatchDelete}
              className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 transition-all ml-1 cursor-pointer"
            >
              Eliminar ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs max-h-[560px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#FDFBF7] sticky top-0 z-10 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Seleccionar todo"
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredTransactions.length ? (
                    <CheckSquare className="w-4 h-4 text-[#4B7C32]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              </th>
              <th className="p-3.5 w-10">#</th>
              <th className="p-3.5 w-28">Fecha</th>
              <th className="p-3.5 min-w-[240px]">Descripción / Concepto</th>
              <th className="p-3.5 w-28">Referencia</th>
              <th className="p-3.5 w-32 text-right">Monto (Bs.)</th>
              <th className="p-3.5 w-16 text-center">Tipo</th>
              <th className="p-3.5 w-24 text-center">Estado</th>
              <th className="p-3.5 min-w-[260px]">Cuenta Contable (VEN-NIF)</th>
              <th className="p-3.5 min-w-[180px]">Regla / Motivo</th>
              <th className="p-3.5 w-12 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {filteredTransactions.map((tx, idx) => {
              const isSelected = selectedIds.has(tx.id);
              const isUnclassified = tx.account === 'SIN CLASIFICAR';
              const isNC = tx.tipo === 'NC';
              const txIssues = rowIssuesMap[tx.id] ?? [];
              const hasIssues = txIssues.length > 0;
              const hasError = txIssues.some(issue => issue.severity === 'error');
              const reviewState = getTransactionReviewState(tx);
              const stateBadge = getStateBadge(reviewState, txIssues);

              return (
                <tr
                  key={tx.id}
                  className={`transition-colors ${
                    reviewState === 'error'
                      ? 'bg-red-50/80 hover:bg-red-100/70'
                      : reviewState === 'warning'
                      ? 'bg-amber-50/80 hover:bg-amber-100/70'
                      : isUnclassified
                      ? 'bg-amber-50/70 hover:bg-amber-100/60'
                      : isSelected
                      ? 'bg-[#CDEAC0]/25'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(tx.id)}
                      className="rounded text-[#4B7C32] focus:ring-[#CDEAC0] w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>

                  <td className="p-3 font-mono text-[11px] text-slate-400">
                    {idx + 1}
                  </td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={tx.date}
                      onChange={(e) => onUpdateTransaction(tx.id, { date: e.target.value })}
                      className="w-full font-mono text-xs p-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-[#4B7C32] rounded-lg outline-none"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={tx.description}
                      onChange={(e) => {
                        const newDesc = e.target.value;
                        const cls = classifyTransactionWithRules(newDesc, tx.amount, bankAccountCode, bankAccountName);
                        onUpdateTransaction(tx.id, {
                          description: newDesc,
                          account: tx.isManual ? tx.account : cls.account,
                          accountName: tx.isManual ? tx.accountName : cls.accountName,
                          motivo: tx.isManual ? tx.motivo : cls.motivo,
                          regla: tx.isManual ? tx.regla : cls.regla
                        });
                      }}
                      className="w-full text-xs font-semibold p-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-[#4B7C32] rounded-lg outline-none"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={tx.reference}
                      onChange={(e) => onUpdateTransaction(tx.id, { reference: e.target.value })}
                      className="w-full font-mono text-xs text-slate-600 p-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-[#4B7C32] rounded-lg outline-none"
                    />
                  </td>

                  <td className="p-3 text-right">
                    <input
                      type="text"
                      defaultValue={tx.amount.toFixed(2)}
                      onBlur={(e) => handleAmountChange(tx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className={`w-full font-mono text-xs font-bold text-right p-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-[#4B7C32] rounded-lg outline-none ${
                        isNC ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'
                      }`}
                    />
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        isNC
                          ? 'bg-[#CDEAC0]/40 text-[#4B7C32] border border-[#CDEAC0]'
                          : 'bg-[#FFD1DC]/40 text-rose-800 border border-[#FFD1DC]'
                      }`}
                      title={isNC ? 'Crédito / Abono bancario (+)' : 'Débito / Cargo bancario (-)'}
                    >
                      {tx.tipo}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span
                      title={stateBadge.title}
                      className={`inline-flex items-center justify-center min-w-[62px] px-2.5 py-1 rounded-full text-[9px] font-black ${stateBadge.className}`}
                    >
                      {stateBadge.label}
                    </span>
                  </td>

                  <td className="p-3">
                    <select
                      value={tx.account}
                      onChange={(e) => handleAccountChange(tx, e.target.value)}
                      className={`w-full text-xs p-1.5 rounded-xl border outline-none font-medium transition-all ${
                        isUnclassified
                          ? 'bg-amber-100/90 text-amber-900 border-amber-300 font-bold ring-1 ring-amber-400/50'
                          : 'bg-[#FDFBF7] text-slate-800 border-slate-200 hover:border-[#CDEAC0] focus:border-[#4B7C32] focus:bg-white'
                      }`}
                    >
                      {planCuentas.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.code} — {item.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-col gap-1.5">
                      <div
                        className="text-[11px] text-slate-500 truncate max-w-[220px]"
                        title={tx.motivo || tx.regla}
                      >
                        <span className="font-semibold text-slate-700">{tx.regla}:</span> {tx.motivo}
                      </div>

                      {hasIssues && (
                        <div className="flex flex-wrap gap-1">
                          {txIssues.slice(0, 2).map(issue => (
                            <span
                              key={issue.kind}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                issue.severity === 'error'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                              title={issue.message}
                            >
                              {issue.severity === 'error' ? 'ERR' : 'WARN'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
        <div>
          Mostrando <span className="font-bold text-slate-700">{filteredTransactions.length}</span> de <span className="font-bold text-slate-700">{transactions.length}</span> movimientos.
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] text-slate-400">
            * Los montos están expresados en Bolívares (VES) con partida doble garantizada.
          </span>
        </div>
      </div>
    </div>
  );
};
