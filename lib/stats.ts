import type { Caption, Profile, Vote } from "./admin";

const NY = "America/New_York";
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: NY }).format(new Date(iso)); // 2026-10-13
const hourOf = (iso: string) => Number(new Intl.DateTimeFormat("en-US", { timeZone: NY, hour: "numeric", hourCycle: "h23" }).format(new Date(iso)));
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function computeStats(profiles: Profile[], captions: Caption[], votes: Vote[]) {
  const byCaption = new Map<number, { up: number; down: number }>();
  for (const v of votes) {
    const t = byCaption.get(v.caption_id) ?? { up: 0, down: 0 };
    if (v.value > 0) t.up++;
    else t.down++;
    byCaption.set(v.caption_id, t);
  }
  const scored = captions.map((c) => {
    const t = byCaption.get(c.id) ?? { up: 0, down: 0 };
    return { ...c, up: t.up, down: t.down, score: t.up - t.down, total: t.up + t.down };
  });

  const ups = votes.filter((v) => v.value > 0).length;

  // Votes per day, last 14 days (NY time)
  const days: { key: string; label: string; up: number; down: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = dayKey(d.toISOString());
    days.push({ key, label: new Intl.DateTimeFormat("en-US", { timeZone: NY, month: "short", day: "numeric" }).format(d), up: 0, down: 0 });
  }
  for (const v of votes) {
    const d = days.find((x) => x.key === dayKey(v.created_at));
    if (d) v.value > 0 ? d.up++ : d.down++;
  }

  // When people vote: 24 hour buckets
  const hours = Array.from({ length: 24 }, () => 0);
  votes.forEach((v) => hours[hourOf(v.created_at)]++);
  const peakHour = hours.indexOf(Math.max(...hours));

  // Best, most divisive
  const top = [...scored].sort((a, b) => b.score - a.score || b.total - a.total).slice(0, 3);
  const divisive = scored
    .filter((c) => c.up > 0 && c.down > 0)
    .sort((a, b) => b.total - a.total || Math.abs(a.score) - Math.abs(b.score))
    .slice(0, 3);
  const flops = [...scored].filter((c) => c.total > 0).sort((a, b) => a.score - b.score).slice(0, 3);

  // Voter personalities (2+ votes): who is the generous one, who is the critic
  const perUser = new Map<string, { up: number; down: number }>();
  for (const v of votes) {
    const t = perUser.get(v.user_id) ?? { up: 0, down: 0 };
    v.value > 0 ? t.up++ : t.down++;
    perUser.set(v.user_id, t);
  }
  const voters = [...perUser.entries()]
    .map(([id, t]) => ({ profile: profiles.find((p) => p.id === id), ...t, total: t.up + t.down, rate: t.up / (t.up + t.down) }))
    .sort((a, b) => b.total - a.total);
  const qualified = voters.filter((v) => v.total >= 2);
  const fan = [...qualified].sort((a, b) => b.rate - a.rate || b.total - a.total)[0];
  const critic = [...qualified].sort((a, b) => a.rate - b.rate || b.total - a.total)[0];

  // Do shorter captions do better?
  const short = scored.filter((c) => words(c.caption) <= 9);
  const long = scored.filter((c) => words(c.caption) > 9);
  const avg = (xs: typeof scored) => (xs.length ? xs.reduce((s, c) => s + c.score, 0) / xs.length : 0);
  // Share of votes that were thumbs up, across every caption in the group
  const upShare = (xs: typeof scored) => {
    const up = xs.reduce((s, c) => s + c.up, 0);
    const all = xs.reduce((s, c) => s + c.total, 0);
    return { rate: all ? Math.round((up / all) * 100) : 0, votes: all };
  };

  // Which AI model wrote the captions
  const models = new Map<string, number>();
  captions.forEach((c) => models.set(c.model || "unknown", (models.get(c.model || "unknown") ?? 0) + 1));

  const withHint = captions.filter((c) => (c.prompt ?? "").includes("Extra direction from the user")).length;
  const unvoted = scored.filter((c) => c.total === 0).length;

  return {
    totals: {
      users: profiles.length,
      captions: captions.length,
      votes: votes.length,
      upRate: votes.length ? Math.round((ups / votes.length) * 100) : 0,
      images: new Set(captions.map((c) => c.image_url)).size,
      activeVoters: perUser.size,
    },
    days,
    hours,
    peakHour,
    top,
    divisive,
    flops,
    voters: voters.slice(0, 5),
    fan,
    critic,
    lengths: { shortAvg: avg(short), longAvg: avg(long), shortN: short.length, longN: long.length, short: upShare(short), long: upShare(long) },
    models: [...models.entries()].sort((a, b) => b[1] - a[1]),
    withHint,
    unvoted,
    scored,
  };
}
