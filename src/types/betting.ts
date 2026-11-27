import type { TransactionStatus } from "./wallet";

export type BettingTransactionType = "income" | "withdrawal";

export type BettingTransactionItem = {
  id: string;
  description: string;
  amountCents: number;
  type: BettingTransactionType;
  dueDate: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
};

export type BettingSummary = {
  currency: string;
  // Neto total general histórico
  totalIncomeCents: number;
  totalWithdrawalCents: number;
  totalNetCents: number; // totalWithdrawalCents - totalIncomeCents
  // Neto diario (fecha seleccionada / hoy)
  dailyIncomeCents: number;
  dailyWithdrawalCents: number;
  dailyNetCents: number; // dailyWithdrawalCents - dailyIncomeCents
  // Totales del mes
  monthlyIncomeCents: number;
  monthlyWithdrawalCents: number;
  monthlyNetCents: number;
  // Pendientes
  pendingIncomeCents: number;
  pendingWithdrawalCents: number;
};
