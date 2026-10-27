import { fmtDate, requireAdmin } from "@/lib/admin";

export const metadata = { title: "LLM responses | Admin" };

type Resp = {
  id: number;
  request_id: number;
  model_key: string;
  http_status: number | null;
  latency_ms: number | null;
  response_text: string | null;
  error: string | null;
  created_at: string;
};

export default async function Responses() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("llm_responses").select("*").order("created_at", { ascending: false }).range(0, 299);
  const rows = (data ?? []) as Resp[];

  // Per-model health
  const models = [...new Set(rows.map((r) => r.model_key))].map((m) => {
    const mine = rows.filter((r) => r.model_key === m);
    const ok = mine.filter((r) => r.http_status === 200);
    const avg = ok.length ? Math.round(ok.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / ok.length) : null;
    return { m, calls: mine.length, ok: ok.length, avg };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">LLM responses</h1>
      <p className="mt-1 text-sm text-ink/60">Raw replies from each AI call, newest first. Read only.</p>
      {error && <p className="mt-4 text-sm text-brick">{error.message}</p>}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {models.map((x) => (
          <div key={x.m} className="card p-4">
            <p className="text-xs text-ink/60">{x.m}</p>
            <p className="mt-1 text-lg tabular-nums">
              {x.ok}/{x.calls} ok
            </p>
            <p className="text-xs text-ink/50">{x.avg ? `${(x.avg / 1000).toFixed(1)}s average when it works` : "No successful calls"}</p>
          </div>
        ))}
      </div>

      <div className="card mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink/60">
            <tr>
              <th className="px-3 py-2 font-normal">When</th>
              <th className="px-3 py-2 font-normal">Request</th>
              <th className="px-3 py-2 font-normal">Model</th>
              <th className="px-3 py-2 font-normal">HTTP</th>
              <th className="px-3 py-2 font-normal">Time</th>
              <th className="px-3 py-2 font-normal">Response</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/5 align-top last:border-0">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink/60">{fmtDate(r.created_at)}</td>
                <td className="px-3 py-2.5 text-xs text-ink/60">#{r.request_id}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">{r.model_key}</td>
                <td className={`px-3 py-2.5 text-xs tabular-nums ${r.http_status === 200 ? "text-navy" : "text-brick"}`}>{r.http_status ?? "–"}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums">{r.latency_ms != null ? `${r.latency_ms} ms` : "–"}</td>
                <td className="px-3 py-2.5">
                  <details>
                    <summary className="max-w-xl cursor-pointer truncate font-mono text-[11px] text-ink/70">{(r.response_text ?? r.error ?? "").slice(0, 140)}</summary>
                    <pre className="mt-1 max-h-60 max-w-xl overflow-auto whitespace-pre-wrap break-words font-mono text-[11px]">{r.response_text ?? r.error}</pre>
                  </details>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-ink/50">
                  No AI calls logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
