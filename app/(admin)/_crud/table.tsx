"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { RESOURCES, type Field } from "@/lib/resources";
import { deleteRow, saveRow, type ActionState } from "./actions";

export type Row = Record<string, unknown> & { id: number };
type Options = Record<string, { id: number; label: string }[]>;

const input = "w-full rounded-md border border-ink/25 bg-white px-2 py-1.5 text-sm";

function FieldInput({ f, value, options, form }: { f: Field; value?: unknown; options: Options; form?: string }) {
  if (f.type === "bool")
    return <input type="checkbox" form={form} name={f.name} defaultChecked={value === undefined ? true : Boolean(value)} className="h-4 w-4 accent-navy" />;
  if (f.type === "ref")
    return (
      <select form={form} name={f.name} defaultValue={value == null ? "" : String(value)} className={input}>
        <option value="">Pick one</option>
        {(options[f.name] ?? []).map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    );
  if (f.type === "textarea")
    return <textarea form={form} name={f.name} defaultValue={value == null ? "" : String(value)} placeholder={f.placeholder} rows={2} className={input} />;
  return (
    <input
      form={form}
      name={f.name}
      type={f.type === "number" ? "number" : "text"}
      step={f.type === "number" ? "any" : undefined}
      defaultValue={value == null ? "" : String(value)}
      placeholder={f.placeholder}
      className={input}
    />
  );
}

function Show({ f, value, options }: { f: Field; value: unknown; options: Options }) {
  if (f.type === "bool")
    return <span className={`rounded-full px-2 py-0.5 text-xs ${value ? "bg-tile text-navy" : "bg-ink/5 text-ink/50"}`}>{value ? "On" : "Off"}</span>;
  if (f.type === "ref") return <>{options[f.name]?.find((o) => o.id === value)?.label ?? "–"}</>;
  if (value == null || value === "") return <span className="text-ink/30">–</span>;
  return <span className="whitespace-pre-line">{String(value)}</span>;
}

function AddForm({ resource, options }: { resource: string; options: Options }) {
  const r = RESOURCES[resource];
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRow, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="card mt-5 flex flex-wrap items-end gap-3 p-4">
      <input type="hidden" name="_resource" value={resource} />
      {r.fields.map((f) => (
        <label key={f.name} className={`grid gap-1 text-xs text-ink/60 ${f.type === "bool" ? "" : f.wide ? "min-w-64 flex-[2]" : "min-w-36 flex-1"}`}>
          {f.label}
          <FieldInput f={f} options={options} />
        </label>
      ))}
      <div className="grid gap-1">
        <button disabled={pending} className="h-9 rounded-md bg-ink px-4 text-sm text-white hover:bg-navy disabled:opacity-50">
          {pending ? "Adding…" : `Add ${r.noun}`}
        </button>
      </div>
      {state && <p className={`w-full text-xs ${state.ok ? "text-navy" : "text-brick"}`}>{state.message}</p>}
    </form>
  );
}

function RowView({ resource, row, options }: { resource: string; row: Row; options: Options }) {
  const r = RESOURCES[resource];
  const [editing, setEditing] = useState(false);
  const [sure, setSure] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(saveRow, null);
  const [delState, delAction, deleting] = useActionState<ActionState, FormData>(deleteRow, null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);
  const formId = `row-${resource}-${row.id}`;

  return (
    <tr className="border-b border-ink/5 align-top last:border-0">
      {r.fields.map((f) => (
        <td key={f.name} className="px-3 py-2.5">
          {editing ? <FieldInput f={f} value={row[f.name]} options={options} form={formId} /> : <Show f={f} value={row[f.name]} options={options} />}
        </td>
      ))}
      <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs">
        {editing ? (
          <form id={formId} action={action} className="flex justify-end gap-2">
            <input type="hidden" name="_resource" value={resource} />
            <input type="hidden" name="_id" value={row.id} />
            {/* the inputs live in the other cells and join this form through form={formId} */}
            <button
              disabled={pending}
              className="rounded-md bg-ink px-3 py-1 text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="underline">
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditing(true)} className="text-navy underline">
              Edit
            </button>
            {sure ? (
              <form action={delAction} className="flex gap-2">
                <input type="hidden" name="_resource" value={resource} />
                <input type="hidden" name="_id" value={row.id} />
                <button disabled={deleting} className="text-brick underline">
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button type="button" onClick={() => setSure(false)} className="underline">
                  Keep
                </button>
              </form>
            ) : (
              <button onClick={() => setSure(true)} className="text-ink/50 underline hover:text-brick">
                Delete
              </button>
            )}
          </div>
        )}
        {state && !state.ok && <p className="mt-1 whitespace-normal text-brick">{state.message}</p>}
        {delState && !delState.ok && <p className="mt-1 whitespace-normal text-brick">{delState.message}</p>}
      </td>
    </tr>
  );
}

export default function CrudTable({ resource, rows, options }: { resource: string; rows: Row[]; options: Options }) {
  const r = RESOURCES[resource];
  return (
    <>
      <AddForm resource={resource} options={options} />
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink/60">
            <tr>
              {r.fields.map((f) => (
                <th key={f.name} className="px-3 py-2 font-normal">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RowView key={row.id} resource={resource} row={row} options={options} />
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={r.fields.length + 1} className="px-3 py-6 text-center text-sm text-ink/50">
                  Nothing here yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
