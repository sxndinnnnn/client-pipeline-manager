"use client";

import { useRef, useState, useTransition } from "react";
import { removeClientLogo, uploadClientLogo } from "../actions";

export function ClientLogo({
  clientId,
  logoUrl,
  initials,
}: {
  clientId: string;
  logoUrl: string | null;
  initials: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.append("logo", file);
    startTransition(async () => {
      try {
        await uploadClientLogo(clientId, formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload logo");
      }
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeClientLogo(clientId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove logo");
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-xl font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {logoUrl ? "Change" : "Upload"}
        </button>
        {logoUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="max-w-[8rem] text-center text-xs text-red-600 dark:text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
