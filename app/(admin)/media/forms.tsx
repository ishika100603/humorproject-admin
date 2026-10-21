"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createMedia, deleteCaption, updateCaption, type ActionState } from "./actions";

export function CreateForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createMedia, null);
  const [preview, setPreview] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setPreview(null);
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="card grid gap-3 p-5 md:grid-cols-[auto_1fr_auto] md:items-end">
      <label className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-ink/40 bg-white text-xs text-ink/50 hover:border-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : "+ photo"}
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>
      <div className="grid gap-2">
        <input name="caption" placeholder="Caption" maxLength={200} className="rounded-md border border-ink/25 bg-white px-3 py-2 text-sm" />
        <input name="model" placeholder="Model (optional), e.g. gemini-3.5-flash" className="rounded-md border border-ink/25 bg-white px-3 py-1.5 text-xs" />
      </div>
      <div className="grid gap-1">
        <button disabled={pending} className="h-10 rounded-md bg-ink px-5 text-sm text-white hover:bg-navy disabled:opacity-50">
          {pending ? "Adding…" : "Add media"}
        </button>
        {state && <p className={`text-xs ${state.ok ? "text-navy" : "text-brick"}`}>{state.message}</p>}
      </div>
    </form>
  );
}

export function EditCaption({ id, caption, model }: { id: number; caption: string; model: string | null }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(updateCaption, null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (!editing)
    return (
      <div>
        <p className="text-sm leading-snug">{caption}</p>
        <button onClick={() => setEditing(true)} className="mt-1 text-xs text-navy underline">
          Edit
        </button>
        {state?.ok && <span className="ml-2 text-xs text-navy">{state.message}</span>}
      </div>
    );
  return (
    <form action={action} className="grid gap-1.5">
      <input type="hidden" name="id" value={id} />
      <textarea name="caption" defaultValue={caption} rows={2} maxLength={200} className="w-full rounded-md border border-ink/25 bg-white px-2 py-1 text-sm" autoFocus />
      <input name="model" defaultValue={model ?? ""} placeholder="Model" className="w-full rounded-md border border-ink/25 bg-white px-2 py-1 text-xs" />
      <div className="flex gap-2">
        <button disabled={pending} className="rounded-md bg-ink px-3 py-1 text-xs text-white disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs underline">
          Cancel
        </button>
      </div>
      {state && !state.ok && <p className="text-xs text-brick">{state.message}</p>}
    </form>
  );
}

export function DeleteCaption({ id, votes }: { id: number; votes: number }) {
  const [sure, setSure] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteCaption, null);
  if (!sure)
    return (
      <button onClick={() => setSure(true)} className="text-xs text-brick underline">
        Delete
      </button>
    );
  return (
    <form action={action} className="grid gap-1 text-xs">
      <input type="hidden" name="id" value={id} />
      <span>Delete{votes ? ` it and its ${votes} vote${votes === 1 ? "" : "s"}` : ""}?</span>
      <span className="flex gap-2">
        <button disabled={pending} className="rounded bg-brick px-2 py-0.5 text-white disabled:opacity-50">
          {pending ? "…" : "Yes, delete"}
        </button>
        <button type="button" onClick={() => setSure(false)} className="underline">
          Keep
        </button>
      </span>
      {state && !state.ok && <span className="text-brick">{state.message}</span>}
    </form>
  );
}
