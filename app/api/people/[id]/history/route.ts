import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMadridDateParts } from "@/lib/madridTime";

export const dynamic = "force-dynamic";

function buildSeries(
  entries: { liters: number; createdAt: Date }[],
  year: number,
  month: number,
  maxDay: number
) {
  const perDay = new Array(maxDay + 1).fill(0);

  for (const e of entries) {
    const p = getMadridDateParts(new Date(e.createdAt));
    if (p.year === year && p.month === month && p.day <= maxDay) {
      perDay[p.day] += e.liters;
    }
  }

  const data = [];
  for (let day = 1; day <= maxDay; day++) {
    data.push({ day, liters: Number(perDay[day].toFixed(2)) });
  }
  return data;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const type = new URL(req.url).searchParams.get("type") ?? "drink";
  const personId = params.id;

  let entries: { liters: number; createdAt: Date }[];
  if (type === "cubata") {
    entries = await prisma.cubata.findMany({
      where: { personId },
      select: { liters: true, createdAt: true },
    });
  } else {
    entries = await prisma.drink.findMany({
      where: { personId },
      select: { liters: true, createdAt: true },
    });
  }

  const now = getMadridDateParts(new Date());

  let prevMonth = now.month - 1;
  let prevYear = now.year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  const current = buildSeries(entries, now.year, now.month, now.day);
  const previous = buildSeries(entries, prevYear, prevMonth, daysInPrevMonth);

  return NextResponse.json({ current, previous });
}
