"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export type ActionState = { ok: boolean; message: string } | null;

const clean = (s: FormDataEntryValue | null) => String(s ?? "").replace(/\s*[—–]\s*/g, ", ").trim();

export async function uploadImage(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  const file = form.get("image");
  const description = clean(form.get("description")) || null;
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Pick a photo." };
  if (!file.type.startsWith("image/")) return { ok: false, message: "That isn't an image." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, message: "Photo is over 5 MB." };

  const path = `admin/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const up = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type });
  if (up.error) return { ok: false, message: `Upload failed: ${up.error.message}` };
  const url = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("images").insert({ url, storage_path: path, description, uploaded_by: user.id });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/images");
  return { ok: true, message: "Uploaded." };
}

export async function updateImage(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = Number(form.get("id"));
  const { data, error } = await supabase
    .from("images")
    .update({ description: clean(form.get("description")) || null })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data?.length) return { ok: false, message: "Nothing was saved." };
  revalidatePath("/images");
  return { ok: true, message: "Saved." };
}

export async function deleteImage(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = Number(form.get("id"));
  const { data: img } = await supabase.from("images").select("url, storage_path").eq("id", id).maybeSingle();
  if (!img) return { ok: false, message: "Image not found." };
  // Photos that already have captions stay, so the feed doesn't break
  const { count } = await supabase.from("captions").select("id", { count: "exact", head: true }).eq("image_url", img.url);
  if (count) return { ok: false, message: `This photo has ${count} caption${count === 1 ? "" : "s"}. Delete those in AI media first.` };
  const { error } = await supabase.from("images").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  if (img.storage_path) await supabase.storage.from("uploads").remove([img.storage_path]);
  revalidatePath("/images");
  return { ok: true, message: "Deleted." };
}
