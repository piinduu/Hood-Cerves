"use client";

import { useState } from "react";
import type { PersonWithTotal } from "@/lib/types";

export type StealOutcome = {
  success: boolean;
  toPersonId: string;
  points: number;
};

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
  onDone: (outcome: StealOutcome | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const candidates = people.filter((p) => p.id !== fromPersonId);

  async function steal(toPersonId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/steal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromPersonId, toPersonId, points }),
      });
      const data = await res.json().catch(() => null);
      onDone(
        res.ok && data ? { success: Boolean(data.success), toPersonId, points } : null
      );
    } catch {
      onDone(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <p className="modal-title">🎭 ¡Hora de robos!</p>
        <p className="modal-subtitle">
          {fromPersonName} acaba de ganar {points} pts. ¿A quién se los quitas?
        </p>
        <div className="modal-people-list">
          {candidates.map((p) => (
            <button
              key={p.id}
              className="modal-person-btn"
              disabled={busy}
              onClick={() => steal(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button
          className="modal-skip-btn"
          disabled={busy}
          onClick={() => onDone(null)}
        >
          No robar esta vez
        </button>
      </div>
    </div>
  );
}
