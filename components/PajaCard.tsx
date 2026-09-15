"use client";

import { useState } from "react";
import { PeneGlass } from "./PeneGlass";
import { pajaPoints } from "@/lib/pajas";
import type { PersonWithTotal } from "@/lib/types";

export function PajaCard({
  person,
  maxPajas,
  isLeader,
  isLast,
  rank,
  onAdd,
  onUndo,
  onDelete,
}: {
  person: PersonWithTotal;
  maxPajas: number;
  isLeader: boolean;
  isLast: boolean;
  rank: number;
  onAdd: (personId: string) => Promise<void>;
  onUndo: (personId: string) => Promise<void>;
  onDelete: (personId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const ratio = maxPajas > 0 ? person.weekPajas / maxPajas : 0;

  async function run(action: (personId: string) => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await action(person.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `¿Seguro que quieres eliminar a ${person.name}? Ya no podrá beber más cerveza.`
      )
    )
      return;
    await onDelete(person.id);
  }

  return (
    <div className="person-card">
      <div className="jar-col">
        <button className="delete-x" onClick={handleDelete} aria-label="Eliminar">
          ✕
        </button>
        <PeneGlass ratio={ratio} />
        <span className="rank-number">#{rank}</span>
      </div>
      <div className="info-col">
        <div className="card-header-row">
          <p className="person-name">
            {person.name}
            {isLeader && <span className="crown">🐐</span>}
            {isLast && <span className="crown">🏳️‍🌈</span>}
          </p>
          <span className="lifetime-badge" title="Puntos ganados esta semana">
            +{pajaPoints(person.weekPajas)} pts
          </span>
        </div>
        <p className="person-total">
          {person.weekPajas} {person.weekPajas === 1 ? "paja" : "pajas"}
          <span className="person-total-label">Esta semana</span>
        </p>

        <div className="quick-buttons">
          <button disabled={busy} onClick={() => run(onAdd)}>
            🍆 +1 paja
          </button>
        </div>

        <div className="card-actions">
          <button
            className="link-btn undo"
            disabled={busy || !person.lastPajaId}
            onClick={() => run(onUndo)}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
            </svg>
            Deshacer última
          </button>
        </div>
      </div>
    </div>
  );
}
