import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const now = new Date();
  const active = await prisma.stealEvent.findFirst({
    where: { start: { lte: now }, end: { gt: now } },
  });

  if (!active) {
    return NextResponse.json(
      { error: "No hay ninguna hora de robos activa ahora mismo" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const fromPersonId = typeof body?.fromPersonId === "string" ? body.fromPersonId : "";
  const toPersonId = typeof body?.toPersonId === "string" ? body.toPersonId : "";
  const points = Number(body?.points);

  if (!fromPersonId || !toPersonId || fromPersonId === toPersonId) {
    return NextResponse.json({ error: "Datos de robo inválidos" }, { status: 400 });
  }
  if (!Number.isFinite(points) || points <= 0 || points > 100) {
    return NextResponse.json({ error: "Cantidad de puntos inválida" }, { status: 400 });
  }

  const [fromPerson, toPerson] = await Promise.all([
    prisma.person.findUnique({ where: { id: fromPersonId } }),
    prisma.person.findUnique({ where: { id: toPersonId } }),
  ]);

  if (!fromPerson || !toPerson) {
    return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
  }

  await prisma.pointSteal.create({
    data: { fromPersonId, toPersonId, points: Math.round(points) },
  });

  await broadcastPush({
    title: "Hood Cerves",
    body: `¡${fromPerson.name} le acaba de robar ${Math.round(points)} puntos a ${toPerson.name} sin que se entere!`,
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
