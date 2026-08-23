import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import { formatVenezuelanMoney } from '../services/parser';

interface MetricsCardsProps {
  totalNC: number;
  totalND: number;
  count: number;
  unclassifiedCount: number;
  onFilterUnclassified: () => void;
  isFilteringUnclassified: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  totalNC,
  totalND,
  count,
  unclassifiedCount,
  onFilterUnclassified,
  isFilteringUnclassified,
}) => {
  const netBalance = totalNC + totalND;
  const isNetPositive = netBalance >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 my-6">
      
      {/* 1. Total Créditos (NC - Ingresos) */}
      <div className="bg-[#CDEAC0]/30 border border-[#CDEAC0]/70 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B7C32]">
            Créditos (NC / Abonos)
          </span>
          <div className="w-7 h-7 rounded-full bg-[#CDEAC0] flex items-center justify-center text-[#4B7C32] font-bold">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-mono text-lg sm:text-xl font-black text-[#4B7C32]">
            {formatVenezuelanMoney(totalNC)}
          </span>
          <span className="text-xs font-bold text-[#4B7C32]/80">Bs.</span>
        </div>
        <p className="mt-1 text-[11px] text-[#4B7C32]/80 font-medium">
          Aportes, cobros POS y transferencias
        </p>
      </div>

      {/* 2. Total Débitos (ND - Egresos) */}
      <div className="bg-[#FFD1DC]/35 border border-[#FFD1DC] rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Débitos (ND / Cargos)
          </span>
          <div className="w-7 h-7 rounded-full bg-[#FFD1DC] flex items-center justify-center text-rose-800 font-bold">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-mono text-lg sm:text-xl font-black text-rose-700">
            {formatVenezuelanMoney(Math.abs(totalND))}
          </span>
          <span className="text-xs font-bold text-rose-600">Bs.</span>
        </div>
        <p className="mt-1 text-[11px] text-rose-600/90 font-medium">
          Proveedores, comisiones y tributos
        </p>
      </div>

      {/* 3. Saldo Neto del Período */}
      <div className="bg-[#A2D2FF]/25 border border-[#A2D2FF]/70 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
            Saldo Neto del Período
          </span>
          <div className="w-7 h-7 rounded-full bg-[#A2D2FF] flex items-center justify-center text-blue-900 font-bold">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className={`font-mono text-lg sm:text-xl font-black ${isNetPositive ? 'text-blue-900' : 'text-rose-700'}`}>
            {formatVenezuelanMoney(netBalance)}
          </span>
          <span className="text-xs font-bold text-blue-800/80">Bs.</span>
        </div>
        <p className="mt-1 text-[11px] text-blue-700/80 font-medium">
          Diferencia neta en Banco Plaza
        </p>
      </div>

      {/* 4. Total Transacciones */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Movimientos
          </span>
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-lg sm:text-xl font-black text-slate-800">
            {count}
          </span>
          <span className="text-xs font-bold text-slate-400">registros</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 font-medium">
          Listos para exportar a 2 hojas
        </p>
      </div>

      {/* 5. Sin Clasificar / Alerta */}
      <button
        type="button"
        onClick={onFilterUnclassified}
        className={`text-left col-span-2 sm:col-span-1 border rounded-3xl p-4 sm:p-5 transition-all cursor-pointer ${
          unclassifiedCount > 0
            ? isFilteringUnclassified
              ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-300/60 shadow-xs'
              : 'bg-amber-50/90 border-amber-300 hover:bg-amber-100/70 shadow-xs'
            : 'bg-[#E0F2F1] border-white shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${unclassifiedCount > 0 ? 'text-amber-800' : 'text-[#4B7C32]'}`}>
            {unclassifiedCount > 0 ? 'Por Revisar' : 'Cuadre Contable'}
          </span>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${unclassifiedCount > 0 ? 'bg-amber-200 text-amber-900 font-bold' : 'bg-[#CDEAC0] text-[#4B7C32] font-bold'}`}>
            {unclassifiedCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className={`font-mono text-lg sm:text-xl font-black ${unclassifiedCount > 0 ? 'text-amber-800' : 'text-[#4B7C32]'}`}>
            {unclassifiedCount > 0 ? unclassifiedCount : '100% OK'}
          </span>
          {unclassifiedCount > 0 && <span className="text-xs font-bold text-amber-700">pendientes</span>}
        </div>
        <p className={`mt-1 text-[11px] font-medium ${unclassifiedCount > 0 ? 'text-amber-700 underline decoration-amber-300' : 'text-[#4B7C32]'}`}>
          {unclassifiedCount > 0
            ? isFilteringUnclassified
              ? 'Mostrando solo pendientes ✕'
              : 'Clic para filtrar y corregir'
            : 'Partida doble verificada'}
        </p>
      </button>

    </div>
  );
};
