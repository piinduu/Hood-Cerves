import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";
import { SIDRA_QUICK_SIZES, resolveLabel } from "@/lib/quickSizes";
import { badgeEmojiSuffix, getBadgesCrossed } from "@/lib/badges";
import { getDailyMilestonesCrossed } from "@/lib/dailyMilestones";
import { getMadridDateParts } from "@/lib/madridTime";
import { pointsForSingleEntry } from "@/lib/points";

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

  const label = resolveLabel(liters, rawLabel, SIDRA_QUICK_SIZES);
  const personId = params.id;

  const [existingSidras, person] = await Promise.all([
    prisma.sidra.findMany({
      where: { personId },
      select: { liters: true, createdAt: true },
    }),
    prisma.person.findUnique({ where: { id: personId } }),
  ]);

  const nowParts = getMadridDateParts(new Date());

  const prevMonthTotal = existingSidras
    .filter((s) => {
      const p = getMadridDateParts(s.createdAt);
      return p.year === nowParts.year && p.month === nowParts.month;
    })
    .reduce((sum, s) => sum + s.liters, 0);

  const prevDayTotal = existingSidras
    .filter((s) => {
      const p = getMadridDateParts(s.createdAt);
      return (
        p.year === nowParts.year &&
        p.month === nowParts.month &&
        p.day === nowParts.day
      );
    })
    .reduce((sum, s) => sum + s.liters, 0);

  const sidra = await prisma.sidra.create({
    data: { liters, label, personId },
  });

  const newMonthTotal = prevMonthTotal + liters;
  const newDayTotal = prevDayTotal + liters;

  if (person) {
    await broadcastPush({
      title: "Hood Cerves",
      body: `¡${person.name} se acaba de tomar: ${label}!`,
    }).catch(() => null);

    const crossedBadges = getBadgesCrossed(prevMonthTotal, newMonthTotal);
    for (const badge of crossedBadges) {
      await broadcastPush({
        title: "Hood Cerves",
        body: `¡${person.name} acaba de conseguir un ${badge.name.toUpperCase()} (Sidras)!${badgeEmojiSuffix(
          badge.name
        )}`,
      }).catch(() => null);
    }

    const crossedMilestones = getDailyMilestonesCrossed(prevDayTotal, newDayTotal);
    for (const milestone of crossedMilestones) {
      const unit = milestone.liters === 1 ? "litro" : "litros";
      await broadcastPush({
        title: "Hood Cerves",
        body: `${person.name} acaba de beberse ${milestone.liters} ${unit} de sidra, ${milestone.message}`,
      }).catch(() => null);
    }
  }

  return NextResponse.json(
    { ...sidra, pointsEarned: pointsForSingleEntry(liters, sidra.createdAt) },
    { status: 201 }
  );
}
