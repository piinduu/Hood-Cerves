import { NextResponse } from "next/server";
import { announceActiveStealEventIfNeeded } from "@/lib/stealAnnounce";

export const dynamic = "force-dynamic";

export async function GET() {
  const { active } = await announceActiveStealEventIfNeeded();

  return NextResponse.json({
    active: Boolean(active),
    endsAt: active?.end ?? null,
  });
}
