import Link from "next/link";
import { fmtDate, fullName, loadAll } from "@/lib/admin";

export const metadata = { title: "Votes | Admin" };

export default async function Votes({ searchParams }: PageProps<"/votes">) {
  const { filter = "all" } = (await searchParams) as { filter?: "all" | "up" | "down" };
  const { profiles, captions, votes, error } = await loadAll();
  const up = votes.filter((v) => v.value > 0).length;
  const rows = votes.filter((v) => filter === "all" || (filter === "up" ? v.value > 0 : v.value < 0));
  const tabs: [string, string, number][] = [
    ["all", "All", votes.length],
    ["up", "👍 Up", up],
    ["down", "👎 Down", votes.length - up],
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">Votes</h1>
      <p className="mt-1 text-sm text-ink/60">Every upvote and downvote, newest first. Read only.</p>
      {error && <p className="mt-4 text-sm text-brick">{error}</p>}

      <div className="mt-6 flex gap-2">
        {tabs.map(([key, label, n]) => (
          <Link
            key={key}
            href={key === "all" ? "/votes" : `/votes?filter=${key}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${filter === key ? "border-ink bg-ink text-white" : "border-ink/30 hover:bg-white"}`}
          >
            {label} <span className="tabular-nums opacity-70">{n}</span>
          </Link>
        ))}
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink/60">
            <tr>
              <th className="px-4 py-2 font-normal">When</th>
              <th className="px-4 py-2 font-normal">Voter</th>
              <th className="px-4 py-2 font-normal">Vote</th>
              <th className="px-4 py-2 font-normal">Caption</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const c = captions.find((x) => x.id === v.caption_id);
              const p = profiles.find((x) => x.id === v.user_id);
              return (
                <tr key={v.id} className="border-b border-ink/5 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink/60">{fmtDate(v.created_at)}</td>
                  <td className="px-4 py-3">
                    {fullName(p)}
                    <span className="block text-xs text-ink/50">{p?.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {v.value > 0 ? <span className="text-navy">👍 Up</span> : <span className="text-brick">👎 Down</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      {c && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image_url} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
                      )}
                      <span className="line-clamp-2">{c?.caption ?? "Deleted caption"}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/60">No votes here yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
