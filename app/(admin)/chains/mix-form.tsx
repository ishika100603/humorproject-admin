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
      <p className="text-xs text-ink/60">How often each chain writes the captions. Set one to 0 to switch it off.</p>
      <div className="mt-4 grid gap-3">
        {chains.map((c) => {
          const pct = total ? Math.round(((Number(w[c.id]) || 0) / total) * 100) : 0;
          return (
            <label key={c.id} className="grid grid-cols-[10rem_5rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="truncate">{c.name}</span>
              <input
                name={`w_${c.id}`}
                type="number"
                min={0}
                max={1000}
                value={w[c.id] ?? 0}
                onChange={(e) => setW({ ...w, [c.id]: Number(e.target.value) })}
                className="rounded-md border border-ink/25 bg-white px-2 py-1 text-sm"
              />
              <span className="h-2 overflow-hidden rounded-full bg-ink/5">
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
