export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "settled";

export type TransactionItem = {
  id: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  dueDate: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummary = {
  currentBalanceCents: number;
  currency: string;
  pendingIncomeCents: number;
  pendingExpenseCents: number;
  monthlyIncomeCents: number;
  monthlyExpenseCents: number;
  projectedBalanceCents: number;
};
