"use client";

import { useState } from "react";
import type { PersonWithTotal } from "@/lib/types";

const MIN_SPIN_MS = 900;
const REVEAL_MS = 1800;

type Outcome = { success: boolean; targetName: string };

export function StealModal({
  fromPersonId,
  fromPersonName,
  points,
  people,
  onDone,
}: {
  fromPersonId: string;
  fromPersonName: string;
  points: number;
  people: PersonWithTotal[];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"choose" | "flip" | "reveal">("choose");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const candidates = people.filter((p) => p.id !== fromPersonId);

  async function steal(toPersonId: string, toPersonName: string) {
    if (phase !== "choose") return;
    setPhase("flip");
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/steal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromPersonId, toPersonId, points }),
      });
      const data = await res.json().catch(() => null);
      const success = Boolean(data?.success);

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SPIN_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS - elapsed));
      }

      setOutcome({ success, targetName: toPersonName });
      setPhase("reveal");
      setTimeout(onDone, REVEAL_MS);
    } catch {
      onDone();
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {phase === "choose" && (
          <>
            <p className="modal-title">🎭 ¡Hora de robos!</p>
            <p className="modal-subtitle">
              {fromPersonName} acaba de ganar {points} pts. ¿A quién se los quitas?
            </p>
            <div className="modal-people-list">
              {candidates.map((p) => (
                <button
                  key={p.id}
                  className="modal-person-btn"
                  onClick={() => steal(p.id, p.name)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button className="modal-skip-btn" onClick={onDone}>
              No robar esta vez
            </button>
          </>
        )}

        {phase !== "choose" && (
          <div className="coin-flip-stage">
            <p className="modal-title">🎭 ¡Hora de robos!</p>
            <div
              className={
                phase === "flip"
                  ? "coin coin-spinning"
                  : outcome?.success
                  ? "coin coin-win"
                  : "coin coin-lose"
              }
            >
              <span className="coin-face">
                {phase === "flip" ? "🪙" : outcome?.success ? "😄" : "💀"}
              </span>
            </div>
            {phase === "reveal" && outcome && (
              <p
                className={
                  outcome.success
                    ? "coin-result-text coin-result-win"
                    : "coin-result-text coin-result-lose"
                }
              >
                {outcome.success
                  ? `¡Le has robado ${points} pts a ${outcome.targetName}!`
                  : `¡Cruz! El golpe sale mal y pierdes ${points} pts.`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
