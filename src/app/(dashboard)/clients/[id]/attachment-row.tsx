"use client";

import { useState } from "react";
import { DownloadIcon, TrashIcon } from "@/components/icons";
import { deleteAttachment } from "./attachments-actions";
import type { ClientAttachment } from "@/types/database";

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentRow({
  attachment,
  clientId,
  viewUrl,
  downloadUrl,
}: {
  attachment: ClientAttachment;
  clientId: string;
  viewUrl: string | null;
  downloadUrl: string | null;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {viewUrl ? (
          <a
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all hover:underline"
          >
            {attachment.file_name}
          </a>
        ) : (
          attachment.file_name
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted">{formatBytes(attachment.size_bytes)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          {downloadUrl && (
            <a
              href={downloadUrl}
              aria-label="Download attachment"
              className="p-3.5 text-subtle hover:text-foreground lg:p-0"
            >
              <DownloadIcon />
            </a>
          )}
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              if (!window.confirm(`Delete "${attachment.file_name}"? This can't be undone.`)) return;
              setDeleting(true);
              const result = await deleteAttachment(clientId, attachment.id);
              if (result.error) alert(result.error);
              setDeleting(false);
            }}
            aria-label="Delete attachment"
            className="p-3.5 text-error hover:opacity-80 disabled:opacity-40 lg:p-0"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}
