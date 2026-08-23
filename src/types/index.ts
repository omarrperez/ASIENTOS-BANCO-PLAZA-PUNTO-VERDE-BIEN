export type TransactionType = 'NC' | 'ND';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: number; // Positivo para NC (Crédito/Abono), Negativo para ND (Débito/Cargo)
  account: string;
  accountName: string;
  tipo: TransactionType;
  regla: string;
  motivo: string;
  isManual?: boolean;
}

export interface AccountRule {
  account: string;
  accountName: string;
  tipo: TransactionType;
  regla: string;
  patterns: string[];
  boost?: number;
}

export interface AccountItem {
  code: string;
  name: string;
  category: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto' | 'Especial';
  description?: string;
}

export interface BankConfig {
  companyName: string;
  bankAccountCode: string;
  bankAccountName: string;
  balancingAccountCode: string; // 1.1.2.1.10 para la fila de total en Hoja 2
  balancingAccountName: string;
}

export interface ClassificationResult {
  account: string;
  accountName: string;
  tipo: TransactionType;
  regla: string;
  motivo: string;
}
