import { AccountItem, AccountRule, ClassificationResult, TransactionType } from '../types';

export const DEFAULT_PLAN_CUENTAS: AccountItem[] = [
  { code: '1.1.1.2.60', name: 'BANCO PLAZA, BANCO UNIVERSAL', category: 'Activo', description: 'Cuenta bancaria principal en Bolívares (Entradas y salidas)' },
  { code: '1.1.2.1.10', name: 'DEUDORES COMERCIALES NACIONALES', category: 'Activo', description: 'Cuentas por cobrar clientes / Contrapartida de ingresos y transferencias recibidas' },
  { code: '1.1.2.2.30', name: 'SOCIOS O DIRECTORES (CxC Socios)', category: 'Activo', description: 'Préstamos o anticipos a socios/directores' },
  { code: '2.1.1.1.10', name: 'PROVEEDORES NACIONALES', category: 'Pasivo', description: 'Pagos por compras y servicios de proveedores' },
  { code: '2.1.1.1.20', name: 'PAGAR BANCARIO', category: 'Pasivo', description: 'Amortización de préstamos y pagarés bancarios' },
  { code: '2.1.1.3.15', name: 'CUENTAS POR PAGAR SOCIOS', category: 'Pasivo', description: 'Aportes o préstamos recibidos de socios' },
  { code: '6.1.2.1.25', name: 'POLIZAS DE SEGURO', category: 'Gasto', description: 'Primas y coberturas de seguros empresariales' },
  { code: '6.1.2.1.64', name: 'TIMBRES FISCALES', category: 'Gasto', description: 'Tributos estadales y timbres fiscales' },
  { code: '6.1.2.5.02', name: 'COMISIONES BANCARIAS', category: 'Gasto', description: 'Comisiones de transferencias, POS, mantenimiento y cheques' },
  { code: '6.1.2.5.03', name: 'GASTOS BANCARIOS', category: 'Gasto', description: 'Gastos bancarios diversos, biopago y rendimientos' },
  { code: 'SIN CLASIFICAR', name: '** REVISAR MANUALMENTE **', category: 'Especial', description: 'Movimientos que requieren asignación contable manual' }
];

export const RULES_PLAZA: AccountRule[] = [
  // ---------- REGLA 1: INGRESOS (monto POSITIVO -> NC: 1.1.1.2.60 vs 1.1.2.1.10) ----------
  {
    account: '1.1.1.2.60',
    accountName: 'BANCO PLAZA, BANCO UNIVERSAL (INGRESOS)',
    tipo: 'NC',
    regla: 'Regla 1 - Ingresos (1.1.1.2.60 vs 1.1.2.1.10)',
    patterns: [
      'DEPOSITO XXXXXXXXX',
      'LIQUID XXXXXXXXXXXX',
      'POS CRE XXXXXXXX',
      'POS ELE XXXXXXXX',
      'POS MAE XXXXXXXX',
      'TDY COM.P2C VZLA',
      'TDY PAGO DE 100%B',
      'TDY PAGO DE ACTIVO',
      'TDY PAGO DE B.EXTE',
      'TDY PAGO DE B.PLUS',
      'TDY PAGO DE BAMIGA',
      'TDY PAGO DE BANCRE',
      'TDY PAGO DE BANESC',
      'TDY PAGO DE BANFAN',
      'TDY PAGO DE BDT',
      'TDY PAGO DE BFC',
      'TDY PAGO DE BNC',
      'TDY PAGO DE CARIBE',
      'TDY PAGO DE MERCAN',
      'TDY PAGO DE PLAZA',
      'TDY PAGO DE PROVIN',
      'TDY PAGO DE TESORO',
      'TDY PAGO DE V.CRED',
      'TDY PAGO DE VZLA',
      'TRF BAMIGA',
      'TRF BANESC',
      'TRF MERCAN',
      'TRF PROVIN VXXXXXXXXXX',
      'TRF VZLA GXXXXXXXXX',
      'TRF VZLA JXXXXXXXXX',
      'ABONO POR PUNTO DE VENTA',
      'PAGOMOVIL RECIBIDO',
      'CREDITO INMEDIATO'
    ]
  },

  // ---------- REGLA 2: CUENTA POR PAGAR SOCIOS (monto POSITIVO -> NC) ----------
  {
    account: '2.1.1.3.15',
    accountName: 'CUENTAS POR PAGAR SOCIOS',
    tipo: 'NC',
    regla: 'Regla 2 - Aporte de socios',
    boost: 8,
    patterns: [
      'TRF BANESC V008973555 ALFONZO',
      'TRF PLAZA V008973555 ALFONZO',
      'TRF VZLA VXXXXXXXXX CARLOS A',
      'APORTE SOCIO',
      'PRESTAMO ACCIONISTA'
    ]
  },

  // ---------- REGLA 3: PROVEEDORES (monto NEGATIVO -> ND) ----------
  {
    account: '2.1.1.1.10',
    accountName: 'PROVEEDORES',
    tipo: 'ND',
    regla: 'Regla 3 - Proveedores',
    patterns: [
      'COMPRA MAESTRO',
      'DOM POS',
      'DOM POS BPL',
      'NOTA DEBITO XXXXXXXX',
      'PAG BAMIGA',
      'PAG BAMIGA TRANSF',
      'PAG BANESC',
      'PAG CARIBE XXXXXXXXXX',
      'PAG MERCAN XXXXXXXXXX',
      'PAG PLAZA XXXXXXXXXX',
      'PAG PROV PLAZA REF',
      '0138 XXXXXXXX',
      'PAG PROV REF',
      'PAG SENIAT XXXXXXXXXX',
      'PAG VZLA',
      'PAG VZLA XXXXXXXXXX',
      'PAGO SENIAT PROPIO',
      'TDY COM.P2C 100%B',
      'TDY COM.P2C ACTIVO',
      'TDY COM.P2C B.EXTE',
      'TDY COM.P2C B.PLUS',
      'TDY COM.P2C BAMIGA',
      'TDY COM.P2C BANCRE',
      'TDY COM.P2C BANESC',
      'TDY COM.P2C BANFAN',
      'TDY COM.P2C BDT',
      'TDY COM.P2C BFC',
      'TDY COM.P2C BNC',
      'TDY COM.P2C CARIBE',
      'TDY COM.P2C MERCAN',
      'TDY COM.P2C PROVIN',
      'TDY COM.P2C TESORO',
      'TDY COM.P2C V.CRED',
      'TDY COM.P2C VZLA',
      'TDY PAGO DE VZLA',
      'TRF BANCRE VXXXXXXXXX',
      'TRF BANESC XXXXXXXXXX',
      'TRF VZLA XXXXXXXXXX',
      'TRF VZLA J411499455 TU PUNTO',
      'TRF PROVIN XXXXXXXXXX',
      'TRF PLAZA XXXXXXXXXX',
      'TRF MERCAN XXXXXXXXXX',
      'TRF BAMIGA XXXXXXXXXX',
      'TRF CARIBE XXXXXXXXXX',
      'TRF TESORO XXXXXXXXXX',
      'PAGO ELECTRONICO PROVEEDORES',
      'PAGO DE SERVICIOS',
      'OPERACION PAGOMOVIL BDV',
      'OPERACION PAGOMOVILBDV OT',
      'PAGO IMPUESTOS INTERNET',
      'TRANSF EN LINEA OTR BCOS',
      'TRASPASO OTRAS CTAS BDV E',
      'DOMICILIACION OTROS BANCOS 0104 J413126',
      'PAGO A OTROS BANCOS 0134 V8973555',
      'PAGO A OTROS BANCOS 0172 V14501732',
      'TRF B.PLUS V025567209 CARLOS F',
      'TRF B.PLUS V030205593 VIRGILO',
      'TRF BNC V026632089 LUIS JOS',
      'TRF B.PLUS XXXXXXXXXX',
      'TRF BNC XXXXXXXXXX',
      'DOMICILIACION OTROS BANCOS',
      'PAGO A OTROS BANCOS',
      'DOMICILIACION'
    ]
  },

  // ---------- REGLA 3b: PAGAR BANCARIO (capital) (monto NEGATIVO -> ND) ----------
  {
    account: '2.1.1.1.20',
    accountName: 'PAGAR BANCARIO',
    tipo: 'ND',
    regla: 'Regla 3 - Pago de capital',
    boost: 5,
    patterns: [
      'PAG CAPIT XXXXXXXXXXXX',
      'PAG CAPIT',
      'AMORTIZACION CREDITO',
      'PAGO CAPITAL PRESTAMO'
    ]
  },

  // ---------- REGLA 4: GASTOS BANCARIOS (monto NEGATIVO -> ND) ----------
  {
    account: '6.1.2.5.03',
    accountName: 'GASTOS BANCARIOS',
    tipo: 'ND',
    regla: 'Regla 4 - Gastos bancarios',
    patterns: [
      'BIOM .CUPO XXXXXXXXXXXX',
      'BIOM CUPO',
      'PAG RENDI XXXXXXXXXXXX',
      'PAG RENDI'
    ]
  },

  // ---------- REGLA 5: COMISIONES BANCARIAS (monto NEGATIVO -> ND) ----------
  {
    account: '6.1.2.5.02',
    accountName: 'COMISIONES BANCARIAS',
    tipo: 'ND',
    regla: 'Regla 5 - Comisiones bancarias',
    boost: 4,
    patterns: [
      'CARGO EMISION EDO DE CUENTA',
      'CARGO POR MANTENIMIENTO CTA',
      'EMISION Y REPOSICION TDD',
      'COM FLAT POS',
      'COM PAG PROV REF',
      'COM TRF XXXXXXXXX',
      'COM TRF PLAZA REFXXXXXXXXX',
      'COM. PAG REF.',
      'COM. TRF REF.',
      'COMISION V XXXXXXXXXXXX',
      'COMISION TRF',
      'COMISION POR TRANSFERENCIA',
      'COMISION SERVICIO PAGO MOVIL',
      'COM BANCA MOVIL BDV',
      'COM MANTENIMIENTO DE CUEN',
      'COM TRANSF EN LINEA OT BC',
      'COMISION T FALLIDA P2P BD',
      'COM PAGO OTR BCOS JUR NAT',
      'COM PAGO OTRAS CTAS JUR NAT',
      'COMISION OPERACION BIOMETRIA',
      'COM PAGO OTR BCOS',
      'COM PAGO OTRAS CTAS',
      'COMISION OPERACION BIOMETRIA'
    ]
  },

  // ---------- REGLA 6: TIMBRES FISCALES (monto NEGATIVO -> ND) ----------
  {
    account: '6.1.2.1.64',
    accountName: 'TIMBRES FISCALES',
    tipo: 'ND',
    regla: 'Regla 6 - Timbres fiscales',
    boost: 12,
    patterns: [
      'TIMBRES FI XXXXXXXXXXXXX',
      'TIMBRES FI',
      'TIMBRES FISCALES',
      '1 POR MIL'
    ]
  },

  // ---------- REGLA 7: POLIZAS DE SEGURO (monto NEGATIVO -> ND) ----------
  {
    account: '6.1.2.1.25',
    accountName: 'POLIZAS DE SEGURO',
    tipo: 'ND',
    regla: 'Regla 7 - Pólizas de seguro',
    boost: 12,
    patterns: [
      'PRIMAS SEGUR',
      'SEGUR',
      'POLIZA SEGURO',
      'SEGUROS MERCANTIL',
      'SEGUROS CARACAS',
      'SEGUROS PIRAMIDE'
    ]
  },

  // ---------- REGLA 8: CUENTAS POR COBRAR SOCIOS (monto NEGATIVO -> ND) ----------
  {
    account: '1.1.2.2.30',
    accountName: 'SOCIOS O DIRECTORES',
    tipo: 'ND',
    regla: 'Regla 8 - Cuentas por cobrar socios',
    boost: 10,
    patterns: [
      'PAG BANESC CARLOS ALFONZO',
      'PAG BANESC DAVID JABER',
      'TRF BANESC XXXXXXXXXX CARLOS A',
      'TRF MERCAN V006362534 CARLOS',
      'TRF PLAZA V008973555 ALFONZO',
      'TRF PLAZA V008973555 ALFONZO R',
      'TRF VZLA V008220911 CARLOS',
      'PAGO A TERCEROS BDV V08973555 CARLOS ALFONZO',
      'PAGO A TERCEROS BDV CARLOS ALFONZO',
      'PAGO A TERCEROS BDV',
      'PRESTAMO SOCIO',
      'RETIRO ACCIONISTA'
    ]
  }
];

function buildAnchors(pattern: string): string[] {
  const tokens = pattern.split(/\s+/);
  const anchors: string[] = [];
  for (const tok of tokens) {
    const core = tok.replace(/^X+|X+$/gi, '').trim();
    if (!core) continue;
    if (/^[A-Za-z]?\d{5,}$/.test(core)) continue;
    anchors.push(core.toUpperCase());
  }
  return anchors;
}

export function normalizeText(str: string): string {
  return String(str || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface CompiledRuleCandidate {
  rule: AccountRule;
  pattern: string;
  anchors: string[];
  specificity: number;
}

function compileRules(sign: number): CompiledRuleCandidate[] {
  const targetTipo: TransactionType = sign > 0 ? 'NC' : 'ND';
  const out: CompiledRuleCandidate[] = [];

  for (const rule of RULES_PLAZA) {
    if (rule.tipo !== targetTipo) continue;
    for (const pattern of rule.patterns) {
      const anchors = buildAnchors(pattern);
      if (anchors.length === 0) continue;
      out.push({
        rule,
        pattern,
        anchors,
        specificity: anchors.length + (rule.boost || 0)
      });
    }
  }
  return out.sort((a, b) => b.specificity - a.specificity);
}

const COMPILED_POSITIVE = compileRules(1);
const COMPILED_NEGATIVE = compileRules(-1);

function matchesAnchors(descNorm: string, anchors: string[]): boolean {
  let pos = 0;
  for (const a of anchors) {
    const idx = descNorm.indexOf(a, pos);
    if (idx === -1) return false;
    pos = idx + a.length;
  }
  return true;
}

export function classifyTransactionWithRules(
  description: string,
  amount: number,
  bankAccountCode: string = '1.1.1.2.60',
  bankAccountName: string = 'BANCO PLAZA, BANCO UNIVERSAL'
): ClassificationResult {
  const descNorm = normalizeText(description);
  const candidates = amount >= 0 ? COMPILED_POSITIVE : COMPILED_NEGATIVE;

  for (const c of candidates) {
    if (matchesAnchors(descNorm, c.anchors)) {
      let accountCode = c.rule.account;
      let accountName = c.rule.accountName;
      if (accountCode === '1.1.1.2.60' || accountCode === '1.1.1.2.10') {
        accountCode = bankAccountCode;
        accountName = `${bankAccountName} (INGRESOS)`;
      }
      return {
        account: accountCode,
        accountName,
        tipo: c.rule.tipo,
        regla: c.rule.regla,
        motivo: `Coincide con patrón: "${c.pattern}"`
      };
    }
  }

  // Fallback positivo: ingresos Banco Plaza (1.1.1.2.60 contra 1.1.2.1.10)
  if (amount >= 0) {
    return {
      account: bankAccountCode,
      accountName: `${bankAccountName} (INGRESOS)`,
      tipo: 'NC',
      regla: 'Regla 1 - Ingresos (1.1.1.2.60 vs 1.1.2.1.10)',
      motivo: 'Monto positivo: Crédito / Depósito / Transferencia recibida a Banco Plaza.'
    };
  }

  // Fallback negativo: requiere revisión manual
  return {
    account: 'SIN CLASIFICAR',
    accountName: '** REVISAR MANUALMENTE **',
    tipo: 'ND',
    regla: 'Sin regla identificada',
    motivo: 'Salida de banco sin clasificar. Seleccione la cuenta de gasto, proveedor o socio.'
  };
}

export const SAMPLE_BANCO_PLAZA_TRANSACTIONS = [
  { date: '02/08/2026', description: 'POS ELE 00928371 TU PUNTO VERDE', reference: '92837122', amount: 4850.50 },
  { date: '02/08/2026', description: 'COM FLAT POS REF 00928371', reference: '19827364', amount: -72.75 },
  { date: '03/08/2026', description: 'TDY PAGO DE BANESC REF 00382910', reference: '00382910', amount: 1250.00 },
  { date: '04/08/2026', description: 'PAG PROV PLAZA REF 00492819 SUMINISTROS C.A.', reference: '00492819', amount: -3200.00 },
  { date: '04/08/2026', description: 'COM. TRF REF. 00492819', reference: '88273615', amount: -15.00 },
  { date: '05/08/2026', description: 'TIMBRES FI 001928374615 GOBERNACION', reference: '00192837', amount: -48.50 },
  { date: '06/08/2026', description: 'TRF BANESC V008973555 ALFONZO APORTE', reference: '77263541', amount: 8000.00 },
  { date: '07/08/2026', description: 'PAG CAPIT 000192837461 PAGARE BANCARIO', reference: '19283746', amount: -2500.00 },
  { date: '08/08/2026', description: 'PRIMAS SEGUR POLIZA COLECTIVA MERCANTIL', reference: '66251433', amount: -650.00 },
  { date: '09/08/2026', description: 'PAG BANESC CARLOS ALFONZO RETIRO', reference: '55443322', amount: -1800.00 },
  { date: '10/08/2026', description: 'CARGO POR MANTENIMIENTO CTA MES 08/2026', reference: '99182736', amount: -35.00 },
  { date: '11/08/2026', description: 'LIQUID 000098273615 CIERRE LOTE POS', reference: '00009827', amount: 9420.30 },
  { date: '12/08/2026', description: 'TRANSFERENCIA DESCONOCIDA CLIENTE X', reference: '44332211', amount: -450.00 }
];
