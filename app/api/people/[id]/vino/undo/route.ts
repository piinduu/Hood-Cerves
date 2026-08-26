import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastPush } from "@/lib/push";
import { VINO_QUICK_SIZES, resolveLabel } from "@/lib/quickSizes";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lastVino = await prisma.vino.findFirst({
    where: { personId: params.id },
    orderBy: { createdAt: "desc" },
  });

  if (!lastVino) {
    return NextResponse.json({ ok: true, undone: false });
  }

  const [, person] = await Promise.all([
    prisma.vino.delete({ where: { id: lastVino.id } }),
    prisma.person.findUnique({ where: { id: params.id } }),
  ]);

  if (person) {
    const what = resolveLabel(lastVino.liters, lastVino.label, VINO_QUICK_SIZES);
    await broadcastPush({
      title: "Hood Cerves",
      body: `¡${person.name} ha borrado su último vino (${what})!`,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, undone: true });
}
