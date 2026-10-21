import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_superadmin: boolean;
};
export type Caption = {
  id: number;
  image_url: string;
  caption: string;
  prompt: string | null;
  model: string | null;
  created_by: string | null;
  created_at: string;
};
export type Vote = { id: number; caption_id: number; user_id: string; value: number; created_at: string };

// Second line of defense after proxy.ts (and RLS is the third): every page and
// every server action calls this before touching data.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_superadmin");
  if (isAdmin !== true) redirect("/not-allowed");
  return { supabase, user };
}

export async function loadAll() {
  const { supabase, user } = await requireAdmin();
  const [p, c, v] = await Promise.all([
    supabase.from("profiles").select("id,email,first_name,last_name,avatar_url,created_at,is_superadmin").range(0, 9999),
    supabase.from("captions").select("id,image_url,caption,prompt,model,created_by,created_at").order("created_at", { ascending: false }).range(0, 9999),
    supabase.from("votes").select("id,caption_id,user_id,value,created_at").order("created_at", { ascending: false }).range(0, 9999),
  ]);
  const error = p.error || c.error || v.error;
  return {
    user,
    error: error?.message ?? null,
    profiles: (p.data ?? []) as Profile[],
    captions: (c.data ?? []) as Caption[],
    votes: (v.data ?? []) as Vote[],
  };
}

export const fullName = (p?: Profile) =>
  p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "No name" : "Unknown";

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
