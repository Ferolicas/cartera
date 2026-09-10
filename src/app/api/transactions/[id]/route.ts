import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import {
  forbiddenOrigin,
  invalidRequest,
  isSameOrigin,
  privateJsonHeaders,
} from "@/lib/http";
import { transactionPatchSchema } from "@/lib/validation";

type TransactionContext = { params: Promise<{ id: string }> };

async function validatedId(context: TransactionContext) {
  const { id } = await context.params;
  return z.string().uuid().safeParse(id);
}

export async function PATCH(request: Request, context: TransactionContext) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const [id, body] = await Promise.all([
    validatedId(context),
    request.json().catch(() => null),
  ]);
  const parsed = transactionPatchSchema.safeParse(body);
  if (!id.success || !parsed.success) return invalidRequest();

  try {
    const [updated] = await db
      .update(transactions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(transactions.id, id.data))
      .returning();

    if (!updated) {
      return Response.json({ error: "Movimiento no encontrado" }, { status: 404 });
    }
    return Response.json(updated, { headers: privateJsonHeaders });
  } catch (error) {
    console.error("Error al editar el movimiento", error);
    return Response.json(
      { error: "No se pudo editar el movimiento" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: TransactionContext) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const id = await validatedId(context);
  if (!id.success) return invalidRequest();

  try {
    const [deleted] = await db
      .delete(transactions)
      .where(eq(transactions.id, id.data))
      .returning({ id: transactions.id });

    if (!deleted) {
      return Response.json({ error: "Movimiento no encontrado" }, { status: 404 });
    }
    return Response.json({ ok: true }, { headers: privateJsonHeaders });
  } catch (error) {
    console.error("Error al eliminar el movimiento", error);
    return Response.json(
      { error: "No se pudo eliminar el movimiento" },
      { status: 500 },
    );
  }
}
