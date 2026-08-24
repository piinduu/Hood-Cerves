"use client";

import { useCallback, useEffect, useState } from "react";
import { AddPersonForm } from "@/components/AddPersonForm";
import { AnimateButton } from "@/components/AnimateButton";
import { CopaCard } from "@/components/CopaCard";
import { NotificationButton } from "@/components/NotificationButton";
import { PersonCard } from "@/components/PersonCard";
import { PointsBoard } from "@/components/PointsBoard";
import { Podium, type PodiumEntry } from "@/components/Podium";
import { SidraCard } from "@/components/SidraCard";
import { StealModal, type StealOutcome } from "@/components/StealModal";
import { TotalCounter } from "@/components/TotalCounter";
import { getActiveEvent, type WeeklyEvent } from "@/lib/events";
import { formatMadridTime, madridWallClockToUtc } from "@/lib/madridTime";
import { crossedMilestone, pickMilestoneMessage } from "@/lib/milestones";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import type { PersonWithTotal } from "@/lib/types";

const BEER_MILESTONE_STEP_L = 1;
const CUBATA_MILESTONE_STEP_L = 1.5;

const POLL_INTERVAL_MS = 5000;

const SIDRA_UNLOCK_START = madridWallClockToUtc(2026, 8, 28, 0, 0, 0);
const SIDRA_UNLOCK_END = madridWallClockToUtc(2026, 8, 30, 23, 59, 59);

function computePodium(entries: { name: string; liters: number }[]): PodiumEntry[] {
  const positive = entries.filter((e) => e.liters > 0);
  const distinct = Array.from(
    new Set(positive.map((e) => Math.round(e.liters * 100)))
  )
    .sort((a, b) => b - a)
    .slice(0, 3);

  return distinct.map((normalized, idx) => ({
    rank: (idx + 1) as 1 | 2 | 3,
    names: positive
      .filter((e) => Math.round(e.liters * 100) === normalized)
      .map((e) => e.name),
    liters: normalized / 100,
  }));
}

export default function Home() {
  const [people, setPeople] = useState<PersonWithTotal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"cerveza" | "copas" | "sidra" | "puntos">("cerveza");
  const [sidraUnlocked, setSidraUnlocked] = useState(false);
  const [activeEvent, setActiveEvent] = useState<WeeklyEvent | null>(null);
  const [stealPrompt, setStealPrompt] = useState<{
    fromPersonId: string;
    fromPersonName: string;
    points: number;
  } | null>(null);
  const [stealActive, setStealActive] = useState(false);
  const [stealEndsAt, setStealEndsAt] = useState<Date | null>(null);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [stealResult, setStealResult] = useState<{
    success: boolean;
    points: number;
    targetName: string;
  } | null>(null);
  const [milestoneQueue, setMilestoneQueue] = useState<
    { id: string; message: string }[]
  >([]);

  function queueMilestone(
    type: "beer" | "cubata",
    before: number,
    after: number,
    step: number
  ) {
    const milestone = crossedMilestone(before, after, step);
    if (milestone === null) return;
    const message = pickMilestoneMessage(type, milestone);
    setMilestoneQueue((q) => [
      ...q,
      { id: `${Date.now()}-${Math.random()}`, message },
    ]);
  }

  const refresh = useCallback(async () => {
    const res = await fetch("/api/people", { cache: "no-store" });
    if (!res.ok) return null;
    const data: PersonWithTotal[] = await res.json();
    setPeople(data);
    setLoaded(true);
    return data;
  }, []);

  async function maybeOfferSteal(
    personId: string,
    res: Response,
    freshPeople: PersonWithTotal[]
  ) {
    if (!res.ok || !stealActive) return;
    const data = await res.json().catch(() => null);
    const points = data?.pointsEarned;
    if (!points || points <= 0) return;

    const person = freshPeople.find((p) => p.id === personId);
    setStealPrompt({
      fromPersonId: personId,
      fromPersonName: person?.name ?? "Alguien",
      points,
    });
  }

  async function handleStealDone(outcome: StealOutcome | null) {
    setStealPrompt(null);
    const freshPeople = await refresh();
    if (!outcome) return;

    const target = (freshPeople ?? people).find((p) => p.id === outcome.toPersonId);
    setStealResult({
      success: outcome.success,
      points: outcome.points,
      targetName: target?.name ?? "alguien",
    });
    setTimeout(() => setStealResult(null), 4000);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      setSidraUnlocked(
        now >= SIDRA_UNLOCK_START.getTime() && now <= SIDRA_UNLOCK_END.getTime()
      );
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const check = () => setActiveEvent(getActiveEvent(new Date()));
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/steal/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setStealActive(Boolean(data.active));
      setStealEndsAt(data.endsAt ? new Date(data.endsAt) : null);
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!stealActive) return;
    const interval = setInterval(() => setClockTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [stealActive]);

  async function handleAdd(name: string) {
    await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await refresh();
  }

  async function handleDrink(personId: string, liters: number, label?: string) {
    const before = people.find((p) => p.id === personId)?.monthLiters ?? 0;
    const res = await fetch(`/api/people/${personId}/drink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liters, label }),
    });
    const freshPeople = await refresh();
    const after =
      (freshPeople ?? people).find((p) => p.id === personId)?.monthLiters ?? before;
    queueMilestone("beer", before, after, BEER_MILESTONE_STEP_L);
    await maybeOfferSteal(personId, res, freshPeople ?? people);
  }

  async function handleUndo(personId: string) {
    await fetch(`/api/people/${personId}/undo`, { method: "POST" });
    await refresh();
  }

  async function handleCubataAdd(personId: string, liters: number, label?: string) {
    const before = people.find((p) => p.id === personId)?.monthCubataLiters ?? 0;
    const res = await fetch(`/api/people/${personId}/cubata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liters, label }),
    });
    const freshPeople = await refresh();
    const after =
      (freshPeople ?? people).find((p) => p.id === personId)?.monthCubataLiters ??
      before;
    queueMilestone("cubata", before, after, CUBATA_MILESTONE_STEP_L);
    await maybeOfferSteal(personId, res, freshPeople ?? people);
  }

  async function handleCubataUndo(personId: string) {
    await fetch(`/api/people/${personId}/cubata/undo`, { method: "POST" });
    await refresh();
  }

  async function handleSidraAdd(personId: string, liters: number, label?: string) {
    const res = await fetch(`/api/people/${personId}/sidra`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liters, label }),
    });
    const freshPeople = await refresh();
    await maybeOfferSteal(personId, res, freshPeople ?? people);
  }

  async function handleSidraUndo(personId: string) {
    await fetch(`/api/people/${personId}/sidra/undo`, { method: "POST" });
    await refresh();
  }

  async function handleDelete(personId: string) {
    await fetch(`/api/people/${personId}`, { method: "DELETE" });
    await refresh();
  }

  const totalBeerLiters = people.reduce((sum, p) => sum + p.totalLiters, 0);
  const totalCubataLiters = people.reduce(
    (sum, p) => sum + p.totalCubataLiters,
    0
  );
  const totalSidraLiters = people.reduce((sum, p) => sum + p.totalSidraLiters, 0);
  const totalCombinedLiters = totalBeerLiters + totalCubataLiters + totalSidraLiters;

  const maxLiters = people.reduce((max, p) => Math.max(max, p.monthLiters), 0);
  const maxCubataLiters = people.reduce(
    (max, p) => Math.max(max, p.monthCubataLiters),
    0
  );
  const maxSidraLiters = people.reduce(
    (max, p) => Math.max(max, p.monthSidraLiters),
    0
  );

  const normalize = (n: number) => Math.round(n * 100);

  const maxNormalized = normalize(maxLiters);
  const leadersCount = people.filter(
    (p) => normalize(p.monthLiters) === maxNormalized
  ).length;
  const hasSingleLeader = maxNormalized > 0 && leadersCount === 1;

  const maxCubataNormalized = normalize(maxCubataLiters);
  const cubataLeadersCount = people.filter(
    (p) => normalize(p.monthCubataLiters) === maxCubataNormalized
  ).length;
  const hasSingleCubataLeader = maxCubataNormalized > 0 && cubataLeadersCount === 1;

  const maxSidraNormalized = normalize(maxSidraLiters);
  const sidraLeadersCount = people.filter(
    (p) => normalize(p.monthSidraLiters) === maxSidraNormalized
  ).length;
  const hasSingleSidraLeader = maxSidraNormalized > 0 && sidraLeadersCount === 1;

  const minNormalized =
    people.length > 0 ? normalize(Math.min(...people.map((p) => p.monthLiters))) : 0;
  const hasMinSpread = people.length > 0 && minNormalized < maxNormalized;

  const minCubataNormalized =
    people.length > 0
      ? normalize(Math.min(...people.map((p) => p.monthCubataLiters)))
      : 0;
  const hasMinCubataSpread = people.length > 0 && minCubataNormalized < maxCubataNormalized;

  const minSidraNormalized =
    people.length > 0
      ? normalize(Math.min(...people.map((p) => p.monthSidraLiters)))
      : 0;
  const hasMinSidraSpread = people.length > 0 && minSidraNormalized < maxSidraNormalized;

  function rankOf(value: number, allValues: number[]): number {
    const normalized = normalize(value);
    const higherCount = allValues.filter((v) => normalize(v) > normalized).length;
    return higherCount + 1;
  }

  const beerPodium = computePodium(people.map((p) => ({ name: p.name, liters: p.monthLiters })));
  const cubataPodium = computePodium(
    people.map((p) => ({ name: p.name, liters: p.monthCubataLiters }))
  );
  const sidraPodium = computePodium(
    people.map((p) => ({ name: p.name, liters: p.monthSidraLiters }))
  );
  const pointsPodium = computePodium(
    people.map((p) => ({ name: p.name, liters: p.monthPoints }))
  );

  const pointsRanked = [...people]
    .sort((a, b) => b.monthPoints - a.monthPoints)
    .map((person) => ({
      person,
      rank: rankOf(
        person.monthPoints,
        people.map((p) => p.monthPoints)
      ),
    }));

  const stealSecondsLeft = stealEndsAt
    ? Math.max(0, Math.round((stealEndsAt.getTime() - clockTick) / 1000))
    : 0;
  const stealTimeLeft = `${Math.floor(stealSecondsLeft / 60)
    .toString()
    .padStart(2, "0")}:${(stealSecondsLeft % 60).toString().padStart(2, "0")}`;

  return (
    <main className={stealActive ? "steal-mode" : ""}>
      {stealActive && <div className="steal-vignette" />}
      {milestoneQueue[0] && (
        <MilestoneCelebration
          key={milestoneQueue[0].id}
          message={milestoneQueue[0].message}
          onDone={() => setMilestoneQueue((q) => q.slice(1))}
        />
      )}
      <header className="app-header">
        <div className="logo-circle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Hood Cerves" />
        </div>
        <div>
          <div className="title-wrap">
            <h1>HOOD CERVES</h1>
          </div>
          <p className="subtitle">Marcador de birras de Hood</p>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === "cerveza" ? "active" : ""}`}
          onClick={() => setTab("cerveza")}
        >
          Cervezas
        </button>
        <button
          className={`tab-btn ${tab === "copas" ? "active" : ""}`}
          onClick={() => setTab("copas")}
        >
          Copas
        </button>
        <button
          className={`tab-btn ${tab === "sidra" ? "active" : ""}`}
          onClick={() => setTab("sidra")}
        >
          Sidras {!sidraUnlocked && "🔒"}
        </button>
        <button
          className={`tab-btn ${tab === "puntos" ? "active" : ""}`}
          onClick={() => setTab("puntos")}
        >
          🏆 Puntos
        </button>
      </div>

      {stealActive && (
        <div className="steal-banner">
          <span className="steal-banner-emoji">🚨</span>
          <div>
            <p className="steal-banner-title">¡Hora de robos activa!</p>
            <p className="steal-banner-detail">
              Quedan {stealTimeLeft} — cuidado con tus puntos.
            </p>
          </div>
        </div>
      )}

      {stealResult && (
        <div
          className={`steal-result-banner ${
            stealResult.success ? "steal-result-success" : "steal-result-fail"
          }`}
        >
          <span className="steal-banner-emoji">
            {stealResult.success ? "🎉" : "💀"}
          </span>
          <div>
            <p className="steal-banner-title">
              {stealResult.success ? "¡Robo conseguido!" : "¡El robo salió mal!"}
            </p>
            <p className="steal-banner-detail">
              {stealResult.success
                ? `Le quitas ${stealResult.points} pts a ${stealResult.targetName}.`
                : `Pierdes ${stealResult.points} pts por intentarlo.`}
            </p>
          </div>
        </div>
      )}

      {tab === "cerveza" && (
        <>
          <TotalCounter totalLiters={totalBeerLiters} label="Total cerveza" />
          <TotalCounter totalLiters={totalCombinedLiters} label="Total del grupo" />

          <div className="animate-row">
            <AnimateButton />
          </div>

          <Podium entries={beerPodium} />

          <div className="export-row">
            <NotificationButton />
            <a href="/api/export" download>
              Exportar a Excel
            </a>
          </div>

          <AddPersonForm onAdd={handleAdd} />

          {loaded && people.length === 0 && (
            <p className="empty-state">Nadie apuntado todavía. ¡Añade a alguien!</p>
          )}

          <div className="people-grid">
            {people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                maxLiters={maxLiters}
                isLeader={
                  hasSingleLeader && normalize(person.monthLiters) === maxNormalized
                }
                isLast={hasMinSpread && normalize(person.monthLiters) === minNormalized}
                rank={rankOf(
                  person.monthLiters,
                  people.map((p) => p.monthLiters)
                )}
                onDrink={handleDrink}
                onUndo={handleUndo}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {tab === "copas" && (
        <>
          <TotalCounter totalLiters={totalCubataLiters} label="Total cubatas" />
          <TotalCounter totalLiters={totalCombinedLiters} label="Total del grupo" />

          <Podium entries={cubataPodium} />

          <AddPersonForm onAdd={handleAdd} />

          {loaded && people.length === 0 && (
            <p className="empty-state">Nadie apuntado todavía. ¡Añade a alguien!</p>
          )}

          <div className="people-grid">
            {people.map((person) => (
              <CopaCard
                key={person.id}
                person={person}
                maxLiters={maxCubataLiters}
                isLeader={
                  hasSingleCubataLeader &&
                  normalize(person.monthCubataLiters) === maxCubataNormalized
                }
                isLast={
                  hasMinCubataSpread &&
                  normalize(person.monthCubataLiters) === minCubataNormalized
                }
                rank={rankOf(
                  person.monthCubataLiters,
                  people.map((p) => p.monthCubataLiters)
                )}
                onDrink={handleCubataAdd}
                onUndo={handleCubataUndo}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {tab === "sidra" && !sidraUnlocked && (
        <div className="locked-panel">
          <span className="locked-emoji">🔒🍏</span>
          <p className="locked-title">Sección bloqueada</p>
          <p>Disponible del 28 al 30 de agosto. ¡Vuelve por aquí esos días!</p>
        </div>
      )}

      {tab === "sidra" && sidraUnlocked && (
        <>
          <TotalCounter totalLiters={totalSidraLiters} label="Total sidras" />
          <TotalCounter totalLiters={totalCombinedLiters} label="Total del grupo" />

          <Podium entries={sidraPodium} />

          <AddPersonForm onAdd={handleAdd} />

          {loaded && people.length === 0 && (
            <p className="empty-state">Nadie apuntado todavía. ¡Añade a alguien!</p>
          )}

          <div className="people-grid">
            {people.map((person) => (
              <SidraCard
                key={person.id}
                person={person}
                maxLiters={maxSidraLiters}
                isLeader={
                  hasSingleSidraLeader &&
                  normalize(person.monthSidraLiters) === maxSidraNormalized
                }
                isLast={
                  hasMinSidraSpread &&
                  normalize(person.monthSidraLiters) === minSidraNormalized
                }
                rank={rankOf(
                  person.monthSidraLiters,
                  people.map((p) => p.monthSidraLiters)
                )}
                onDrink={handleSidraAdd}
                onUndo={handleSidraUndo}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {tab === "puntos" && (
        <>
          <p className="points-explainer">
            Puntuación aparte de los litros reales: cada 100 mL bebidos
            (cerveza, cubata o sidra) son 1 punto, redondeado siempre hacia
            abajo (un tercio, 3 pts; una litrona, 10 pts), y durante los
            eventos temáticos esos puntos se multiplican. Se reinician cada
            mes. No afecta al total de litros.
          </p>

          {activeEvent && (
            <div className="event-banner">
              <span className="event-emoji">🔥</span>
              <div>
                <p className="event-title">{activeEvent.label}</p>
                <p className="event-detail">
                  Cervezas x{activeEvent.multiplier} hasta las{" "}
                  {formatMadridTime(activeEvent.end)}
                </p>
              </div>
            </div>
          )}

          <Podium entries={pointsPodium} unit=" pts" decimals={0} />

          {loaded && people.length === 0 && (
            <p className="empty-state">Nadie apuntado todavía. ¡Añade a alguien!</p>
          )}

          <PointsBoard entries={pointsRanked} />
        </>
      )}

      {stealPrompt && (
        <StealModal
          fromPersonId={stealPrompt.fromPersonId}
          fromPersonName={stealPrompt.fromPersonName}
          points={stealPrompt.points}
          people={people}
          onDone={handleStealDone}
        />
      )}
    </main>
  );
}
