import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";
import { computeRawPoints, litersToPoints } from "@/lib/points";
import { getMadridDateParts } from "@/lib/madridTime";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

function formatLiters(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = MONTH_NAMES[start.getMonth()];

  const [drinks, cubatas, sidras, steals] = await Promise.all([
    prisma.drink.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { person: true },
    }),
    prisma.cubata.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { person: true },
    }),
    prisma.sidra.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { person: true },
    }),
    prisma.pointSteal.findMany({
      where: { createdAt: { gte: start, lt: end } },
    }),
  ]);

  const allEntries = [...drinks, ...cubatas, ...sidras];

  if (allEntries.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: "Sin bebidas ese mes" });
  }

  const byPerson = new Map<
    string,
    { name: string; entries: { liters: number; createdAt: Date }[] }
  >();
  for (const e of allEntries) {
    const entry = byPerson.get(e.personId) ?? { name: e.person.name, entries: [] };
    entry.entries.push({ liters: e.liters, createdAt: e.createdAt });
    byPerson.set(e.personId, entry);
  }

  const ranking = Array.from(byPerson.entries()).map(([personId, data]) => {
    const stolenIn = steals
      .filter((s) => s.toPersonId === personId)
      .reduce((sum, s) => sum + s.points, 0);
    const stolenOut = steals
      .filter((s) => s.fromPersonId === personId)
      .reduce((sum, s) => sum + s.points, 0);
    const points = litersToPoints(computeRawPoints(data.entries)) + stolenIn - stolenOut;
    return { name: data.name, points };
  });
  ranking.sort((a, b) => b.points - a.points);

  const distinctScores = Array.from(new Set(ranking.map((r) => r.points))).sort(
    (a, b) => b - a
  );
  const podiumScores = distinctScores.slice(0, 3);

  let body = `Así queda el podio de ${monthName}`;
  podiumScores.forEach((score, i) => {
    const names = ranking.filter((r) => r.points === score).map((r) => r.name);
    body += `\n${MEDALS[i]} ${joinNames(names)} – ${score} pts`;
  });

  const topScore = distinctScores[0];
  const bottomScore = distinctScores[distinctScores.length - 1];
  if (bottomScore !== topScore) {
    const losers = ranking.filter((r) => r.points === bottomScore).map((r) => r.name);
    const loserVerb = losers.length > 1 ? "son" : "es";
    const loserNoun = losers.length > 1 ? "Los pussys" : "El pussy";
    body += `\n\n${loserNoun} del mes ${loserVerb} ${joinNames(
      losers
    )} con solo ${bottomScore} pts.`;
  }

  await broadcastPush({ title: "Hood Cerves - Resumen mensual", body });

  const dayMap = new Map<string, { day: number; month: number; liters: number }>();
  for (const e of allEntries) {
    const { month, day } = getMadridDateParts(new Date(e.createdAt));
    const key = `${month}-${day}`;
    const entry = dayMap.get(key) ?? { day, month, liters: 0 };
    entry.liters += e.liters;
    dayMap.set(key, entry);
  }

  let bestDay: { day: number; month: number; liters: number } | null = null;
  for (const v of dayMap.values()) {
    if (!bestDay || v.liters > bestDay.liters) bestDay = v;
  }

  if (bestDay) {
    const dayBody = `📅 El día que más se bebió fue el ${bestDay.day} de ${
      MONTH_NAMES[bestDay.month]
    }, con ${formatLiters(bestDay.liters)} L en total.`;
    await broadcastPush({ title: "Hood Cerves - Resumen mensual", body: dayBody });
  }

  return NextResponse.json({ ok: true, sent: true, ranking });
}
