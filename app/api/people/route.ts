import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";
import { getMadridDateParts } from "@/lib/madridTime";
import { computeRawPoints, litersToPoints, VINO_POINTS_MULTIPLIER } from "@/lib/points";
import { SIDRA_WEEKEND_START, SIDRA_WEEKEND_END } from "@/lib/sidraWeekend";
import type { PersonWithTotal } from "@/lib/types";

export const dynamic = "force-dynamic";

const WEEKEND_ANNOUNCEMENT_KEY = "sidra-vino-weekend-2026-08-28";

// Anuncia el finde de sidras/vino la primera vez que alguien abre la app
// pasadas las 00:00 del viernes — sin cron, aprovechando que esta ruta ya
// se sondea cada 5s desde el cliente. La clave única en Announcement evita
// duplicados aunque varias personas la disparen a la vez.
async function announceWeekendIfDue() {
  const now = Date.now();
  if (now < SIDRA_WEEKEND_START.getTime() || now > SIDRA_WEEKEND_END.getTime()) {
    return;
  }

  try {
    await prisma.announcement.create({ data: { key: WEEKEND_ANNOUNCEMENT_KEY } });
  } catch {
    return;
  }

  await broadcastPush({
    title: "Hood Cerves",
    body: "🍏🍷 ¡Ya es viernes! Sidras desbloqueadas y los vinos cuentan x2 en puntos todo el finde.",
  }).catch(() => null);
}

export async function GET() {
  const [people, steals] = await Promise.all([
    prisma.person.findMany({
      include: {
        drinks: { orderBy: { createdAt: "desc" } },
        cubatas: { orderBy: { createdAt: "desc" } },
        sidras: { orderBy: { createdAt: "desc" } },
        vinos: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pointSteal.findMany(),
  ]);

  await announceWeekendIfDue();

  const now = getMadridDateParts(new Date());
  const isSameMonth = (createdAt: Date) => {
    const p = getMadridDateParts(new Date(createdAt));
    return p.year === now.year && p.month === now.month;
  };

  function stolenNet(personId: string, monthOnly: boolean): number {
    const relevant = steals.filter((s) =>
      monthOnly ? isSameMonth(s.createdAt) : true
    );
    const stolenIn = relevant
      .filter((s) => s.toPersonId === personId)
      .reduce((sum, s) => sum + s.points, 0);
    const stolenOut = relevant
      .filter((s) => s.fromPersonId === personId)
      .reduce((sum, s) => sum + s.points, 0);
    return stolenIn - stolenOut;
  }

  const result: PersonWithTotal[] = people.map((p) => {
    const allDrinkLike = [...p.drinks, ...p.cubatas, ...p.sidras];
    const monthDrinkLike = allDrinkLike.filter((e) => isSameMonth(e.createdAt));

    // El vino no suma litros a ningún ranking: solo aporta puntos, al doble,
    // así que se pasa por computeRawPoints como si fueran el doble de litros.
    const monthVinos = p.vinos.filter((v) => isSameMonth(v.createdAt));
    const vinoRawPointsAll = computeRawPoints(
      p.vinos.map((v) => ({ liters: v.liters * VINO_POINTS_MULTIPLIER, createdAt: v.createdAt }))
    );
    const vinoRawPointsMonth = computeRawPoints(
      monthVinos.map((v) => ({ liters: v.liters * VINO_POINTS_MULTIPLIER, createdAt: v.createdAt }))
    );

    return {
      id: p.id,
      name: p.name,
      totalLiters: p.drinks.reduce((sum, d) => sum + d.liters, 0),
      monthLiters: p.drinks
        .filter((d) => isSameMonth(d.createdAt))
        .reduce((sum, d) => sum + d.liters, 0),
      lastDrinkId: p.drinks[0]?.id ?? null,
      totalCubataLiters: p.cubatas.reduce((sum, c) => sum + c.liters, 0),
      monthCubataLiters: p.cubatas
        .filter((c) => isSameMonth(c.createdAt))
        .reduce((sum, c) => sum + c.liters, 0),
      lastCubataId: p.cubatas[0]?.id ?? null,
      totalSidraLiters: p.sidras.reduce((sum, s) => sum + s.liters, 0),
      monthSidraLiters: p.sidras
        .filter((s) => isSameMonth(s.createdAt))
        .reduce((sum, s) => sum + s.liters, 0),
      lastSidraId: p.sidras[0]?.id ?? null,
      lastVinoId: p.vinos[0]?.id ?? null,
      totalPoints:
        litersToPoints(computeRawPoints(allDrinkLike) + vinoRawPointsAll) +
        stolenNet(p.id, false),
      monthPoints:
        litersToPoints(computeRawPoints(monthDrinkLike) + vinoRawPointsMonth) +
        stolenNet(p.id, true),
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name || name.length > 40) {
    return NextResponse.json(
      { error: "Nombre inválido" },
      { status: 400 }
    );
  }

  const person = await prisma.person.create({ data: { name } });

  return NextResponse.json(person, { status: 201 });
}
