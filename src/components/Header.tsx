import React from 'react';
import { Building2, Landmark, BookOpen, SlidersHorizontal, ShieldCheck, Sparkles } from 'lucide-react';
import { BankConfig } from '../types';

interface HeaderProps {
  config: BankConfig;
  onConfigChange: (config: BankConfig) => void;
  onOpenRules: () => void;
  onOpenPlanCuentas: () => void;
  totalTransactions: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onConfigChange,
  onOpenRules,
  onOpenPlanCuentas,
  totalTransactions,
}) => {
  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Logo y Marca */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-[#CDEAC0] rounded-xl flex items-center justify-center font-bold text-[#4B7C32] text-sm flex-shrink-0 shadow-xs border border-[#b7e2a4]">
            BP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Asistente Contable Banco Plaza
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CDEAC0]/40 text-[#4B7C32] border border-[#CDEAC0]">
                VEN-NIF
              </span>
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Generador de Asientos • Partida Doble • Venezuela
            </p>
          </div>
        </div>

        {/* Configuración rápida y Estatus */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Estatus de Conexión */}
          <div className="hidden xl:flex flex-col items-end mr-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Estatus del Sistema</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Motor Activo
            </span>
          </div>

          {/* Empresa */}
          <div className="flex items-center gap-2 bg-[#FDFBF7] border border-slate-200/80 rounded-2xl px-3 py-1.5 focus-within:border-[#4B7C32] focus-within:ring-2 focus-within:ring-[#CDEAC0]/50 transition-all">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Empresa / Razón Social</span>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => onConfigChange({ ...config, companyName: e.target.value })}
                placeholder="Ej: Tu Punto Verde, C.A."
                className="text-xs font-semibold text-slate-700 bg-transparent outline-none w-36 sm:w-44"
              />
            </div>
          </div>

          {/* Código Cuenta Banco */}
          <div className="flex items-center gap-2 bg-[#FDFBF7] border border-slate-200/80 rounded-2xl px-3 py-1.5 focus-within:border-[#4B7C32] focus-within:ring-2 focus-within:ring-[#CDEAC0]/50 transition-all">
            <Landmark className="w-4 h-4 text-[#4B7C32] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Cuenta Banco Plaza</span>
              <input
                type="text"
                value={config.bankAccountCode}
                onChange={(e) => onConfigChange({ ...config, bankAccountCode: e.target.value })}
                title={config.bankAccountName}
                className="text-xs font-mono font-semibold text-slate-700 bg-transparent outline-none w-24 sm:w-28"
              />
            </div>
          </div>

          {/* Botones de Modales Auxiliares */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            <button
              type="button"
              onClick={onOpenPlanCuentas}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all border border-slate-200/60 shadow-2xs"
              title="Ver y configurar catálogo de cuentas contables"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Plan de Cuentas</span>
            </button>

            <button
              type="button"
              onClick={onOpenRules}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#4B7C32] bg-[#CDEAC0]/40 hover:bg-[#CDEAC0]/70 rounded-full transition-all border border-[#CDEAC0] shadow-2xs"
              title="Consultar motor de reglas contables de Banco Plaza"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#4B7C32]" />
              <span className="hidden sm:inline">Reglas Plaza</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
