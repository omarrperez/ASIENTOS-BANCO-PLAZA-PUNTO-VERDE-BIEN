import React, { useState, useRef } from 'react';
import { UploadCloud, ClipboardPaste, PlusCircle, Sparkles, Trash2, FileSpreadsheet, FileText, Check, AlertCircle } from 'lucide-react';
import { AccountItem, BankConfig } from '../types';
import { parseExcelFile, parseCsvFile, extractPdfLines, parseTextLines } from '../services/parser';
import { SAMPLE_BANCO_PLAZA_TRANSACTIONS } from '../data/rules';

interface UploadSectionProps {
  onAddTransactions: (items: { date: string; description: string; reference: string; amount: number }[], replace: boolean) => void;
  onClearAll: () => void;
  totalLoaded: number;
  planCuentas: AccountItem[];
  config: BankConfig;
  statusMessage: { text: string; type: 'info' | 'success' | 'error' | 'warning' } | null;
  setStatusMessage: (msg: { text: string; type: 'info' | 'success' | 'error' | 'warning' } | null) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAddTransactions,
  onClearAll,
  totalLoaded,
  planCuentas,
  config,
  statusMessage,
  setStatusMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'manual'>('file');
  const [replaceOnLoad, setReplaceOnLoad] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');

  // Formulario manual
  const [manualDate, setManualDate] = useState<string>(() => new Date().toLocaleDateString('es-VE'));
  const [manualDesc, setManualDesc] = useState<string>('');
  const [manualRef, setManualRef] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualType, setManualType] = useState<'NC' | 'ND'>('ND');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage({
      text: `Procesando "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`,
      type: 'info'
    });

    try {
      const fileName = file.name.toLowerCase();
      let parsedItems: { date: string; description: string; reference: string; amount: number }[] = [];

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        parsedItems = await parseExcelFile(file);
      } else if (fileName.endsWith('.csv')) {
        parsedItems = await parseCsvFile(file);
      } else if (fileName.endsWith('.pdf')) {
        const lines = await extractPdfLines(file);
        parsedItems = parseTextLines(lines);
      } else {
        setStatusMessage({
          text: 'Formato de archivo no soportado. Por favor sube un archivo PDF, XLSX, XLS o CSV.',
          type: 'error'
        });
        setIsProcessing(false);
        return;
      }

      if (parsedItems.length === 0) {
        setStatusMessage({
          text: `No se detectaron transacciones automáticamente en "${file.name}". Puedes usar la pestaña "Pegar texto" o agregar registros manualmente.`,
          type: 'warning'
        });
      } else {
        onAddTransactions(parsedItems, replaceOnLoad);
        setStatusMessage({
          text: `¡Éxito! Se cargaron ${parsedItems.length} movimientos de "${file.name}" y se aplicaron las reglas de Banco Plaza.`,
          type: 'success'
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        text: `Error al procesar el archivo: ${errMsg}`,
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePasteProcess = () => {
    if (!pasteText.trim()) {
      setStatusMessage({ text: 'Por favor pega el texto del estado de cuenta primero.', type: 'warning' });
      return;
    }
    setIsProcessing(true);
    try {
      const lines = pasteText.split('\n');
      const parsedItems = parseTextLines(lines);
      if (parsedItems.length === 0) {
        setStatusMessage({
          text: 'No se detectaron movimientos en el texto pegado. Verifica que contenga líneas con fecha y monto.',
          type: 'warning'
        });
      } else {
        onAddTransactions(parsedItems, replaceOnLoad);
        setStatusMessage({
          text: `Se procesaron ${parsedItems.length} movimientos desde el texto pegado correctamente.`,
          type: 'success'
        });
        setPasteText('');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ text: `Error al procesar texto: ${errMsg}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmt = parseFloat(manualAmount.replace(',', '.'));
    if (isNaN(rawAmt) || rawAmt === 0) {
      setStatusMessage({ text: 'Por favor ingresa un monto válido mayor a cero.', type: 'warning' });
      return;
    }
    if (!manualDesc.trim()) {
      setStatusMessage({ text: 'Por favor ingresa una descripción para el movimiento.', type: 'warning' });
      return;
    }

    const finalAmount = manualType === 'NC' ? Math.abs(rawAmt) : -Math.abs(rawAmt);
    onAddTransactions(
      [{
        date: manualDate.trim() || new Date().toLocaleDateString('es-VE'),
        description: manualDesc.trim(),
        reference: manualRef.trim(),
        amount: finalAmount
      }],
      false
    );

    setStatusMessage({
      text: `Movimiento manual "${manualDesc}" agregado correctamente.`,
      type: 'success'
    });

    setManualDesc('');
    setManualRef('');
    setManualAmount('');
  };

  const handleLoadSample = () => {
    onAddTransactions(SAMPLE_BANCO_PLAZA_TRANSACTIONS, replaceOnLoad);
    setStatusMessage({
      text: `Se cargó el conjunto de prueba Banco Plaza (${SAMPLE_BANCO_PLAZA_TRANSACTIONS.length} movimientos) con ingresos POS, comisiones, transferencias y tributos.`,
      type: 'success'
    });
  };

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-sm">
      
      {/* Encabezado de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#CDEAC0] text-[#4B7C32] font-mono text-xs font-black flex items-center justify-center border border-[#b7e2a4]">
              1
            </span>
            Cargar Estado de Cuenta Banco Plaza
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Soporta extractos en PDF, Excel (.xlsx, .xls) y CSV con autodetección de fechas, referencias y montos en Bs.
          </p>
        </div>

        {/* Botón Sleek de Cargar Estado de Cuenta */}
        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-2 bg-[#FFD1DC] hover:bg-[#ffc0cb] text-slate-800 px-5 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all transform active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-slate-700" />
          <span>Cargar Ejemplo Banco Plaza</span>
        </button>
      </div>

      {/* Pestañas de Carga Estilo Sleek */}
      <div className="flex items-center gap-2 mt-5 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'file'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-[#FDFBF7] text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Subir Archivo (PDF / Excel)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'paste'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-[#FDFBF7] text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          Pegar Texto
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-[#FDFBF7] text-slate-600 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Agregar Manual
        </button>
      </div>

      {/* CONTENIDO PESTAÑA: SUBIR ARCHIVO */}
      {activeTab === 'file' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileProcess(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#4B7C32] bg-[#E0F2F1]/50 scale-[0.99]'
              : 'border-slate-200 bg-[#FDFBF7] hover:border-[#CDEAC0] hover:bg-[#E0F2F1]/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileProcess(file);
            }}
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E0F2F1] text-[#4B7C32] flex items-center justify-center mb-3.5 shadow-xs border border-white font-bold">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-sm font-bold text-slate-800">
            {isProcessing ? 'Procesando archivo...' : 'Arrastra tu estado de cuenta Banco Plaza aquí o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Formatos soportados: <span className="font-semibold text-slate-700">PDF, Excel (.xlsx, .xls) y CSV</span>. El motor reconocerá débitos, créditos, comisiones y referencias automáticamente.
          </p>

          <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-2xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel / CSV
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-rose-500" /> PDF Banco Plaza
            </span>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA: PEGAR TEXTO */}
      {activeTab === 'paste' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Copia el texto desde tu visor de PDF o banca en línea Banco Plaza (Ctrl+A, Ctrl+C) y pégalo a continuación:
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            placeholder="02/08/2026 POS ELE 00928371 TU PUNTO VERDE 92837122 4.850,50&#10;02/08/2026 COM FLAT POS REF 00928371 19827364 -72,75&#10;03/08/2026 TDY PAGO DE BANESC REF 00382910 1.250,00..."
            className="w-full font-mono text-xs p-4 bg-[#FDFBF7] border border-slate-200 rounded-2xl focus:bg-white focus:border-[#4B7C32] focus:ring-2 focus:ring-[#CDEAC0]/40 outline-none transition-all resize-y text-slate-700"
          />
          <button
            type="button"
            onClick={handlePasteProcess}
            disabled={!pasteText.trim() || isProcessing}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-slate-800 bg-[#FFD1DC] hover:bg-[#ffc0cb] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            {isProcessing ? 'Procesando...' : 'Procesar Texto Pegado'}
          </button>
        </div>
      )}

      {/* CONTENIDO PESTAÑA: MANUAL */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#FDFBF7] p-5 rounded-3xl border border-slate-200/80">
          
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha</label>
            <input
              type="text"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#4B7C32]"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Descripción / Concepto</label>
            <input
              type="text"
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
              placeholder="Ej: PAG SENIAT IMPUESTO AGOSTO"
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#4B7C32]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Referencia</label>
            <input
              type="text"
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              placeholder="00482910"
              className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#4B7C32]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo</label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value as 'NC' | 'ND')}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#4B7C32] font-semibold text-slate-700"
            >
              <option value="ND">ND (Débito/Cargo -)</option>
              <option value="NC">NC (Crédito/Abono +)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Monto (Bs.)</label>
            <input
              type="text"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="1250,50"
              className="w-full text-xs font-mono p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#4B7C32] text-right font-bold"
            />
          </div>

          <div className="sm:col-span-12 flex justify-end mt-1">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-bold text-slate-800 bg-[#FFD1DC] hover:bg-[#ffc0cb] transition-all shadow-xs cursor-pointer"
            >
              Agregar Transacción
            </button>
          </div>

        </form>
      )}

      {/* Barra de opciones y limpieza */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
        
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={replaceOnLoad}
            onChange={(e) => setReplaceOnLoad(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
          <span>Reemplazar transacciones actuales al cargar un nuevo archivo</span>
        </label>

        {totalLoaded > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas vaciar todas las transacciones cargadas?')) {
                onClearAll();
                setStatusMessage({ text: 'Se vaciaron todas las transacciones.', type: 'info' });
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vaciar todo ({totalLoaded})
          </button>
        )}

      </div>

      {/* Banner de Estado / Notificaciones */}
      {statusMessage && (
        <div
          className={`mt-4 p-4 rounded-2xl text-xs flex items-start gap-2.5 transition-all shadow-2xs ${
            statusMessage.type === 'success'
              ? 'bg-[#CDEAC0]/40 text-[#4B7C32] border border-[#CDEAC0]'
              : statusMessage.type === 'error'
              ? 'bg-[#FFD1DC]/40 text-rose-800 border border-[#FFD1DC]'
              : statusMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-[#A2D2FF]/30 text-blue-900 border border-[#A2D2FF]/60'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-[#4B7C32] mt-0.5 flex-shrink-0 font-bold" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0 font-bold" />
          )}
          <div className="flex-1 font-semibold leading-relaxed">{statusMessage.text}</div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

    </section>
  );
};
