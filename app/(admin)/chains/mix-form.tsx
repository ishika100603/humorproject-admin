"use client";

import { useActionState, useState } from "react";
import { saveMix, type ActionState } from "./actions";

export default function MixForm({ chains }: { chains: { id: number; name: string; weight: number }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveMix, null);
  const [w, setW] = useState<Record<number, number>>(Object.fromEntries(chains.map((c) => [c.id, c.weight])));
  const total = Object.values(w).reduce((s, x) => s + (Number(x) || 0), 0);
  return (
    <form action={action} className="card mt-5 p-5">
      <p className="text-sm font-medium">Chain mix</p>
      <p className="text-xs text-ink/60">Switch a chain on or off, and set how often each one writes the captions.</p>
      <div className="mt-4 grid gap-3">
        {chains.map((c) => {
          const pct = total ? Math.round(((Number(w[c.id]) || 0) / total) * 100) : 0;
          return (
            <label key={c.id} className="grid grid-cols-[2.75rem_1fr_4.5rem_3rem] items-center gap-3 text-sm sm:grid-cols-[2.75rem_10rem_5rem_1fr_3rem]">
              <button
                type="button"
                role="switch"
                aria-checked={(Number(w[c.id]) || 0) > 0}
                aria-label={`${c.name} ${(Number(w[c.id]) || 0) > 0 ? "on" : "off"}`}
                onClick={() => setW({ ...w, [c.id]: (Number(w[c.id]) || 0) > 0 ? 0 : 1 })}
                className={`relative h-6 w-11 rounded-full transition-colors ${(Number(w[c.id]) || 0) > 0 ? "bg-navy" : "bg-ink/20"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${(Number(w[c.id]) || 0) > 0 ? "left-[22px]" : "left-0.5"}`} />
              </button>
              <span className={`truncate ${(Number(w[c.id]) || 0) > 0 ? "" : "text-ink/40"}`}>{c.name}</span>
              <input
                name={`w_${c.id}`}
                type="number"
                min={0}
                max={1000}
                value={w[c.id] ?? 0}
                onChange={(e) => setW({ ...w, [c.id]: Number(e.target.value) })}
                className="rounded-md border border-ink/25 bg-white px-2 py-1 text-sm"
              />
              <span className="hidden h-2 overflow-hidden rounded-full bg-ink/5 sm:block">
                <span className="block h-full rounded-full bg-navy" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-right text-xs tabular-nums text-ink/60">{pct}%</span>
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button disabled={pending} className="h-9 rounded-md bg-ink px-4 text-sm text-white hover:bg-navy disabled:opacity-50">
          {pending ? "Saving…" : "Save mix"}
        </button>
        {state && <p className={`text-xs ${state.ok ? "text-navy" : "text-brick"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
