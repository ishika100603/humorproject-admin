"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { deleteImage, updateImage, uploadImage, type ActionState } from "./actions";

export function UploadForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadImage, null);
  const [preview, setPreview] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setPreview(null);
    }
  }, [state]);
  return (
    <form ref={ref} action={action} className="card mt-5 grid gap-3 p-4 md:grid-cols-[auto_1fr_auto] md:items-end">
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
      <label className="grid gap-1 text-xs text-ink/60">
        Description (optional)
        <input name="description" maxLength={300} placeholder="Low Steps at sunset" className="rounded-md border border-ink/25 bg-white px-3 py-2 text-sm" />
      </label>
      <div className="grid gap-1">
        <button disabled={pending} className="h-10 rounded-md bg-ink px-5 text-sm text-white hover:bg-navy disabled:opacity-50">
          {pending ? "Uploading…" : "Upload image"}
        </button>
        {state && <p className={`text-xs ${state.ok ? "text-navy" : "text-brick"}`}>{state.message}</p>}
      </div>
    </form>
  );
}

export function ImageCard({ id, url, description, meta }: { id: number; url: string; description: string | null; meta: string }) {
  const [editing, setEditing] = useState(false);
  const [sure, setSure] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(updateImage, null);
  const [del, delAction, deleting] = useActionState<ActionState, FormData>(deleteImage, null);
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);
  return (
    <div className="card overflow-hidden">
      <a href={url} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={description ?? ""} className="aspect-square w-full bg-white object-cover" loading="lazy" />
      </a>
      <div className="grid gap-1.5 p-3 text-xs">
        {editing ? (
          <form action={action} className="grid gap-1.5">
            <input type="hidden" name="id" value={id} />
            <input name="description" defaultValue={description ?? ""} maxLength={300} autoFocus className="rounded-md border border-ink/25 bg-white px-2 py-1 text-sm" />
            <div className="flex gap-2">
              <button disabled={pending} className="rounded-md bg-ink px-3 py-1 text-white disabled:opacity-50">
                {pending ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="underline">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="min-h-5 text-sm leading-snug">{description || <span className="text-ink/40">No description</span>}</p>
        )}
        <p className="text-ink/50">{meta}</p>
        {!editing && (
          <div className="flex gap-3">
            <button onClick={() => setEditing(true)} className="text-navy underline">
              Edit
            </button>
            {sure ? (
              <form action={delAction} className="flex gap-2">
                <input type="hidden" name="id" value={id} />
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
        {state && !state.ok && <p className="text-brick">{state.message}</p>}
        {del && !del.ok && <p className="text-brick">{del.message}</p>}
      </div>
    </div>
  );
}
