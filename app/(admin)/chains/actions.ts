"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export type ActionState = { ok: boolean; message: string } | null;

// Save how often each chain is picked. Weights are relative: 7 and 3 means 70% and 30%.
export async function saveMix(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const rows: { chain_id: number; weight: number; updated_at: string }[] = [];
  for (const [k, v] of form.entries()) {
    if (!k.startsWith("w_")) continue;
    const weight = Number(v);
    if (!Number.isInteger(weight) || weight < 0 || weight > 1000) return { ok: false, message: "Weights are whole numbers from 0 to 1000." };
    rows.push({ chain_id: Number(k.slice(2)), weight, updated_at: new Date().toISOString() });
  }
  if (!rows.some((r) => r.weight > 0)) return { ok: false, message: "At least one chain needs a weight above 0." };
  const { error } = await supabase.from("prompt_chain_mix").upsert(rows, { onConflict: "chain_id" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/chains");
  return { ok: true, message: "Mix saved. New captions use it right away." };
}
