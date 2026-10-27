import { requireAdmin } from "@/lib/admin";
import { RESOURCES } from "@/lib/resources";
import CrudTable, { type Row } from "./table";

export default async function ResourcePage({ resource }: { resource: string }) {
  const r = RESOURCES[resource];
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from(r.table).select("*").order(r.order.column, { ascending: r.order.ascending }).range(0, 999);

  // Dropdown choices for fields that point at another table
  const options: Record<string, { id: number; label: string }[]> = {};
  for (const f of r.fields) {
    if (f.type !== "ref" || !f.ref) continue;
    const { data: refRows } = await supabase.from(f.ref.table).select(`id, ${f.ref.label}`).order(f.ref.label);
    options[f.name] = ((refRows ?? []) as unknown as Record<string, unknown>[]).map((x) => ({ id: Number(x.id), label: String(x[f.ref!.label]) }));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-medium">{r.title}</h1>
      <p className="mt-1 text-sm text-ink/60">{r.blurb}</p>
      {error && <p className="mt-4 text-sm text-brick">{error.message}</p>}
      <CrudTable resource={resource} rows={(data ?? []) as Row[]} options={options} />
      <p className="mt-2 text-xs text-ink/40">{data?.length ?? 0} rows</p>
    </div>
  );
}
