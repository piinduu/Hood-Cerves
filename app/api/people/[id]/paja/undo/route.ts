import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";
import { isPajaWeekOpen } from "@/lib/pajas";

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

  const lastPaja = await prisma.paja.findFirst({
    where: { personId: params.id },
    orderBy: { createdAt: "desc" },
  });

  if (!lastPaja) {
    return NextResponse.json({ ok: true, undone: false });
  }

  const [, person] = await Promise.all([
    prisma.paja.delete({ where: { id: lastPaja.id } }),
    prisma.person.findUnique({ where: { id: params.id } }),
  ]);

  if (person) {
    await broadcastPush({
      title: "Hood Cerves",
      body: `¡${person.name} ha borrado su última paja!`,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, undone: true });
}
