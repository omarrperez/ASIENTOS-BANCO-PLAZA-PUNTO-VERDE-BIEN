import { Transaction } from '../types';
import { parseAnyDate } from '../services/parser';

export type TransactionIssueKind =
  | 'empty-description'
  | 'invalid-date'
  | 'zero-amount'
  | 'unclassified'
  | 'type-mismatch';

export type TransactionReviewState = 'ok' | 'warning' | 'error';

export interface TransactionIssue {
  kind: TransactionIssueKind;
  message: string;
  severity: 'warning' | 'error';
}

export function collectTransactionIssues(tx: Partial<Transaction>): TransactionIssue[] {
  const issues: TransactionIssue[] = [];
  const description = String(tx.description ?? '').trim();
  if (!description) {
    issues.push({ kind: 'empty-description', message: 'Descripción vacía', severity: 'error' });
  }

  const dateText = String(tx.date ?? '').trim();
  if (!dateText || parseAnyDate(dateText) === null) {
    issues.push({ kind: 'invalid-date', message: 'Fecha inválida', severity: 'warning' });
  }

  const amount = typeof tx.amount === 'number' ? tx.amount : Number.parseFloat(String(tx.amount ?? ''));
  if (!Number.isFinite(amount) || Math.abs(amount) === 0) {
    issues.push({ kind: 'zero-amount', message: 'Monto cero o inválido', severity: 'error' });
  }

  if (tx.account === 'SIN CLASIFICAR') {
    issues.push({ kind: 'unclassified', message: 'Sin clasificación contable', severity: 'warning' });
  }

  if (typeof tx.amount === 'number' && tx.tipo && tx.account !== 'SIN CLASIFICAR') {
    if ((tx.amount >= 0 && tx.tipo !== 'NC') || (tx.amount < 0 && tx.tipo !== 'ND')) {
      issues.push({
        kind: 'type-mismatch',
        message: 'El tipo no coincide con el signo del monto',
        severity: 'warning'
      });
    }
  }

  return issues;
}

export function getTransactionReviewState(tx: Partial<Transaction>): TransactionReviewState {
  const issues = collectTransactionIssues(tx);
  if (issues.some(issue => issue.severity === 'error')) return 'error';
  if (issues.length > 0) return 'warning';
  return 'ok';
}

export function getIssueSummary(transactions: Transaction[]) {
  const byKind: Record<TransactionIssueKind, number> = {
    'empty-description': 0,
    'invalid-date': 0,
    'zero-amount': 0,
    unclassified: 0,
    'type-mismatch': 0
  };

  let total = 0;
  const issueMap: Record<string, TransactionIssue[]> = {};

  transactions.forEach(tx => {
    const issues = collectTransactionIssues(tx);
    issueMap[tx.id] = issues;
    total += issues.length;
    issues.forEach(issue => {
      byKind[issue.kind] += 1;
    });
  });

  return {
    total,
    byKind,
    issueMap,
    blockingCount: transactions.filter(tx => collectTransactionIssues(tx).some(issue => issue.severity === 'error')).length
  };
}
