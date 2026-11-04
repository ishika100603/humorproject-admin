import Link from "next/link";
import { fmtDate, requireAdmin } from "@/lib/admin";
import { costOf, fmtCost, fmtTokens, type Price } from "@/lib/cost";

export const metadata = { title: "LLM responses | Admin" };

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
  created_at: string;
  caption_requests: { chain_id: number | null } | null;
};

export default async function Responses({ searchParams }: PageProps<"/responses">) {
  const { status } = (await searchParams) as { status?: string };
  const onlyFailed = status === "failed";
  const { supabase } = await requireAdmin();
  const [r, c, m] = await Promise.all([
    supabase
      .from("llm_responses")
      .select("*, caption_requests(chain_id)")
      .order("created_at", { ascending: false })
      .range(0, 299),
    supabase.from("prompt_chains").select("id, name"),
    supabase.from("llm_models").select("model_key, input_cost_per_million, output_cost_per_million"),
  ]);
  const all = (r.data ?? []) as Resp[];
  const rows = onlyFailed ? all.filter((x) => x.http_status !== 200) : all;
  const chains = (c.data ?? []) as { id: number; name: string }[];
  const prices = (m.data ?? []) as Price[];
  const chainName = (x: Resp) => chains.find((ch) => ch.id === x.caption_requests?.chain_id)?.name ?? "Built-in prompt";
  const failedCount = all.filter((x) => x.http_status !== 200).length;

  // Per-model health and spend
  const models = [...new Set(all.map((x) => x.model_key))].map((key) => {
    const mine = all.filter((x) => x.model_key === key);
    const ok = mine.filter((x) => x.http_status === 200);
    const avg = ok.length ? Math.round(ok.reduce((s, x) => s + (x.latency_ms ?? 0), 0) / ok.length) : null;
    const tokens = mine.reduce((n, x) => n + (x.total_tokens ?? 0), 0);
    const cost = mine.map((x) => costOf(prices, key, x.prompt_tokens, x.output_tokens));
    return { key, calls: mine.length, ok: ok.length, avg, tokens, cost: cost.some((v) => v != null) ? cost.reduce<number>((n, v) => n + (v ?? 0), 0) : null };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">LLM responses</h1>
      <p className="mt-1 text-sm text-ink/60">
        Every AI call, newest first, with the tokens it used. Cost shows once a model&apos;s prices are set on{" "}
        <Link href="/models" className="underline">
          LLM models
        </Link>
        . Read only.
      </p>
      {r.error && <p className="mt-4 text-sm text-brick">{r.error.message}</p>}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {models.map((x) => (
          <div key={x.key} className="card p-4">
            <p className="text-xs text-ink/60">{x.key}</p>
            <p className="mt-1 text-lg tabular-nums">
              {x.ok}/{x.calls} ok
            </p>
            <p className="text-xs text-ink/50">
              {x.avg ? `${(x.avg / 1000).toFixed(1)}s average` : "No successful calls"} · {fmtTokens(x.tokens)} tokens
              {x.cost != null ? ` · ${fmtCost(x.cost)}` : ""}
            </p>
          </div>
        ))}
      </div>

      <nav className="mt-5 flex gap-1 text-sm">
        <Link href="/responses" className={`rounded-md px-3 py-1.5 ${!onlyFailed ? "bg-ink text-white" : "hover:bg-white"}`}>
          All ({all.length})
        </Link>
        <Link href="/responses?status=failed" className={`rounded-md px-3 py-1.5 ${onlyFailed ? "bg-ink text-white" : "hover:bg-white"}`}>
          Failed only ({failedCount})
        </Link>
      </nav>

      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink/60">
            <tr>
              <th className="px-3 py-2 font-normal">When</th>
              <th className="px-3 py-2 font-normal">Model · prompt chain</th>
              <th className="px-3 py-2 font-normal">HTTP</th>
              <th className="px-3 py-2 font-normal">Time</th>
              <th className="px-3 py-2 font-normal">Tokens (in / out)</th>
              <th className="px-3 py-2 font-normal">Cost</th>
              <th className="px-3 py-2 font-normal">Response</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const ok = x.http_status === 200;
              return (
                <tr key={x.id} className="border-b border-ink/5 align-top last:border-0">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink/60">
                    {fmtDate(x.created_at)}
                    <span className="block text-ink/40">request #{x.request_id}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                    {x.model_key}
                    <span className="block text-ink/50">{chainName(x)}</span>
                  </td>
                  <td className={`px-3 py-2.5 text-xs tabular-nums ${ok ? "text-navy" : "text-brick"}`}>{x.http_status ?? "–"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums">{x.latency_ms != null ? `${(x.latency_ms / 1000).toFixed(1)}s` : "–"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums">
                    {x.total_tokens != null ? (
                      <>
                        {fmtTokens(x.total_tokens)}
                        <span className="block text-ink/50">
                          {fmtTokens(x.prompt_tokens)} / {fmtTokens(x.output_tokens)}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink/40">not recorded</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums">{fmtCost(costOf(prices, x.model_key, x.prompt_tokens, x.output_tokens)) ?? "–"}</td>
                  <td className="px-3 py-2.5">
                    <pre className={`max-h-28 max-w-md overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] ${ok ? "" : "text-brick"}`}>
                      {x.response_text ?? x.error}
                    </pre>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-ink/50">
                  {onlyFailed ? "No failed calls." : "No AI calls logged yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
