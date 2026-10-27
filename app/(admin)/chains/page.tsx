import { requireAdmin } from "@/lib/admin";
import MixForm from "./mix-form";

export const metadata = { title: "Prompt chains | Admin" };

type Chain = { id: number; name: string; description: string | null };
type Step = { id: number; chain_id: number; step_order: number; title: string; prompt_text: string };

export default async function Chains() {
  const { supabase } = await requireAdmin();
  const [c, s, m, r] = await Promise.all([
    supabase.from("prompt_chains").select("id, name, description").order("id"),
    supabase.from("prompt_chain_steps").select("id, chain_id, step_order, title, prompt_text").order("step_order"),
    supabase.from("prompt_chain_mix").select("chain_id, weight"),
    supabase.from("caption_requests").select("chain_id, status").range(0, 9999),
  ]);
  const chains = (c.data ?? []) as Chain[];
  const steps = (s.data ?? []) as Step[];
  const mix = (m.data ?? []) as { chain_id: number; weight: number }[];
  const reqs = (r.data ?? []) as { chain_id: number | null; status: string }[];
  const error = c.error || s.error || m.error;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">Prompt chains</h1>
      <p className="mt-1 text-sm text-ink/60">
        Each chain is a prompt built from ordered steps. When someone taps Generate, the app picks a chain using the mix below.
      </p>
      {error && <p className="mt-4 text-sm text-brick">{error.message}</p>}

      <MixForm chains={chains.map((ch) => ({ id: ch.id, name: ch.name, weight: mix.find((x) => x.chain_id === ch.id)?.weight ?? 0 }))} />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {chains.map((ch) => {
          const mine = steps.filter((st) => st.chain_id === ch.id);
          const used = reqs.filter((q) => q.chain_id === ch.id);
          const failed = used.filter((q) => q.status === "failed").length;
          return (
            <section key={ch.id} className="card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-medium">{ch.name}</h2>
                <span className="text-xs text-ink/50">
                  {used.length} runs{failed ? `, ${failed} failed` : ""}
                </span>
              </div>
              {ch.description && <p className="mt-1 text-xs text-ink/60">{ch.description}</p>}
              <ol className="mt-4 grid gap-3">
                {mine.map((st) => (
                  <li key={st.id} className="rounded-md border border-ink/10 bg-white p-3">
                    <p className="text-xs text-ink/50">
                      Step {st.step_order} · {st.title}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-snug">{st.prompt_text}</p>
                  </li>
                ))}
                {!mine.length && <p className="text-sm text-ink/50">No steps.</p>}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
