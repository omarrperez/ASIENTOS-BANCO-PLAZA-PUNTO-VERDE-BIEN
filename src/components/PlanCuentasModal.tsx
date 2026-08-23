import React, { useState } from 'react';
import { X, SlidersHorizontal, Plus, Trash2, CheckCircle2, Bookmark } from 'lucide-react';
import { AccountItem } from '../types';

interface PlanCuentasModalProps {
  isOpen: boolean;
  onClose: () => void;
  planCuentas: AccountItem[];
  onAddAccount: (account: AccountItem) => void;
  onDeleteAccount: (code: string) => void;
}

export const PlanCuentasModal: React.FC<PlanCuentasModalProps> = ({
  isOpen,
  onClose,
  planCuentas,
  onAddAccount,
  onDeleteAccount,
}) => {
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<AccountItem['category']>('Gasto');
  const [newDesc, setNewDesc] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      setError('El código y el nombre de la cuenta son obligatorios.');
      return;
    }
    if (planCuentas.some(c => c.code === newCode.trim())) {
      setError('Ya existe una cuenta con este código contable.');
      return;
    }

    onAddAccount({
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
      description: newDesc.trim() || undefined
    });

    setNewCode('');
    setNewName('');
    setNewDesc('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2F1] text-[#4B7C32] flex items-center justify-center shadow-xs border border-white">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Plan de Cuentas Contables (VEN-NIF)
              </h3>
              <p className="text-xs text-slate-400">
                Cuentas disponibles para la clasificación de asientos contables bancarios
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

        {/* Formulario para agregar cuenta */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#4B7C32]" /> Agregar Nueva Cuenta al Catálogo
          </h4>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Código (ej: 6.1.2.5.10)"
                className="w-full text-xs font-mono p-2.5 bg-[#FDFBF7] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#4B7C32] focus:ring-2 focus:ring-[#CDEAC0]/40 text-slate-800"
              />
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre de la cuenta"
                className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#4B7C32] focus:ring-2 focus:ring-[#CDEAC0]/40 text-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as AccountItem['category'])}
                className="w-full text-xs p-2.5 bg-[#FDFBF7] border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#4B7C32] text-slate-700 font-semibold"
              >
                <option value="Activo">Activo</option>
                <option value="Pasivo">Pasivo</option>
                <option value="Patrimonio">Patrimonio</option>
                <option value="Ingreso">Ingreso</option>
                <option value="Gasto">Gasto</option>
                <option value="Especial">Especial</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-full py-2.5 px-3 rounded-full text-xs font-bold text-slate-800 bg-[#FFD1DC] hover:bg-[#ffc0cb] transition-all shadow-xs cursor-pointer"
              >
                Agregar
              </button>
            </div>
            {error && <p className="sm:col-span-12 text-xs text-rose-600 font-medium">{error}</p>}
          </form>
        </div>

        {/* Lista de cuentas existentes */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FDFBF7]">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-[#FDFBF7] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3 w-32 font-mono">Código</th>
                  <th className="p-3">Nombre de la Cuenta</th>
                  <th className="p-3 w-24 text-center">Tipo</th>
                  <th className="p-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {planCuentas.map((acct) => (
                  <tr key={acct.code} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-slate-800">{acct.code}</td>
                    <td className="p-2.5 font-medium">
                      <div>{acct.name}</div>
                      {acct.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{acct.description}</div>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          acct.category === 'Activo'
                            ? 'bg-[#A2D2FF]/30 text-blue-900 border border-[#A2D2FF]/60'
                            : acct.category === 'Pasivo'
                            ? 'bg-amber-100/70 text-amber-900 border border-amber-200'
                            : acct.category === 'Gasto'
                            ? 'bg-[#FFD1DC]/40 text-rose-800 border border-[#FFD1DC]'
                            : acct.category === 'Ingreso'
                            ? 'bg-[#CDEAC0]/40 text-[#4B7C32] border border-[#CDEAC0]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {acct.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      {acct.code !== 'SIN CLASIFICAR' && (
                        <button
                          type="button"
                          onClick={() => onDeleteAccount(acct.code)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Eliminar del catálogo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-400">
            Total de cuentas registradas: <span className="font-bold text-slate-700">{planCuentas.length}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full text-xs font-bold text-slate-800 bg-[#FFD1DC] hover:bg-[#ffc0cb] transition-colors cursor-pointer shadow-2xs"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
