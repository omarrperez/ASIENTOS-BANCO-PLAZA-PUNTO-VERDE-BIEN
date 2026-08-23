import React, { useState } from 'react';
import { X, BookOpen, Search, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { RULES_PLAZA } from '../data/rules';

interface RulesCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesCatalogModal: React.FC<RulesCatalogModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredRules = RULES_PLAZA.filter(rule => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    const matchName = rule.regla.toLowerCase().includes(query) || rule.accountName.toLowerCase().includes(query);
    const matchAccount = rule.account.toLowerCase().includes(query);
    const matchPattern = rule.patterns.some(p => p.toLowerCase().includes(query));
    return matchName || matchAccount || matchPattern;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2F1] text-[#4B7C32] flex items-center justify-center shadow-xs border border-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Reglas de Clasificación Contable — Banco Plaza
              </h3>
              <p className="text-xs text-slate-400">
                Catálogo de patrones de texto y especificidad para estados de cuenta bancarios en Venezuela
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

        {/* Buscador de patrones */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por patrón (ej: POS, SENIAT, TIMBRES, ALFONZO, P2C, etc.)..."
              className="w-full text-xs pl-9 pr-4 py-2 bg-[#FDFBF7] border border-slate-200 rounded-full outline-none focus:bg-white focus:border-[#4B7C32] focus:ring-2 focus:ring-[#CDEAC0]/40 transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Grid de Reglas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-[#FDFBF7]">
          {filteredRules.map((rule, idx) => {
            const isNC = rule.tipo === 'NC';
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs hover:border-[#CDEAC0] transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isNC
                          ? 'bg-[#CDEAC0]/40 text-[#4B7C32] border border-[#CDEAC0]'
                          : 'bg-[#FFD1DC]/40 text-rose-800 border border-[#FFD1DC]'
                      }`}
                    >
                      {isNC ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {isNC ? 'NC · Crédito (+)' : 'ND · Débito (-)'}
                    </span>
                    <span className="font-mono text-xs font-black text-slate-800">{rule.account}</span>
                  </div>

                  <span className="text-xs font-bold text-slate-700">{rule.regla}</span>
                </div>

                <div className="mt-2.5">
                  <div className="text-xs font-semibold text-slate-700 mb-1.5">{rule.accountName}</div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                    {rule.patterns.map((pat, pIdx) => (
                      <span
                        key={pIdx}
                        className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[#FDFBF7] text-slate-600 border border-slate-200"
                      >
                        {pat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-400">
            * El motor evalúa primero la coincidencia más específica y asigna la cuenta correspondiente.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold text-slate-800 bg-[#FFD1DC] hover:bg-[#ffc0cb] transition-colors cursor-pointer shadow-2xs"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
