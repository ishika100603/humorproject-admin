import { fmtDate, fullName, requireAdmin, type Profile } from "@/lib/admin";

export const metadata = { title: "Generation requests | Admin" };

type Req = {
  id: number;
  user_id: string;
  image_url: string | null;
  chain_id: number | null;
  caption_count: number;
  hint: string | null;
  status: string;
  model_used: string | null;
  error: string | null;
  captions_created: number;
  created_at: string;
  finished_at: string | null;
};
type Resp = { id: number; request_id: number; model_key: string; http_status: number | null; latency_ms: number | null; response_text: string | null; error: string | null };

const secs = (r: Req) => (r.finished_at ? ((new Date(r.finished_at).getTime() - new Date(r.created_at).getTime()) / 1000).toFixed(1) + "s" : "–");
const badge = (s: string) => (s === "done" ? "bg-tile text-navy" : s === "failed" ? "bg-brick/10 text-brick" : "bg-note text-ink");

export default async function Requests() {
  const { supabase } = await requireAdmin();
  const [q, p, c, l] = await Promise.all([
    supabase.from("caption_requests").select("*").order("created_at", { ascending: false }).range(0, 199),
    supabase.from("profiles").select("id, email, first_name, last_name").range(0, 9999),
    supabase.from("prompt_chains").select("id, name"),
    supabase.from("llm_responses").select("id, request_id, model_key, http_status, latency_ms, response_text, error").order("id").range(0, 1999),
  ]);
  const reqs = (q.data ?? []) as Req[];
  const profiles = (p.data ?? []) as Profile[];
  const chains = (c.data ?? []) as { id: number; name: string }[];
  const resps = (l.data ?? []) as Resp[];

  const done = reqs.filter((r) => r.status === "done");
  const failed = reqs.filter((r) => r.status === "failed").length;
  const avg = done.length
    ? (done.reduce((s, r) => s + (new Date(r.finished_at!).getTime() - new Date(r.created_at).getTime()), 0) / done.length / 1000).toFixed(1) + "s"
    : "–";
  const fallbacks = reqs.filter((r) => resps.filter((x) => x.request_id === r.id).length > 1).length;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">Generation requests</h1>
      <p className="mt-1 text-sm text-ink/60">Every time someone taps Generate. Open a row to see each call to the AI inside it. Read only.</p>
      {q.error && <p className="mt-4 text-sm text-brick">{q.error.message}</p>}

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Requests", reqs.length],
          ["Failed", reqs.length ? `${failed} (${Math.round((failed / reqs.length) * 100)}%)` : 0],
          ["Avg time", avg],
          ["Needed a fallback model", fallbacks],
        ].map(([k, v]) => (
          <div key={String(k)} className="card p-4">
            <p className="text-xs text-ink/60">{k}</p>
            <p className="mt-1 text-xl tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="card mt-5 divide-y divide-ink/5">
        {reqs.map((r) => {
          const calls = resps.filter((x) => x.request_id === r.id);
          return (
            <details key={r.id} className="group">
              <summary className="grid cursor-pointer list-none grid-cols-[3rem_2.5rem_1fr_8rem_6rem_9rem_4rem_8rem] items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/60">
                <span className="text-xs text-ink/40">#{r.id}</span>
                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt="" className="h-9 w-9 rounded object-cover" />
                ) : (
                  <span />
                )}
                <span className="truncate">
                  {fullName(profiles.find((x) => x.id === r.user_id))}
                  {r.hint && <span className="ml-2 text-xs text-ink/50">“{r.hint}”</span>}
                </span>
                <span className="truncate text-xs text-ink/60">{chains.find((x) => x.id === r.chain_id)?.name ?? "Built-in prompt"}</span>
                <span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${badge(r.status)}`}>{r.status}</span>
                </span>
                <span className="truncate text-xs text-ink/60">{r.model_used ?? "–"}</span>
                <span className="text-xs tabular-nums text-ink/60">{secs(r)}</span>
                <span className="text-xs text-ink/50">{fmtDate(r.created_at)}</span>
              </summary>
              <div className="grid gap-2 bg-white/50 px-4 pb-4 pt-1 text-xs">
                <p className="text-ink/60">
                  Asked for {r.caption_count}, saved {r.captions_created}. {calls.length} AI call{calls.length === 1 ? "" : "s"}.
                  {r.error && <span className="ml-1 text-brick">{r.error}</span>}
                </p>
                {calls.map((x, n) => (
                  <div key={x.id} className="rounded-md border border-ink/10 bg-white p-3">
                    <p className="text-ink/60">
                      Call {n + 1} · {x.model_key} · HTTP {x.http_status ?? "–"} · {x.latency_ms ?? "–"} ms
                    </p>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-ink/80">
                      {x.response_text ?? x.error ?? ""}
                    </pre>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
        {!reqs.length && <p className="px-4 py-6 text-center text-sm text-ink/50">No requests yet. They show up after someone generates captions.</p>}
      </div>
    </div>
  );
}
