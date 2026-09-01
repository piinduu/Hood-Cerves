import { NextRequest, NextResponse } from "next/server";
import { announceActiveStealEventIfNeeded } from "@/lib/stealAnnounce";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

/**
 * No está pensado para Vercel Cron (limitado a 1 vez al día en el plan
 * gratuito) sino para que lo llame un ping externo gratuito (p.ej.
 * cron-job.org) cada pocos minutos: así el aviso de "empieza la hora de
 * robos" llega de sorpresa, sin depender de que alguien tenga la app
 * abierta justo en ese momento.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { active, notified } = await announceActiveStealEventIfNeeded();

  return NextResponse.json({ active: Boolean(active), notified });
}
