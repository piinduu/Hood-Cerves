import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Exporta todos los datos en crudo (protegido por CRON_SECRET) para poder
// migrarlos a otra base de datos, p.ej. al mover el despliegue a un
// proyecto de Vercel nuevo. Uso: GET /api/admin/export?secret=CRON_SECRET
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

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
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
  });
}
