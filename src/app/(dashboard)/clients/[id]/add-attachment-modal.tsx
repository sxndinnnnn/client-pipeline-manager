"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@/components/icons";
import { MAX_ATTACHMENT_BYTES, uploadToSignedUrl } from "@/lib/supabase/browser-upload";
import { prepareUpload, saveAttachment } from "./attachments-actions";

export function AddAttachmentModal({ clientId }: { clientId: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading) return;

    const files = Array.from(
      (e.currentTarget.elements.namedItem("files") as HTMLInputElement).files ?? []
    );
    if (files.length === 0) return;

    const tooBig = files.find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than 25 MB.`);
      return;
    }

    setError(null);
    setUploading(true);

    for (const [i, file] of files.entries()) {
      setStatus(`Uploading ${i + 1} of ${files.length}: ${file.name}`);

      const prepared = await prepareUpload(clientId, file.name, file.size);
      if (prepared.error || !prepared.path || !prepared.token) {
        setError(prepared.error ?? "Could not start the upload.");
        break;
      }

      const uploadError = await uploadToSignedUrl(prepared.path, prepared.token, file);
      if (uploadError) {
        setError(uploadError);
        break;
      }

      const saved = await saveAttachment(clientId, {
        path: prepared.path,
        name: file.name,
        size: file.size,
        type: file.type,
      });
      if (saved.error) {
        setError(saved.error);
        break;
      }

      if (i === files.length - 1) {
        formRef.current?.reset();
        dialogRef.current?.close();
        router.refresh();
      }
    }

    setUploading(false);
    setStatus(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Add Attachment
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current && !uploading) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
      >
        <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Add Attachment</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={uploading}
              aria-label="Close"
              className="p-3.5 text-subtle hover:text-foreground disabled:opacity-40 lg:p-0"
            >
              <XIcon />
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-muted">Files * (up to 25 MB each)</label>
              <input
                name="files"
                type="file"
                multiple
                required
                disabled={uploading}
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-surface-sunken file:px-2 file:py-1 file:text-sm file:text-foreground"
              />
            </div>
            {status && <p className="text-xs text-muted">{status}</p>}
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              type="submit"
              disabled={uploading}
              className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
