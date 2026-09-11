import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";
import type { StealEvent } from "@prisma/client";

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hora" : `${hours} horas`;
}

/**
 * Busca la "hora de robos" activa (si hay) y, si todavía no se ha
 * avisado, la marca como avisada de forma atómica y manda el push de que
 * ha empezado. El marcado atómico evita un push duplicado si esto se
 * llama a la vez desde el polling del cliente (/api/steal/status) y desde
 * el cron (/api/cron/steal-notify).
 */
export async function announceActiveStealEventIfNeeded(
  now: Date = new Date()
): Promise<{ active: StealEvent | null; notified: boolean }> {
  const active = await prisma.stealEvent.findFirst({
    where: { start: { lte: now }, end: { gt: now } },
  });

  if (!active || active.announced) {
    return { active, notified: false };
  }

  const { count } = await prisma.stealEvent.updateMany({
    where: { id: active.id, announced: false },
    data: { announced: true },
  });

  if (count !== 1) {
    return { active, notified: false };
  }

  const duration = formatDuration(active.end.getTime() - active.start.getTime());
  await broadcastPush({
    title: "Hora de robo de puntos",
    body: `¡Cucarachas, se abre la veda! Bebe y roba puntos antes de que se acabe (dura ${duration}).`,
  }).catch(() => null);

  return { active, notified: true };
}
