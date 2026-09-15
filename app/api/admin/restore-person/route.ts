import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

type BackupSnapshot = {
  takenAt: string;
  people: {
    name: string;
    drinks: { liters: number; label: string | null; createdAt: string }[];
    cubatas: { liters: number; label: string | null; createdAt: string }[];
    sidras?: { liters: number; label: string | null; createdAt: string }[];
    pajas?: { createdAt: string }[];
  }[];
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const name = new URL(req.url).searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Falta el parámetro ?name=NombreDeLaPersona" },
      { status: 400 }
    );
  }

  const latestBackup = await prisma.backup.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latestBackup) {
    return NextResponse.json(
      { error: "No hay ninguna copia de seguridad todavía" },
      { status: 404 }
    );
  }

  const snapshot: BackupSnapshot = JSON.parse(latestBackup.data);
  const found = snapshot.people.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );

  if (!found) {
    return NextResponse.json(
      {
        error: `"${name}" no aparece en la copia de seguridad del ${snapshot.takenAt}`,
      },
      { status: 404 }
    );
  }

  let person = await prisma.person.findFirst({ where: { name: found.name } });
  if (!person) {
    person = await prisma.person.create({ data: { name: found.name } });
  }

  const createdDrinks = await Promise.all(
    found.drinks.map((d) =>
      prisma.drink.create({
        data: {
          personId: person!.id,
          liters: d.liters,
          label: d.label,
          createdAt: new Date(d.createdAt),
        },
      })
    )
  );

  const createdCubatas = await Promise.all(
    found.cubatas.map((c) =>
      prisma.cubata.create({
        data: {
          personId: person!.id,
          liters: c.liters,
          label: c.label,
          createdAt: new Date(c.createdAt),
        },
      })
    )
  );

  const createdSidras = await Promise.all(
    (found.sidras ?? []).map((s) =>
      prisma.sidra.create({
        data: {
          personId: person!.id,
          liters: s.liters,
          label: s.label,
          createdAt: new Date(s.createdAt),
        },
      })
    )
  );

  const createdPajas = await Promise.all(
    (found.pajas ?? []).map((j) =>
      prisma.paja.create({
        data: { personId: person!.id, createdAt: new Date(j.createdAt) },
      })
    )
  );

  return NextResponse.json({
    ok: true,
    restoredFrom: snapshot.takenAt,
    personId: person.id,
    drinksCreated: createdDrinks.length,
    cubatasCreated: createdCubatas.length,
    sidrasCreated: createdSidras.length,
    pajasCreated: createdPajas.length,
  });
}
