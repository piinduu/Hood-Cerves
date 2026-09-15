import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";
import { PAJA_POINTS, isPajaWeekOpen } from "@/lib/pajas";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isPajaWeekOpen(new Date())) {
    return NextResponse.json(
      { error: "La semana de las pajas no está activa" },
      { status: 403 }
    );
  }

  const person = await prisma.person.findUnique({ where: { id: params.id } });
  if (!person) {
    return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
  }

  const paja = await prisma.paja.create({ data: { personId: person.id } });

  await broadcastPush({
    title: "Hood Cerves",
    body: `¡${person.name} se acaba de hacer una paja! (+${PAJA_POINTS} pts)`,
  }).catch(() => null);

  return NextResponse.json({ ...paja, pointsEarned: PAJA_POINTS }, { status: 201 });
}
