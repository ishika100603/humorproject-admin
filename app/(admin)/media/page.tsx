import Link from "next/link";
import { fmtDate, loadAll } from "@/lib/admin";
import { computeStats } from "@/lib/stats";
import { CreateForm, DeleteCaption, EditCaption } from "./forms";

export const metadata = { title: "AI media | Admin" };

const SORTS = { new: "Newest", top: "Top score", votes: "Most votes", worst: "Lowest score" } as const;

export default async function Media({ searchParams }: PageProps<"/media">) {
  const { q = "", sort = "new" } = (await searchParams) as { q?: string; sort?: keyof typeof SORTS };
  const { profiles, captions, votes, error } = await loadAll();
  const { scored } = computeStats(profiles, captions, votes);
  let rows = scored.filter((c) => !q || c.caption.toLowerCase().includes(q.toLowerCase()));
  if (sort === "top") rows = rows.sort((a, b) => b.score - a.score);
  if (sort === "votes") rows = rows.sort((a, b) => b.total - a.total);
  if (sort === "worst") rows = rows.sort((a, b) => a.score - b.score);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">AI media</h1>
      <p className="mt-1 text-sm text-ink/60">Every photo and AI caption in the app. Add, edit or delete them here.</p>
      {error && <p className="mt-4 text-sm text-brick">{error}</p>}

      <h2 className="mt-6 text-sm font-medium">Add new media</h2>
      <div className="mt-2">
        <CreateForm />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">
          {rows.length} of {captions.length} captions
        </h2>
        <form className="flex w-full flex-wrap items-center gap-2 text-sm sm:w-auto">
          <input name="q" defaultValue={q} placeholder="Search captions" className="min-w-0 flex-1 rounded-md border border-ink/25 bg-white px-3 py-1.5" />
          <select name="sort" defaultValue={sort} className="rounded-md border border-ink/25 bg-white px-2 py-1.5">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="rounded-md border border-ink px-3 py-1.5 hover:bg-white">Apply</button>
          {(q || sort !== "new") && <Link href="/media" className="text-xs underline">Clear</Link>}
        </form>
      </div>

      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink/60">
            <tr>
              <th className="px-4 py-2 font-normal">Photo</th>
              <th className="px-4 py-2 font-normal">Caption</th>
              <th className="px-4 py-2 font-normal">Model</th>
              <th className="px-4 py-2 font-normal">Votes</th>
              <th className="px-4 py-2 font-normal">Posted</th>
              <th className="px-4 py-2 font-normal" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-ink/5 align-top last:border-0">
                <td className="px-4 py-3">
                  <a href={c.image_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image_url} alt="" className="h-16 w-16 rounded object-cover" />
                  </a>
                </td>
                <td className="w-[40%] px-4 py-3">
                  <EditCaption id={c.id} caption={c.caption} model={c.model} />
                </td>
                <td className="px-4 py-3 text-xs text-ink/60">{c.model ?? "unknown"}</td>
                <td className="px-4 py-3 tabular-nums">
                  <span className={c.score > 0 ? "text-navy" : c.score < 0 ? "text-brick" : ""}>
                    {c.score > 0 ? "+" : ""}
                    {c.score}
                  </span>
                  <span className="block text-xs text-ink/50">
                    {c.up}👍 {c.down}👎
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink/60">{fmtDate(c.created_at)}</td>
                <td className="px-4 py-3">
                  <DeleteCaption id={c.id} votes={c.total} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/60">No captions match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
