"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export type ActionState = { ok: boolean; message: string } | null;

const clean = (s: FormDataEntryValue | null) => String(s ?? "").replace(/\s*[—–]\s*/g, ", ").trim();

export async function createMedia(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  const file = form.get("image");
  const caption = clean(form.get("caption"));
  const model = clean(form.get("model")) || "admin";
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Pick a photo." };
  if (!file.type.startsWith("image/")) return { ok: false, message: "That isn't an image." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, message: "Photo is over 5 MB." };
  if (!caption) return { ok: false, message: "Write a caption." };

  const path = `admin/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const up = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type });
  if (up.error) return { ok: false, message: `Upload failed: ${up.error.message}` };
  const image_url = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;

  const { error } = await supabase.from("captions").insert({ image_url, caption, model, created_by: user.id, prompt: "Added by an admin" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/media");
  revalidatePath("/");
  return { ok: true, message: "Added. It's live in the app's feed." };
}

export async function updateCaption(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = Number(form.get("id"));
  const caption = clean(form.get("caption"));
  const model = clean(form.get("model"));
  if (!id || !caption) return { ok: false, message: "Caption can't be empty." };
  const { data, error } = await supabase
    .from("captions")
    .update({ caption, ...(model ? { model } : {}) })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Nothing was updated." };
  revalidatePath("/media");
  return { ok: true, message: "Saved." };
}

export async function deleteCaption(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = Number(form.get("id"));
  // Votes on it are removed too (ON DELETE CASCADE)
  const { data, error } = await supabase.from("captions").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Nothing was deleted." };
  revalidatePath("/media");
  revalidatePath("/");
  return { ok: true, message: "Deleted." };
}
