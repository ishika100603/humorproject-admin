import { fmtDate, fullName, requireAdmin, type Profile } from "@/lib/admin";
import { ImageCard, UploadForm } from "./forms";

export const metadata = { title: "Images | Admin" };

export default async function Images() {
  const { supabase } = await requireAdmin();
  const [i, p, c] = await Promise.all([
    supabase.from("images").select("id, url, description, uploaded_by, created_at").order("created_at", { ascending: false }).range(0, 999),
    supabase.from("profiles").select("id, email, first_name, last_name").range(0, 9999),
    supabase.from("captions").select("image_url").range(0, 9999),
  ]);
  const images = (i.data ?? []) as { id: number; url: string; description: string | null; uploaded_by: string | null; created_at: string }[];
  const profiles = (p.data ?? []) as Profile[];
  const counts = new Map<string, number>();
  for (const x of (c.data ?? []) as { image_url: string }[]) counts.set(x.image_url, (counts.get(x.image_url) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">Images</h1>
      <p className="mt-1 text-sm text-ink/60">Every photo uploaded to the app. Upload new ones here, edit descriptions, or delete photos with no captions.</p>
      {i.error && <p className="mt-4 text-sm text-brick">{i.error.message}</p>}
      <UploadForm />
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((img) => {
          const n = counts.get(img.url) ?? 0;
          const who = img.uploaded_by ? fullName(profiles.find((x) => x.id === img.uploaded_by)) : "Unknown";
          return <ImageCard key={img.id} id={img.id} url={img.url} description={img.description} meta={`${who} · ${fmtDate(img.created_at)} · ${n} caption${n === 1 ? "" : "s"}`} />;
        })}
      </div>
      <p className="mt-2 text-xs text-ink/40">{images.length} images</p>
    </div>
  );
}
