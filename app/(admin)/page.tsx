import { fullName, loadAll } from "@/lib/admin";
import { computeStats } from "@/lib/stats";

export const metadata = { title: "Dashboard | Admin" };

const UP = "#1d4f91";
const DOWN = "#b3261e";

function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-xs text-ink/60">{label}</p>
      <p className="mt-1 text-3xl font-medium tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-ink/50">{note}</p>}
    </div>
  );
}

function CaptionRow({ c, metric }: { c: { image_url: string; caption: string; up: number; down: number }; metric: string }) {
  return (
    <li className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.image_url} alt="" className="h-11 w-11 shrink-0 rounded object-cover" />
      <span className="line-clamp-2 flex-1 text-sm leading-snug">{c.caption}</span>
      <span className="shrink-0 text-xs tabular-nums text-ink/60">{metric}</span>
    </li>
  );
}

export default async function Dashboard() {
  const { profiles, captions, votes, error } = await loadAll();
  const s = computeStats(profiles, captions, votes);
  const maxDay = Math.max(1, ...s.days.map((d) => d.up + d.down));
  const maxHour = Math.max(1, ...s.hours);
  const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/60">What&apos;s happening on At 116 &amp; Broadway, live from the database.</p>
      {error && <p className="mt-4 text-sm text-brick">Couldn&apos;t load everything: {error}</p>}

      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label="Users" value={s.totals.users} note={`${s.totals.activeVoters} have voted`} />
        <Tile label="AI captions" value={s.totals.captions} note={`on ${s.totals.images} photo${s.totals.images === 1 ? "" : "s"}`} />
        <Tile label="Votes" value={s.totals.votes} note={`${s.unvoted} caption${s.unvoted === 1 ? "" : "s"} still unvoted`} />
        <Tile label="Thumbs up rate" value={`${s.totals.upRate}%`} note="of all votes are 👍" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Votes per day, last 14 days</h2>
            <p className="flex gap-3 text-xs text-ink/60">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: UP }} /> up</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: DOWN }} /> down</span>
            </p>
          </div>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {s.days.map((d) => (
              <div key={d.key} className="group flex flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.up} up, ${d.down} down`}>
                <span className="mb-1 text-[10px] tabular-nums text-ink/60 opacity-0 group-hover:opacity-100">{d.up + d.down}</span>
                <div className="flex w-full flex-col overflow-hidden rounded-sm" style={{ height: `${((d.up + d.down) / maxDay) * 120}px` }}>
                  <div style={{ flex: d.down, background: DOWN }} />
                  <div style={{ flex: d.up, background: UP }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5">
            {s.days.map((d, i) => (
              <span key={d.key} className="flex-1 text-center text-[10px] text-ink/50">
                {i % 2 === 0 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-medium">When people vote</h2>
          <p className="mt-1 text-xs text-ink/60">
            {s.totals.votes ? `Busiest hour: ${hourLabel(s.peakHour)} (New York time)` : "No votes yet"}
          </p>
          <div className="mt-4 grid grid-cols-12 gap-1">
            {s.hours.map((n, h) => (
              <div
                key={h}
                title={`${hourLabel(h)}: ${n} votes`}
                className="aspect-square rounded-sm"
                style={{ background: n ? `rgba(29,79,145,${0.15 + (0.85 * n) / maxHour})` : "rgba(20,20,20,0.06)" }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-ink/50">
            <span>12am</span><span>noon</span><span>11pm</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-sm font-medium">Crowd favorites</h2>
          <ul className="mt-3 grid gap-3">
            {s.top.map((c) => <CaptionRow key={c.id} c={c} metric={`${c.score > 0 ? "+" : ""}${c.score}`} />)}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-medium">Most divisive</h2>
          <p className="text-xs text-ink/50">Got both 👍 and 👎</p>
          {s.divisive.length ? (
            <ul className="mt-3 grid gap-3">
              {s.divisive.map((c) => <CaptionRow key={c.id} c={c} metric={`${c.up}👍 ${c.down}👎`} />)}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/60">Nothing split the room yet.</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-medium">Biggest flops</h2>
          <ul className="mt-3 grid gap-3">
            {s.flops.map((c) => <CaptionRow key={c.id} c={c} metric={`${c.score}`} />)}
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-sm font-medium">Voter personalities</h2>
          <p className="text-xs text-ink/50">People with 2+ votes</p>
          <div className="mt-3 grid gap-3 text-sm">
            <p>
              <span className="text-ink/60">Biggest fan: </span>
              {s.fan ? `${fullName(s.fan.profile)} (${s.fan.profile?.email ?? "?"}), ${Math.round(s.fan.rate * 100)}% thumbs up` : "not enough votes"}
            </p>
            <p>
              <span className="text-ink/60">Toughest critic: </span>
              {s.critic ? `${fullName(s.critic.profile)} (${s.critic.profile?.email ?? "?"}), ${Math.round(s.critic.rate * 100)}% thumbs up` : "not enough votes"}
            </p>
          </div>
          <h3 className="mt-5 text-xs text-ink/60">Most votes cast</h3>
          <ol className="mt-2 grid gap-1.5 text-sm">
            {s.voters.map((v, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-4 text-ink/50">{i + 1}</span>
                <span className="flex-1 truncate" title={v.profile?.email ?? ""}>
                  {fullName(v.profile)}
                  <span className="block truncate text-[11px] text-ink/50">{v.profile?.email}</span>
                </span>
                <span className="h-1.5 rounded-full" style={{ width: `${(v.total / (s.voters[0]?.total || 1)) * 60}px`, background: UP }} />
                <span className="w-6 text-right tabular-nums text-ink/60">{v.total}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-medium">Do shorter captions win?</h2>
          <p className="text-xs text-ink/50">Average score by caption length</p>
          {[
            ["9 words or fewer", s.lengths.shortAvg, s.lengths.shortN],
            ["10+ words", s.lengths.longAvg, s.lengths.longN],
          ].map(([label, avg, n]) => (
            <div key={label as string} className="mt-4">
              <div className="flex justify-between text-sm">
                <span>{label as string}</span>
                <span className="tabular-nums">{(avg as number).toFixed(2)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-ink/10">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.abs(avg as number) * 50)}%`, background: (avg as number) >= 0 ? UP : DOWN }}
                />
              </div>
              <p className="mt-0.5 text-[11px] text-ink/50">{n as number} caption{n === 1 ? "" : "s"}</p>
            </div>
          ))}
          <p className="mt-4 text-xs text-ink/70">
            {s.lengths.shortAvg === s.lengths.longAvg
              ? "No difference yet."
              : s.lengths.shortAvg > s.lengths.longAvg
                ? "Short captions are winning. Brevity is the soul of wit."
                : "Longer captions are scoring better, for now."}
          </p>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-medium">Behind the captions</h2>
          <h3 className="mt-3 text-xs text-ink/60">AI model that wrote them</h3>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {s.models.map(([m, n]) => (
              <li key={m} className="flex justify-between">
                <span className="truncate">{m}</span>
                <span className="tabular-nums text-ink/60">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <span className="tabular-nums">{s.withHint}</span>
            <span className="text-ink/60"> {s.withHint === 1 ? "caption was" : "captions were"} written with a user hint like &quot;midterm week&quot;.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
