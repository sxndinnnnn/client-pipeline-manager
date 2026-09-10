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
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-sunken text-xl font-bold text-foreground">
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
          className="text-subtle hover:text-foreground disabled:opacity-50"
        >
          {logoUrl ? "Change" : "Upload"}
        </button>
        {logoUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="text-error hover:opacity-80 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="max-w-[8rem] text-center text-xs text-error">{error}</p>}
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
