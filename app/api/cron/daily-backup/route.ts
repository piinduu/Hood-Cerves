import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMadridDateParts, madridWallClockToUtc } from "@/lib/madridTime";
import { pickWeightedStealHour, stealEventDayOffset } from "@/lib/stealSchedule";

export const dynamic = "force-dynamic";

const KEEP_DAYS = 30;

// Probabilidad de que cualquier día dado tenga "hora de robos", y las
// duraciones posibles (en minutos) entre las que se elige al azar si toca.
// Máximo 30 min: son momentos puntuales del día, no una franja larga.
const STEAL_EVENT_CHANCE = 0.35;
const STEAL_DURATIONS_MIN = [10, 15, 20, 30];

async function maybeScheduleStealEvent() {
  // Si este cron se dispara dos veces el mismo día (reintento de Vercel,
  // doble ping externo...), que no se programen dos horas de robos
  // independientes: si ya se creó una hoy, no se vuelve a sortear.
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const alreadyScheduledToday = await prisma.stealEvent.findFirst({
    where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
  });
  if (alreadyScheduledToday) {
    return { scheduled: false };
  }

  if (Math.random() >= STEAL_EVENT_CHANCE) {
    return { scheduled: false };
  }

  const now = getMadridDateParts(new Date());
  // Puede caer a cualquier hora del día, pero con más peso entre las 17:00
  // y las 02:00 (la franja de fiesta típica) — ver lib/stealSchedule.ts.
  const startHour = pickWeightedStealHour();
  const startMinute = Math.floor(Math.random() * 60);
  const durationMin =
    STEAL_DURATIONS_MIN[Math.floor(Math.random() * STEAL_DURATIONS_MIN.length)];

  const start = madridWallClockToUtc(
    now.year,
    now.month + 1,
    now.day + stealEventDayOffset(startHour),
    startHour,
    startMinute,
    0
  );
  const end = new Date(start.getTime() + durationMin * 60000);

  await prisma.stealEvent.create({ data: { start, end } });

  // Sin aviso previo a propósito: nadie debe saber que hoy toca ni a qué
  // hora hasta que la hora de robos empieza de verdad (ver
  // lib/stealAnnounce.ts, que dispara el push justo en ese momento).
  return { scheduled: true, start, end, durationMin };
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const people = await prisma.person.findMany({
    include: {
      drinks: { orderBy: { createdAt: "asc" } },
      cubatas: { orderBy: { createdAt: "asc" } },
      sidras: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const snapshot = {
    takenAt: new Date().toISOString(),
    people: people.map((p) => ({
      name: p.name,
      createdAt: p.createdAt,
      drinks: p.drinks.map((d) => ({
        liters: d.liters,
        label: d.label,
        createdAt: d.createdAt,
      })),
      cubatas: p.cubatas.map((c) => ({
        liters: c.liters,
        label: c.label,
        createdAt: c.createdAt,
      })),
      sidras: p.sidras.map((s) => ({
        liters: s.liters,
        label: s.label,
        createdAt: s.createdAt,
      })),
    })),
  };

  await prisma.backup.create({ data: { data: JSON.stringify(snapshot) } });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  await prisma.backup.deleteMany({ where: { createdAt: { lt: cutoff } } });

  const stealEvent = await maybeScheduleStealEvent();

  return NextResponse.json({ ok: true, peopleBackedUp: people.length, stealEvent });
}
