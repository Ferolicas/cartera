import { z } from "zod";
import { MAX_AMOUNT_CENTS } from "./money";
import { isCivilDate, periods } from "./periods";

const civilDate = z.string().refine(isCivilDate, "Fecha no válida");

export const loginSchema = z.object({
  password: z.string().min(1).max(256),
});

export const transactionInputSchema = z.object({
  description: z.string().trim().min(1).max(160),
  amountCents: z.number().int().min(1).max(MAX_AMOUNT_CENTS),
  type: z.enum(["income", "expense"]),
  dueDate: civilDate,
  status: z.enum(["pending", "settled"]).default("pending"),
});

export const transactionPatchSchema = transactionInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios");

export const transactionQuerySchema = z.object({
  period: z.enum(periods).default("month"),
  date: civilDate,
  type: z.enum(["all", "income", "expense"]).default("all"),
});

export const balanceSchema = z.object({
  currentBalanceCents: z
    .number()
    .int()
    .min(-MAX_AMOUNT_CENTS)
    .max(MAX_AMOUNT_CENTS),
});
