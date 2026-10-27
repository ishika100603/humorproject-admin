"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { RESOURCES } from "@/lib/resources";

export type ActionState = { ok: boolean; message: string } | null;

const clean = (s: FormDataEntryValue | null) => String(s ?? "").replace(/\s*[—–]\s*/g, ", ").trim();

const friendly = (msg: string) =>
  msg.includes("duplicate key") ? "That one already exists." : msg.includes("violates foreign key") ? "Other rows still use this one." : msg;

export async function saveRow(_prev: ActionState, form: FormData): Promise<ActionState> {
  const r = RESOURCES[String(form.get("_resource"))];
  if (!r) return { ok: false, message: "Unknown table." };
  const { supabase } = await requireAdmin();

  const row: Record<string, unknown> = {};
  for (const f of r.fields) {
    if (f.type === "bool") {
      row[f.name] = form.get(f.name) === "on";
      continue;
    }
    let v = clean(form.get(f.name));
    if (f.lower) v = v.toLowerCase();
    if (!v) {
      if (f.required) return { ok: false, message: `${f.label} can't be empty.` };
      row[f.name] = null;
      continue;
    }
    if (f.type === "number" || f.type === "ref") {
      const n = Number(v);
      if (!Number.isFinite(n)) return { ok: false, message: `${f.label} must be a number.` };
      row[f.name] = n;
    } else row[f.name] = v;
  }
  if (r.table === "whitelist_email_addresses" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(row.email)))
    return { ok: false, message: "That isn't an email address." };
  if (r.table === "allowed_signup_domains") {
    row.domain = String(row.domain).replace(/^@/, "");
    if (row.domain !== "*" && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(String(row.domain)))
      return { ok: false, message: "Use a domain like columbia.edu, or * for everyone." };
  }

  const id = Number(form.get("_id"));
  const q = id ? supabase.from(r.table).update(row).eq("id", id).select("id") : supabase.from(r.table).insert(row).select("id");
  const { data, error } = await q;
  if (error) return { ok: false, message: friendly(error.message) };
  if (!data?.length) return { ok: false, message: "Nothing was saved." };
  revalidatePath(r.path);
  return { ok: true, message: id ? "Saved." : `Added the ${r.noun}.` };
}

export async function deleteRow(_prev: ActionState, form: FormData): Promise<ActionState> {
  const r = RESOURCES[String(form.get("_resource"))];
  if (!r) return { ok: false, message: "Unknown table." };
  const { supabase } = await requireAdmin();
  const id = Number(form.get("_id"));
  const { data, error } = await supabase.from(r.table).delete().eq("id", id).select("id");
  if (error) return { ok: false, message: friendly(error.message) };
  if (!data?.length) return { ok: false, message: "Nothing was deleted." };
  revalidatePath(r.path);
  return { ok: true, message: "Deleted." };
}
