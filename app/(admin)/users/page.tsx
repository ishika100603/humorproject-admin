import { fmtDate, fullName, loadAll } from "@/lib/admin";

export const metadata = { title: "Users | Admin" };

export default async function Users() {
  const { profiles, captions, votes, error } = await loadAll();
  const rows = profiles
    .map((p) => {
      const mine = votes.filter((v) => v.user_id === p.id);
      return {
        p,
        votes: mine.length,
        up: mine.filter((v) => v.value > 0).length,
        posted: captions.filter((c) => c.created_by === p.id).length,
        last: mine[0]?.created_at ?? null,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">Users</h1>
      <p className="mt-1 text-sm text-ink/60">Everyone with a profile. Read only.</p>
      {error && <p className="mt-4 text-sm text-brick">{error}</p>}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink/60">
            <tr>
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-4 py-2 font-normal">Email</th>
              <th className="px-4 py-2 font-normal">Joined</th>
              <th className="px-4 py-2 font-normal">Votes</th>
              <th className="px-4 py-2 font-normal">👍 rate</th>
              <th className="px-4 py-2 font-normal">Captions posted</th>
              <th className="px-4 py-2 font-normal">Last vote</th>
              <th className="px-4 py-2 font-normal">Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, votes, up, posted, last }) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tile text-xs">
                        {(p.first_name ?? p.email ?? "?")[0]?.toUpperCase()}
                      </span>
                    )}
                    {fullName(p)}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/70">{p.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink/60">{fmtDate(p.created_at)}</td>
                <td className="px-4 py-3 tabular-nums">{votes}</td>
                <td className="px-4 py-3 tabular-nums">{votes ? `${Math.round((up / votes) * 100)}%` : "–"}</td>
                <td className="px-4 py-3 tabular-nums">{posted}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink/60">{last ? fmtDate(last) : "never"}</td>
                <td className="px-4 py-3">
                  {p.is_superadmin ? (
                    <span className="rounded-full bg-navy px-2 py-0.5 text-xs text-white">Superadmin</span>
                  ) : (
                    <span className="text-xs text-ink/50">User</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
