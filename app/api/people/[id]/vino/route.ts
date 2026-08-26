import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";
import { VINO_QUICK_SIZES, resolveLabel } from "@/lib/quickSizes";
import { pointsForSingleEntry, VINO_POINTS_MULTIPLIER } from "@/lib/points";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const liters = Number(body?.liters);
  const rawLabel = typeof body?.label === "string" ? body.label.slice(0, 40) : null;

  if (!Number.isFinite(liters) || liters <= 0 || liters > 5) {
    return NextResponse.json(
      { error: "Cantidad de litros inválida" },
      { status: 400 }
    );
  }

  const label = resolveLabel(liters, rawLabel, VINO_QUICK_SIZES);
  const personId = params.id;

  const [vino, person] = await Promise.all([
    prisma.vino.create({ data: { liters, label, personId } }),
    prisma.person.findUnique({ where: { id: personId } }),
  ]);

  if (person) {
    await broadcastPush({
      title: "Hood Cerves",
      body: `🍷 ¡${person.name} se acaba de tomar: ${label}! Puntos x2 (no cuenta como cerveza)`,
    }).catch(() => null);
  }

  return NextResponse.json(
    {
      ...vino,
      pointsEarned: pointsForSingleEntry(liters * VINO_POINTS_MULTIPLIER, vino.createdAt),
    },
    { status: 201 }
  );
}
