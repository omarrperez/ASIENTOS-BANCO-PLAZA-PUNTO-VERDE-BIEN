import * as XLSX from 'xlsx';
import { BankConfig, Transaction } from '../types';

export interface GeneratedSheetsData {
  sheetNCData: (string | number)[][];
  sheetNDData: (string | number)[][];
  totalNC: number;
  totalND: number;
  netBalance: number;
}

export function prepareSheetsData(transactions: Transaction[], config: BankConfig): GeneratedSheetsData {
  const HEADERS = ['Cuenta Contable', 'Descripción', 'Tipo', 'Referencia', 'Monto'];

  let totalNC = 0;
  let totalND = 0;

  // ---------- HOJA 1: SOLO NC (CRÉDITOS / INGRESOS) + FILA DE CUADRE CONTABLE ----------
  const ncRows = transactions.filter(t => t.tipo === 'NC');
  const sheetNCData: (string | number)[][] = [HEADERS];
  let sumNC = 0;

  ncRows.forEach(tx => {
    sumNC += tx.amount;
    totalNC += tx.amount;
    sheetNCData.push([
      tx.account,
      tx.description,
      'NC',
      tx.reference,
      roundMoney(tx.amount)
    ]);
  });

  // Fila de cuadre contable (partida doble): Cuenta deudores / clientes (1.1.2.1.10) en negativo
  const balAccountCode = config.balancingAccountCode || '1.1.2.1.10';
  sheetNCData.push([
    balAccountCode,
    'TOTAL DEPÓSITOS Y TRANSFERENCIAS ACREDITADAS',
    'ND',
    '',
    roundMoney(-Math.abs(sumNC))
  ]);

  // ---------- HOJA 2: SOLO ND (DÉBITOS / EGRESOS) + CONTRAPARTIDA BANCO PLAZA ----------
  // Regla contable permanente:
  // - Cuentas de gasto/pasivo (2.1.1.1.10, 6.1.2.5.02, 2.1.1.1.20, 6.1.2.5.03, etc.) van en POSITIVO (+)
  // - Salidas de fondos del banco (1.1.1.2.60) van en NEGATIVO (-)
  const ndRows = transactions.filter(t => t.tipo === 'ND');
  const sheetNDData: (string | number)[][] = [HEADERS];
  const bankCode = config.bankAccountCode || '1.1.1.2.60';

  // 1. Filas de gastos, proveedores, impuestos y pasivos (Débito contable en POSITIVO)
  ndRows.forEach(tx => {
    totalND += tx.amount;
    sheetNDData.push([
      tx.account,
      tx.description,
      'ND',
      tx.reference,
      roundMoney(Math.abs(tx.amount))
    ]);
  });

  // 2. Filas de contrapartida: salidas del banco (Crédito contable / Salida de fondos en NEGATIVO)
  ndRows.forEach(tx => {
    sheetNDData.push([
      bankCode,
      tx.description,
      'NC',
      tx.reference,
      roundMoney(-Math.abs(tx.amount))
    ]);
  });

  return {
    sheetNCData,
    sheetNDData,
    totalNC,
    totalND,
    netBalance: totalNC + totalND
  };
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  config: BankConfig
): { fileName: string; totalNC: number; totalND: number } {
  if (transactions.length === 0) {
    throw new Error('No hay transacciones para exportar.');
  }

  const { sheetNCData, sheetNDData, totalNC, totalND } = prepareSheetsData(transactions, config);

  const wb = XLSX.utils.book_new();
  const wsNC = buildSheet(sheetNCData);
  const wsND = buildSheet(sheetNDData);

  // El archivo contiene exactamente 2 hojas: Créditos y Débitos
  XLSX.utils.book_append_sheet(wb, wsNC, 'Hoja1 - Créditos (NC)');
  XLSX.utils.book_append_sheet(wb, wsND, 'Hoja2 - Débitos (ND)');

  const company = (config.companyName || 'Empresa').trim();
  const safeName = company.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Asientos_Bancarios_BancoPlaza_${safeName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);

  return {
    fileName,
    totalNC,
    totalND
  };
}

export function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function buildSheet(aoa: (string | number)[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Ancho óptimo de columnas
  ws['!cols'] = [
    { wch: 18 }, // Cuenta Contable
    { wch: 46 }, // Descripción
    { wch: 10 }, // Tipo
    { wch: 18 }, // Referencia
    { wch: 18 }  // Monto
  ];

  // Formato numérico estándar con 2 decimales y separador de miles para la columna Monto (E)
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let r = 1; r <= range.e.r; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: 4 });
      if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
        ws[cellRef].z = '#,##0.00;[Red]-#,##0.00';
      }
    }
  }

  return ws;
}
