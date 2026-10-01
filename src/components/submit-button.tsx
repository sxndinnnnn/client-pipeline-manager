"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that disables itself while its parent form's action is running, so a
 * double click can't submit (and create) the same record twice. Must sit inside a <form>.
 */
export function SubmitButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {children}
    </button>
  );
}
