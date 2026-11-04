import Link from "next/link";
import { fmtDate, loadAll } from "@/lib/admin";
import { computeStats } from "@/lib/stats";
import { DeleteImage } from "../images/forms";
import { AddCaption, CreateForm, DeleteCaption, EditCaption } from "./forms";

export const metadata = { title: "Media | Admin" };

const SORTS = { new: "Newest", top: "Top score", votes: "Most votes", worst: "Lowest score", empty: "No caption yet" } as const;

export default async function Media({ searchParams }: PageProps<"/media">) {
  const { q = "", sort = "new" } = (await searchParams) as { q?: string; sort?: keyof typeof SORTS };
  const { supabase, profiles, captions, votes, error } = await loadAll();
  const { scored } = computeStats(profiles, captions, votes);
  const { data: imageRows } = await supabase.from("images").select("id, url, created_at").range(0, 1999);

  // One card per photo, with every caption written for it
  const photos = new Map<string, { url: string; imageId: number | null; created: string; caps: typeof scored }>();
  for (const img of (imageRows ?? []) as { id: number; url: string; created_at: string }[])
    photos.set(img.url, { url: img.url, imageId: img.id, created: img.created_at, caps: [] });
  for (const c of scored) {
    const p = photos.get(c.image_url) ?? { url: c.image_url, imageId: null, created: c.created_at, caps: [] };
    p.caps.push(c);
    if (c.created_at > p.created) p.created = c.created_at;
    photos.set(c.image_url, p);
  }
  const needle = q.toLowerCase();
  let cards = [...photos.values()].filter((p) => !needle || p.caps.some((c) => c.caption.toLowerCase().includes(needle)));
  const best = (p: { caps: typeof scored }) => Math.max(...p.caps.map((c) => c.score), -Infinity);
  const totalVotes = (p: { caps: typeof scored }) => p.caps.reduce((n, c) => n + c.total, 0);
  if (sort === "new") cards.sort((a, b) => b.created.localeCompare(a.created));
  if (sort === "top") cards.sort((a, b) => best(b) - best(a));
  if (sort === "votes") cards.sort((a, b) => totalVotes(b) - totalVotes(a));
  if (sort === "worst") cards.sort((a, b) => best(a) - best(b));
  if (sort === "empty") cards = cards.filter((p) => p.caps.length === 0);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">Media</h1>
      <p className="mt-1 text-sm text-ink/60">Every photo in the app and the AI captions written for it. Hover a photo to see it uncropped.</p>
      {error && <p className="mt-4 text-sm text-brick">{error}</p>}

      <h2 className="mt-6 text-sm font-medium">Upload a photo</h2>
      <div className="mt-2">
        <CreateForm />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">
          {cards.length} photo{cards.length === 1 ? "" : "s"} · {captions.length} caption{captions.length === 1 ? "" : "s"}
        </h2>
        <form className="flex w-full flex-wrap items-center gap-2 text-sm sm:w-auto">
          <input name="q" defaultValue={q} placeholder="Search captions" className="min-w-0 flex-1 rounded-md border border-ink/25 bg-white px-3 py-1.5" />
          <select name="sort" defaultValue={sort} className="rounded-md border border-ink/25 bg-white px-2 py-1.5">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button className="rounded-md border border-ink px-3 py-1.5 hover:bg-white">Apply</button>
          {(q || sort !== "new") && (
            <Link href="/media" className="text-xs underline">
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((p) => (
          <article key={p.url} className="card overflow-hidden">
            <a href={p.url} target="_blank" rel="noreferrer" className="group block bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" loading="lazy" className="aspect-square w-full object-cover transition-all group-hover:object-contain" />
            </a>
            <div className="grid gap-3 p-4">
              {p.caps.map((c) => (
                <div key={c.id} className="grid gap-1 border-b border-ink/10 pb-3 last:border-0 last:pb-0">
                  <EditCaption id={c.id} caption={c.caption} model={c.model} />
                  <div className="flex items-center justify-between text-xs text-ink/60">
                    <span>
                      <span className={c.score > 0 ? "text-navy" : c.score < 0 ? "text-brick" : ""}>
                        {c.score > 0 ? "+" : ""}
                        {c.score}
                      </span>{" "}
                      · {c.up}👍 {c.down}👎 · {c.model ?? "unknown model"} · {fmtDate(c.created_at)}
                    </span>
                    <DeleteCaption id={c.id} votes={c.total} />
                  </div>
                </div>
              ))}
              {!p.caps.length && <p className="text-xs text-ink/50">No caption yet, so it isn&apos;t in the feed.</p>}
              <div className="flex items-center justify-between">
                <AddCaption imageUrl={p.url} />
                {p.imageId && !p.caps.length && <DeleteImage id={p.imageId} />}
              </div>
            </div>
          </article>
        ))}
        {!cards.length && <p className="text-sm text-ink/60">Nothing matches.</p>}
      </div>
    </div>
  );
}
