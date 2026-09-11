import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";

export const dynamic = "force-dynamic";

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hora" : `${hours} horas`;
}

export async function GET() {
  const now = new Date();
  const active = await prisma.stealEvent.findFirst({
    where: { start: { lte: now }, end: { gt: now } },
  });

  if (active && !active.announced) {
    const { count } = await prisma.stealEvent.updateMany({
      where: { id: active.id, announced: false },
      data: { announced: true },
    });

    if (count === 1) {
      const duration = formatDuration(active.end.getTime() - active.start.getTime());
      await broadcastPush({
        title: "Hood Cerves",
        body: `🚨 ¡Empieza la hora de robos! Va a durar ${duration}. ¡Cuidado con vuestros puntos!`,
      }).catch(() => null);
    }
  }

  return NextResponse.json({
    active: Boolean(active),
    endsAt: active?.end ?? null,
  });
}
