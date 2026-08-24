import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMadridDateParts } from "@/lib/madridTime";
import { computeRawPoints, litersToPoints, netStolenPoints } from "@/lib/points";
import type { PersonWithTotal } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const [people, steals] = await Promise.all([
    prisma.person.findMany({
      include: {
        drinks: { orderBy: { createdAt: "desc" } },
        cubatas: { orderBy: { createdAt: "desc" } },
        sidras: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pointSteal.findMany(),
  ]);

  const now = getMadridDateParts(new Date());
  const isSameMonth = (createdAt: Date) => {
    const p = getMadridDateParts(new Date(createdAt));
    return p.year === now.year && p.month === now.month;
  };

  function stolenNet(personId: string, monthOnly: boolean): number {
    const relevant = steals.filter((s) =>
      monthOnly ? isSameMonth(s.createdAt) : true
    );
    return netStolenPoints(relevant, personId);
  }

  const result: PersonWithTotal[] = people.map((p) => {
    const allDrinkLike = [...p.drinks, ...p.cubatas, ...p.sidras];
    const monthDrinkLike = allDrinkLike.filter((e) => isSameMonth(e.createdAt));

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
      totalPoints: litersToPoints(computeRawPoints(allDrinkLike)) + stolenNet(p.id, false),
      monthPoints:
        litersToPoints(computeRawPoints(monthDrinkLike)) + stolenNet(p.id, true),
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
