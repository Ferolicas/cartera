import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bettingTransactions } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import {
  forbiddenOrigin,
  invalidRequest,
  isSameOrigin,
  privateJsonHeaders,
} from "@/lib/http";
import { bettingTransactionPatchSchema } from "@/lib/validation";

type BettingContext = { params: Promise<{ id: string }> };

async function validatedId(context: BettingContext) {
  const { id } = await context.params;
  return z.string().uuid().safeParse(id);
}

export async function PATCH(request: Request, context: BettingContext) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const [id, body] = await Promise.all([
    validatedId(context),
    request.json().catch(() => null),
  ]);
  const parsed = bettingTransactionPatchSchema.safeParse(body);
  if (!id.success || !parsed.success) return invalidRequest();

  try {
    const [updated] = await db
      .update(bettingTransactions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(bettingTransactions.id, id.data))
      .returning();

    if (!updated) {
      return Response.json({ error: "Movimiento de apuestas no encontrado" }, { status: 404 });
    }
    return Response.json(updated, { headers: privateJsonHeaders });
  } catch (error) {
    console.error("Error al editar el movimiento de apuestas", error);
    return Response.json(
      { error: "No se pudo editar el movimiento de apuestas" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: BettingContext) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const id = await validatedId(context);
  if (!id.success) return invalidRequest();

  try {
    const [deleted] = await db
      .delete(bettingTransactions)
      .where(eq(bettingTransactions.id, id.data))
      .returning({ id: bettingTransactions.id });

    if (!deleted) {
      return Response.json({ error: "Movimiento de apuestas no encontrado" }, { status: 404 });
    }
    return Response.json({ ok: true }, { headers: privateJsonHeaders });
  } catch (error) {
    console.error("Error al eliminar el movimiento de apuestas", error);
    return Response.json(
      { error: "No se pudo eliminar el movimiento de apuestas" },
      { status: 500 },
    );
  }
}
