import Link from "next/link";
import { fmtDate, fullName, requireAdmin, type Profile } from "@/lib/admin";
import { costOf, fmtCost, fmtTokens, type Price } from "@/lib/cost";
import Zoom from "../_ui/zoom";

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
type Resp = {
  id: number;
  request_id: number;
  model_key: string;
  http_status: number | null;
  latency_ms: number | null;
  response_text: string | null;
  error: string | null;
  prompt_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
};

const secs = (r: Req) => (r.finished_at ? ((new Date(r.finished_at).getTime() - new Date(r.created_at).getTime()) / 1000).toFixed(1) + "s" : "–");
const badge = (s: string) => (s === "done" ? "bg-tile text-navy" : s === "failed" ? "bg-brick/10 text-brick" : "bg-note text-ink");

// A Gemini error body is JSON; pull out its message so the reason reads plainly
const reason = (r: Req, calls: Resp[]) => {
  if (r.error) return r.error;
  const last = calls.filter((x) => x.error).at(-1);
  if (!last?.error) return "No reason was recorded.";
  try {
    return `${last.model_key}: ${JSON.parse(last.error)?.error?.message ?? last.error}`;
  } catch {
    return `${last.model_key}: ${last.error.slice(0, 200)}`;
  }
};

export default async function Requests({ searchParams }: PageProps<"/requests">) {
  const { status } = (await searchParams) as { status?: string };
  const onlyFailed = status === "failed";
  const { supabase } = await requireAdmin();
  const [q, p, c, l, m] = await Promise.all([
    supabase.from("caption_requests").select("*").order("created_at", { ascending: false }).range(0, 299),
    supabase.from("profiles").select("id, email, first_name, last_name").range(0, 9999),
    supabase.from("prompt_chains").select("id, name"),
    supabase
      .from("llm_responses")
      .select("id, request_id, model_key, http_status, latency_ms, response_text, error, prompt_tokens, output_tokens, total_tokens")
      .order("id")
      .range(0, 2999),
    supabase.from("llm_models").select("model_key, input_cost_per_million, output_cost_per_million"),
  ]);
  const all = (q.data ?? []) as Req[];
  const reqs = onlyFailed ? all.filter((r) => r.status === "failed") : all;
  const profiles = (p.data ?? []) as Profile[];
  const chains = (c.data ?? []) as { id: number; name: string }[];
  const resps = (l.data ?? []) as Resp[];
  const prices = (m.data ?? []) as Price[];
  const chainName = (id: number | null) => chains.find((x) => x.id === id)?.name ?? "Built-in prompt";

  const done = all.filter((r) => r.status === "done");
  const failed = all.filter((r) => r.status === "failed").length;
  const avg = done.length
    ? (done.reduce((s, r) => s + (new Date(r.finished_at!).getTime() - new Date(r.created_at).getTime()), 0) / done.length / 1000).toFixed(1) + "s"
    : "–";
  const tokens = resps.reduce((n, x) => n + (x.total_tokens ?? 0), 0);
  const costs = resps.map((x) => costOf(prices, x.model_key, x.prompt_tokens, x.output_tokens));
  const totalCost = costs.some((x) => x != null) ? costs.reduce<number>((n, x) => n + (x ?? 0), 0) : null;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">Generation requests</h1>
      <p className="mt-1 text-sm text-ink/60">Every time someone taps Generate or runs a prompt chain. Open a row for each AI call inside it. Read only.</p>
      {q.error && <p className="mt-4 text-sm text-brick">{q.error.message}</p>}

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Requests", all.length],
          ["Failed", all.length ? `${failed} (${Math.round((failed / all.length) * 100)}%)` : 0],
          ["Avg time", avg],
          ["Tokens used", `${fmtTokens(tokens)}${totalCost != null ? ` · ${fmtCost(totalCost)}` : ""}`],
        ].map(([k, v]) => (
          <div key={String(k)} className="card p-4">
            <p className="text-xs text-ink/60">{k}</p>
            <p className="mt-1 text-xl tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <nav className="mt-5 flex gap-1 text-sm">
        <Link href="/requests" className={`rounded-md px-3 py-1.5 ${!onlyFailed ? "bg-ink text-white" : "hover:bg-white"}`}>
          All ({all.length})
        </Link>
        <Link href="/requests?status=failed" className={`rounded-md px-3 py-1.5 ${onlyFailed ? "bg-ink text-white" : "hover:bg-white"}`}>
          Failed only ({failed})
        </Link>
      </nav>

      <div className="card mt-3 divide-y divide-ink/5">
        {reqs.map((r) => {
          const calls = resps.filter((x) => x.request_id === r.id);
          const reqTokens = calls.reduce((n, x) => n + (x.total_tokens ?? 0), 0);
          return (
            <details key={r.id} className="group">
              <summary className="cursor-pointer list-none px-4 py-2.5 text-sm hover:bg-white/60">
                <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 lg:grid-cols-[2.5rem_1fr_9rem_5rem_9rem_4rem_6rem_7rem]">
                  {r.image_url ? <Zoom src={r.image_url} size="h-9 w-9" /> : <span />}
                  <span className="truncate">
                    {fullName(profiles.find((x) => x.id === r.user_id))}
                    {r.hint && <span className="ml-2 hidden text-xs text-ink/50 sm:inline">“{r.hint}”</span>}
                  </span>
                  <span className="hidden truncate text-xs text-ink/60 lg:inline">{chainName(r.chain_id)}</span>
                  <span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${badge(r.status)}`}>{r.status}</span>
                  </span>
                  <span className="hidden truncate text-xs text-ink/60 lg:inline">{r.model_used ?? "–"}</span>
                  <span className="hidden text-xs tabular-nums text-ink/60 lg:inline">{secs(r)}</span>
                  <span className="hidden text-xs tabular-nums text-ink/60 lg:inline">{reqTokens ? `${fmtTokens(reqTokens)} tok` : "–"}</span>
                  <span className="hidden text-xs text-ink/50 lg:inline">{fmtDate(r.created_at)}</span>
                </div>
                {r.status === "failed" && <p className="mt-1 pl-12 text-xs text-brick">Why it failed: {reason(r, calls)}</p>}
              </summary>
              <div className="grid gap-2 bg-white/50 px-4 pb-4 pt-1 text-xs">
                <p className="text-ink/60 lg:hidden">
                  {chainName(r.chain_id)} · {r.model_used ?? "no model"} · {secs(r)} · {fmtDate(r.created_at)}
                </p>
                {calls.map((x, n) => {
                  const cost = fmtCost(costOf(prices, x.model_key, x.prompt_tokens, x.output_tokens));
                  return (
                    <div key={x.id} className="rounded-md border border-ink/10 bg-white p-3">
                      <p className="text-ink/60">
                        Call {n + 1} · {x.model_key} · {chainName(r.chain_id)} · HTTP {x.http_status ?? "–"} · {x.latency_ms ?? "–"} ms
                        {x.total_tokens != null && ` · ${fmtTokens(x.prompt_tokens)} in + ${fmtTokens(x.output_tokens)} out = ${fmtTokens(x.total_tokens)} tokens`}
                        {cost && ` · ${cost}`}
                      </p>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-ink/80">{x.response_text ?? x.error ?? ""}</pre>
                    </div>
                  );
                })}
                {!calls.length && <p className="text-ink/50">No AI calls were logged for this request.</p>}
              </div>
            </details>
          );
        })}
        {!reqs.length && <p className="px-4 py-6 text-center text-sm text-ink/50">{onlyFailed ? "No failed requests." : "No requests yet."}</p>}
      </div>
    </div>
  );
}
