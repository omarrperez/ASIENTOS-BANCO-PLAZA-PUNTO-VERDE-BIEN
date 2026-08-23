import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, CheckCircle2, Layers, ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { BankConfig, Transaction } from '../types';
import { prepareSheetsData } from '../services/excelExport';
import { formatVenezuelanMoney } from '../services/parser';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  config: BankConfig;
  onDownload: () => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  config,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'sheetNC' | 'sheetND'>('sheetNC');

  if (!isOpen) return null;

  const { sheetNCData, sheetNDData, totalNC, totalND, netBalance } = prepareSheetsData(transactions, config);

  const currentSheetData = activeTab === 'sheetNC' ? sheetNCData : sheetNDData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2F1] text-[#4B7C32] flex items-center justify-center shadow-xs border border-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Vista Previa de Asientos Contables (Excel - 2 Hojas)
              </h3>
              <p className="text-xs text-slate-400">
                {config.companyName || 'Empresa'} · 2 Hojas: Créditos (NC) y Débitos (ND)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de las 2 Hojas */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            
            <button
              type="button"
              onClick={() => setActiveTab('sheetNC')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sheetNC'
                  ? 'bg-[#4B7C32] text-white shadow-xs'
                  : 'bg-[#CDEAC0]/35 text-[#4B7C32] hover:bg-[#CDEAC0]/60 border border-[#CDEAC0]'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Hoja 1: Créditos NC ({sheetNCData.length - 1})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sheetND')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sheetND'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#FFD1DC]/40 text-rose-800 hover:bg-[#FFD1DC]/70 border border-[#FFD1DC]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Hoja 2: Débitos ND ({sheetNDData.length - 1})
            </button>

          </div>

          <div className="text-xs text-slate-400 font-medium">
            {activeTab === 'sheetNC' && '✅ Créditos + Fila de total en negativo (1.1.2.1.10) para cuadre.'}
            {activeTab === 'sheetND' && '⚖️ Gastos/Pasivos en positivo (+) contra salidas de Banco Plaza (1.1.1.2.60) en negativo (-).'}
          </div>
        </div>

        {/* Tabla Preview de la Hoja Seleccionada */}
        <div className="flex-1 overflow-auto p-6 bg-[#FDFBF7]">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-[#FDFBF7] text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3 w-10 text-center text-slate-400">#</th>
                  <th className="p-3 w-36">Cuenta Contable</th>
                  <th className="p-3 min-w-[280px]">Descripción</th>
                  <th className="p-3 w-16 text-center">Tipo</th>
                  <th className="p-3 w-28">Referencia</th>
                  <th className="p-3 w-32 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentSheetData.slice(1).map((row, idx) => {
                  const [cuenta, desc, tipo, ref, monto] = row;
                  const numMonto = Number(monto) || 0;
                  const isNegative = numMonto < 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-800">{cuenta}</td>
                      <td className="p-2.5 font-sans font-medium text-slate-700">{desc}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tipo === 'NC' ? 'bg-[#CDEAC0]/40 text-[#4B7C32] border border-[#CDEAC0]' : 'bg-[#FFD1DC]/40 text-rose-800 border border-[#FFD1DC]'
                          }`}
                        >
                          {tipo}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400">{ref || '-'}</td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          isNegative ? 'text-rose-600' : 'text-[#4B7C32]'
                        }`}
                      >
                        {formatVenezuelanMoney(numMonto)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div>
              Total NC: <span className="font-mono font-bold text-[#4B7C32]">{formatVenezuelanMoney(totalNC)} Bs.</span>
            </div>
            <div>
              Total ND: <span className="font-mono font-bold text-rose-600">{formatVenezuelanMoney(totalND)} Bs.</span>
            </div>
            <div>
              Saldo Neto: <span className="font-mono font-bold text-slate-800">{formatVenezuelanMoney(netBalance)} Bs.</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                onDownload();
                onClose();
              }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold text-slate-800 bg-[#A2D2FF] hover:bg-[#8ecae6] shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-700" />
              Descargar Archivo Excel (.xlsx)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
