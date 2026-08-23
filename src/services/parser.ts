import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configuración del worker de PDF.js
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  } catch (e) {
    console.warn('PDF.js worker setup notice:', e);
  }
}

export interface RawParsedTransaction {
  date: string;
  description: string;
  reference: string;
  amount: number;
}

/**
 * Normaliza cadenas para comparaciones seguras de encabezados y patrones
 */
export function normalizeClean(str: unknown): string {
  return String(str || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parsea montos venezolanos e internacionales:
 * Ejemplos: "1.250,50", "-35,00", "(48,50)", "1250.50", "4.850,50 Bs.", "15,00-", "300,00 DB"
 */
export function parseAnyNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  let str = String(val).trim();
  if (!str) return null;

  // Si contiene porcentaje (ej: 0.5%), no es un monto de transacción
  if (str.includes('%')) return null;

  str = str.replace(/[\u00A0\s]/g, '');

  // Códigos de cuenta contable como 1.1.1.2.60 o 1.1.2.1.10 no son montos
  if (/^\d+(\.\d+){2,}$/.test(str)) return null;
  // RIF como J-12345678-9 o V008973555
  if (/^[JVEGPjveg-]\d+/.test(str) && !str.includes(',') && !str.includes('.')) return null;

  let isNegative = false;
  const upperStr = str.toUpperCase();
  if (
    upperStr.includes('DB') ||
    upperStr.includes('DR') ||
    upperStr.includes('ND') ||
    upperStr.includes('CARGO') ||
    upperStr.includes('DEBITO') ||
    upperStr.endsWith('-') ||
    str.startsWith('-') ||
    (str.startsWith('(') && str.endsWith(')'))
  ) {
    isNegative = true;
  }

  str = str.replace(/[()DBDRCRNCND+\-]/gi, '').trim();
  str = str.replace(/(?:BS\.?|USD|\$|EUR|VES)/gi, '').trim();
  if (!str) return null;

  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // Formato VE/EU: 1.250,50 -> 1250.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato US: 1,250.50 -> 1250.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // 1250,50 -> 1250.50
    str = str.replace(',', '.');
  }

  const cleanNum = parseFloat(str.replace(/[^0-9.-]/g, ''));
  if (isNaN(cleanNum)) return null;
  return isNegative ? -Math.abs(cleanNum) : cleanNum;
}

/**
 * Parsea fechas en formatos comunes de estados de cuenta venezolanos
 */
export function parseAnyDate(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${val.getFullYear()}`;
  }

  if (typeof val === 'number') {
    if (val >= 10000 && val <= 65000) {
      const utcDays = Math.floor(val - 25569);
      const dateInfo = new Date(utcDays * 86400 * 1000);
      if (!isNaN(dateInfo.getTime())) {
        const d = String(dateInfo.getUTCDate()).padStart(2, '0');
        const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
        return `${d}/${m}/${dateInfo.getUTCFullYear()}`;
      }
    }
    return null;
  }

  const str = String(val).trim();
  if (!str) return null;

  const serialNum = parseFloat(str);
  if (!isNaN(serialNum) && serialNum >= 10000 && serialNum <= 65000 && /^\d{5}(?:\.\d+)?$/.test(str)) {
    return parseAnyDate(serialNum);
  }

  // DD/MM/YYYY o DD-MM-YYYY
  const dmy = str.match(/(\b\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4}\b)/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    let y = dmy[3];
    if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
    return `${d}/${m}/${y}`;
  }

  // YYYY/MM/DD
  const ymd = str.match(/(\b\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2}\b)/);
  if (ymd) {
    return `${ymd[3].padStart(2, '0')}/${ymd[2].padStart(2, '0')}/${ymd[1]}`;
  }

  // DD/MES/YYYY (español)
  const monthsMap: Record<string, string> = {
    ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
    JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12'
  };
  const sp = str.toUpperCase().match(/(\b\d{1,2})[\/.\-](ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[\/.\-](\d{2,4}\b)/);
  if (sp) {
    let y = sp[3];
    if (y.length === 2) y = '20' + y;
    return `${sp[1].padStart(2, '0')}/${monthsMap[sp[2]]}/${y}`;
  }

  return null;
}

export function formatVenezuelanMoney(n: number): string {
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Parsea un archivo Excel (.xlsx / .xls) de Banco Plaza
 * Respeta estrictamente:
 * - Columna DÉBITO: Salidas de dinero del banco (ND, montos negativos).
 * - Columna CRÉDITO: Depósitos y transferencias recibidas (NC, montos positivos -> 1.1.1.2.60 contra 1.1.2.1.10).
 * - Los números dentro de la descripción (RIF, POS, cédulas, terminales, teléfonos) NO son tomados como montos.
 */
export async function parseExcelFile(file: File): Promise<RawParsedTransaction[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const result: RawParsedTransaction[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];
    if (!rows || rows.length === 0) continue;

    let headerRowIdx = -1;
    let colDate = -1;
    let colDesc = -1;
    let colRef = -1;
    let colAmount = -1;
    let colDebit = -1;
    let colCredit = -1;
    let colType = -1;

    // 1. Detección robusta de encabezados
    for (let r = 0; r < Math.min(rows.length, 60); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const cleanHeaders = row.map(c => normalizeClean(c));

      const hasFecha = cleanHeaders.some(c => c.includes('FECHA') || c.includes('F.VALOR') || c.includes('F.OPER') || c.includes('DATE') || c.includes('F.MOV'));
      const hasDesc = cleanHeaders.some(c => c.includes('CONCEPTO') || c.includes('DESCRIP') || c.includes('DETALLE') || c.includes('MOTIVO') || c.includes('OPERACION') || c.includes('BENEFICIARIO'));
      const hasMonto = cleanHeaders.some(c => c.includes('MONTO') || c.includes('IMPORTE') || c.includes('CARGO') || c.includes('DEBITO') || c.includes('ABONO') || c.includes('CREDITO') || c.includes('DEBE') || c.includes('HABER') || c.includes('EGRESO') || c.includes('INGRESO') || c.includes('DEPOSITO'));

      if ((hasDesc && hasMonto) || (hasFecha && hasMonto) || (hasFecha && hasDesc)) {
        headerRowIdx = r;
        cleanHeaders.forEach((h, idx) => {
          // Ignorar columnas de saldo
          if (h.includes('SALDO') || h.includes('BALANCE') || h.includes('DISPONIBLE')) {
            return;
          }

          if ((h.includes('FECHA') || h.includes('F.VALOR') || h.includes('F.OPER') || h.includes('F.MOV') || h.includes('DATE')) && colDate < 0) {
            colDate = idx;
          } else if ((h.includes('DESCRIP') || h.includes('CONCEPTO') || h.includes('DETALLE') || h.includes('MOTIVO') || h.includes('OPERACION') || h.includes('BENEFICIARIO') || h.includes('ORIGEN')) && colDesc < 0) {
            colDesc = idx;
          } else if ((h.includes('REF') || h.includes('DOCUMENTO') || h.includes('NUMERO') || h.includes('COMPROBANTE') || h.includes('NRO')) && colRef < 0) {
            colRef = idx;
          } else if ((h.includes('TIPO') || h.includes('D/C') || h.includes('NATURALEZA') || h.includes('SIGNO') || h.includes('C/D')) && colType < 0) {
            colType = idx;
          } else if ((h.includes('CARGO') || h.includes('DEBITO') || h.includes('DEBE') || h.includes('EGRESO') || h.includes('SALIDA') || h.includes('RETIRO') || h.includes('PAGO')) && colDebit < 0) {
            colDebit = idx;
          } else if ((h.includes('ABONO') || h.includes('CREDITO') || h.includes('HABER') || h.includes('INGRESO') || h.includes('ENTRADA') || h.includes('DEPOSITO')) && colCredit < 0) {
            colCredit = idx;
          } else if ((h.includes('MONTO') || h.includes('IMPORTE') || h.includes('VALOR') || h.includes('NETO') || h.includes('CANTIDAD')) && colAmount < 0) {
            colAmount = idx;
          }
        });
        break;
      }
    }

    const start = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
    for (let i = start; i < rows.length; i++) {
      const row = rows[i];
      if (!Array.isArray(row) || row.length === 0) continue;
      const rowStr = row.join(' ').trim();
      if (!rowStr) continue;
      const up = normalizeClean(rowStr);

      if (
        up.startsWith('TOTAL') ||
        up.startsWith('SALDO') ||
        up.startsWith('SUBTOTAL') ||
        up.includes('PAGINA') ||
        up.startsWith('ESTADO DE CUENTA') ||
        up.includes('CLIENTE:') ||
        up.includes('RIF:') ||
        up.includes('NUMERO DE CUENTA') ||
        (up.includes('FECHA') && up.includes('DESCRIP'))
      ) {
        continue;
      }

      let dateStr = '';
      let description = '';
      let reference = '';
      let amount: number | null = null;

      if (headerRowIdx >= 0) {
        if (colDate >= 0) dateStr = parseAnyDate(row[colDate]) || '';
        if (colDesc >= 0) description = String(row[colDesc] || '').trim();
        if (colRef >= 0) reference = String(row[colRef] || '').trim();
        const explicitType = colType >= 0 ? normalizeClean(row[colType]) : '';

        // DÉBITO (Salidas de dinero) y CRÉDITO (Depósitos y transferencias recibidas)
        if (colDebit >= 0 && colCredit >= 0) {
          const debRaw = row[colDebit];
          const credRaw = row[colCredit];
          const deb = parseAnyNumber(debRaw);
          const cred = parseAnyNumber(credRaw);

          if (cred !== null && Math.abs(cred) > 0) {
            amount = Math.abs(cred); // Positivo (NC / Crédito -> Banco Plaza 1.1.1.2.60)
          } else if (deb !== null && Math.abs(deb) > 0) {
            amount = -Math.abs(deb); // Negativo (ND / Débito -> Salida de dinero)
          }
        } else if (colDebit >= 0 && colCredit < 0) {
          const deb = parseAnyNumber(row[colDebit]);
          if (deb !== null && Math.abs(deb) > 0) amount = -Math.abs(deb);
        } else if (colCredit >= 0 && colDebit < 0) {
          const cred = parseAnyNumber(row[colCredit]);
          if (cred !== null && Math.abs(cred) > 0) amount = Math.abs(cred);
        } else if (colAmount >= 0) {
          const amt = parseAnyNumber(row[colAmount]);
          if (amt !== null && amt !== 0) {
            if (explicitType === 'NC' || explicitType === 'C' || explicitType === 'CREDITO' || explicitType === 'ABONO' || explicitType === 'DEPOSITO') {
              amount = Math.abs(amt);
            } else if (explicitType === 'ND' || explicitType === 'D' || explicitType === 'DEBITO' || explicitType === 'CARGO' || explicitType === 'EGRESO') {
              amount = -Math.abs(amt);
            } else {
              amount = amt;
            }
          }
        }
      }

      // Si no hubo encabezado explícito, detectar columnas numéricas sin tocar el texto de la descripción
      if (amount === null || !description) {
        let candDate = '';
        let candDesc = '';
        let candRef = '';
        const numericCells: { colIdx: number; val: number; raw: string }[] = [];

        for (let colIdx = 0; colIdx < row.length; colIdx++) {
          const cell = row[colIdx];
          if (cell === '' || cell === null || cell === undefined) continue;
          const cellStr = String(cell).trim();

          // Código de cuenta contable
          if (/^\d+(\.\d+){2,}$/.test(cellStr)) continue;

          // Fecha
          if (!candDate) {
            const dd = parseAnyDate(cell);
            if (dd) { candDate = dd; continue; }
          }

          // Si es puramente número o formato monetario
          const num = parseAnyNumber(cell);
          const hasLetters = /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(cellStr);

          if (num !== null && !hasLetters) {
            const isPureRef = /^\d{6,15}$/.test(cellStr) && !/[.,]\d{2}$/.test(cellStr);
            if (isPureRef && !candRef) {
              candRef = cellStr;
            } else {
              numericCells.push({ colIdx, val: num, raw: cellStr });
            }
          } else if (hasLetters) {
            // Es la descripción: contiene texto, nombres, RIF, etc.
            if (!candDesc || cellStr.length > candDesc.length) {
              const u = normalizeClean(cellStr);
              if (!u.includes('FECHA') && !u.includes('MONTO') && !u.includes('TOTAL')) {
                candDesc = cellStr;
              }
            }
          }
        }

        if (!dateStr) dateStr = candDate;
        if (!description) description = candDesc;
        if (!reference) reference = candRef;

        if (amount === null && numericCells.length > 0) {
          if (numericCells.length >= 2) {
            // En estructura bancaria típica: [Débito, Crédito] o [Débito, Crédito, Saldo]
            const deb = numericCells[0].val;
            const cred = numericCells[1].val;
            if (cred !== 0 && Math.abs(cred) > 0 && deb === 0) {
              amount = Math.abs(cred);
            } else if (deb !== 0 && Math.abs(deb) > 0 && cred === 0) {
              amount = -Math.abs(deb);
            } else if (cred > 0) {
              amount = Math.abs(cred);
            } else if (deb > 0) {
              amount = -Math.abs(deb);
            } else {
              amount = numericCells[numericCells.length - 1].val;
            }
          } else {
            amount = numericCells[0].val;
          }
        }
      }

      if (amount !== null && amount !== 0 && description) {
        result.push({
          date: dateStr || new Date().toLocaleDateString('es-VE'),
          description,
          reference,
          amount
        });
      }
    }
  }

  return result;
}

/**
 * Parsea un archivo CSV
 */
export async function parseCsvFile(file: File): Promise<RawParsedTransaction[]> {
  const text = await file.text();
  return parseTextLines(text.split('\n'));
}

/**
 * Extrae texto de un archivo PDF con soporte para Banco Plaza
 */
export async function extractPdfLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items
      .map((it: unknown) => {
        const item = it as { str: string; transform: number[] };
        return {
          str: item.str,
          x: item.transform[4],
          y: Math.round(item.transform[5] / 2) * 2
        };
      })
      .filter(it => it.str && it.str.trim().length > 0);

    const lineMap = new Map<number, typeof items>();
    for (const it of items) {
      if (!lineMap.has(it.y)) lineMap.set(it.y, []);
      lineMap.get(it.y)!.push(it);
    }

    const ys = Array.from(lineMap.keys()).sort((a, b) => b - a);
    for (const y of ys) {
      const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const lineStr = lineItems.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
      if (lineStr) allLines.push(lineStr);
    }
  }

  return allLines;
}

/**
 * Parsea líneas de texto estructuradas (PDF o copiado y pegado)
 * Respeta que los números dentro de la descripción (RIF, POS, cédulas, teléfonos)
 * son texto descriptivo y toma el monto exclusivamente de las columnas numéricas al final.
 */
export function parseTextLines(lines: string[]): RawParsedTransaction[] {
  const result: RawParsedTransaction[] = [];
  const dateRegex = /(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const up = normalizeClean(line);

    if (
      up.startsWith('SALDO') ||
      up.startsWith('TOTAL') ||
      up.startsWith('SUBTOTAL') ||
      up.includes('ESTADO DE CUENTA') ||
      up.includes('PAGINA') ||
      up.includes('RIF:') ||
      up.includes('CLIENTE:') ||
      (up.includes('FECHA') && up.includes('DESCRIP')) ||
      (up.startsWith('BANCO PLAZA') && !up.includes('TRF'))
    ) {
      continue;
    }

    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;
    const dateStr = parseAnyDate(dateMatch[0]) || dateMatch[0];

    // Texto sin la fecha inicial
    const afterDate = line.replace(dateMatch[0], '').trim();
    const tokens = afterDate.split(/\s+/);
    if (tokens.length === 0) continue;

    // Buscar los montos al FINAL de la línea (donde están Débito, Crédito y Saldo)
    const trailingNumbers: { raw: string; num: number; index: number }[] = [];

    for (let i = tokens.length - 1; i >= 0; i--) {
      const tok = tokens[i];
      // Si el token tiene letras (salvo DB, CR, DR, NC, ND o signo -), no es el monto final
      const cleanTok = tok.replace(/(?:DB|DR|CR|NC|ND|BS\.?|\$|\+|-)/gi, '').trim();
      const hasWordLetters = /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(cleanTok);
      if (hasWordLetters) break;

      const parsed = parseAnyNumber(tok);
      if (parsed !== null) {
        trailingNumbers.unshift({ raw: tok, num: parsed, index: i });
      } else {
        break;
      }
      if (trailingNumbers.length >= 3) break;
    }

    if (trailingNumbers.length === 0) continue;

    const firstAmountTokenIndex = trailingNumbers[0].index;
    const descTokens = tokens.slice(0, firstAmountTokenIndex);
    let rawDesc = descTokens.join(' ').trim();

    // Extraer referencia si existe token numérico de 6 a 12 dígitos en la descripción
    let reference = '';
    const refMatch = rawDesc.match(/\b\d{6,12}\b/);
    if (refMatch) {
      reference = refMatch[0];
    }

    const description = rawDesc || line;

    // Determinar si es Débito (salida de dinero) o Crédito (depósito/transferencia)
    let amount: number;
    const isIncome = /DEPOSITO|LIQUID|POS CRE|POS ELE|POS MAE|TDY PAGO DE|TRF BAMIGA|TRF BANESC|TRF MERCAN|TRF PROVIN|TRF VZLA|ABONO|PAGOMOVIL RECIBIDO/.test(up);

    if (trailingNumbers.length >= 3) {
      // Formato: [Débito, Crédito, Saldo]
      const deb = trailingNumbers[0].num;
      const cred = trailingNumbers[1].num;
      if (cred !== 0 && Math.abs(cred) > 0) amount = Math.abs(cred);
      else amount = -Math.abs(deb);
    } else if (trailingNumbers.length === 2) {
      // Formato: [Monto, Saldo]
      const first = trailingNumbers[0];
      const isExplicitNeg = first.raw.includes('-') || first.raw.toUpperCase().includes('DB') || first.raw.toUpperCase().includes('ND') || up.includes('CARGO');
      const isExplicitPos = first.raw.toUpperCase().includes('CR') || first.raw.toUpperCase().includes('NC') || first.raw.toUpperCase().includes('ABONO');
      
      if (isExplicitNeg) amount = -Math.abs(first.num);
      else if (isExplicitPos || isIncome) amount = Math.abs(first.num);
      else amount = first.num < 0 ? first.num : (isIncome ? Math.abs(first.num) : -Math.abs(first.num));
    } else {
      // Formato: [Monto único]
      const single = trailingNumbers[0];
      const isExplicitNeg = single.raw.includes('-') || single.raw.toUpperCase().includes('DB') || single.raw.toUpperCase().includes('ND');
      const isExplicitPos = single.raw.toUpperCase().includes('CR') || single.raw.toUpperCase().includes('NC');
      
      if (isExplicitNeg) amount = -Math.abs(single.num);
      else if (isExplicitPos || isIncome) amount = Math.abs(single.num);
      else amount = isIncome ? Math.abs(single.num) : -Math.abs(single.num);
    }

    if (amount === 0 || isNaN(amount)) continue;

    result.push({
      date: dateStr,
      description,
      reference,
      amount
    });
  }

  return result;
}

