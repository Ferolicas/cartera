import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import {
  forbiddenOrigin,
  invalidRequest,
  isSameOrigin,
  privateJsonHeaders,
} from "@/lib/http";
import { balanceSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const parsed = balanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidRequest("El saldo no es válido");

  try {
    const [updated] = await db
      .insert(settings)
      .values({ id: 1, currentBalanceCents: parsed.data.currentBalanceCents })
      .onConflictDoUpdate({
        target: settings.id,
        set: {
          currentBalanceCents: parsed.data.currentBalanceCents,
          updatedAt: new Date(),
        },
      })
      .returning();

    return Response.json(updated, { headers: privateJsonHeaders });
  } catch (error) {
    console.error("Error al actualizar el saldo", error);
    return Response.json(
      { error: "No se pudo actualizar el saldo" },
      { status: 500 },
    );
  }
}
