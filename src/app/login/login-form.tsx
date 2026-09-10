"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "./actions";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const [state, formAction, pending] = useActionState<{ error: string | null }, FormData>(
    signIn,
    { error: null }
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-muted"
        >
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 pr-10 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-subtle hover:text-foreground"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="text-center text-sm capitalize text-error">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Logging In" : "Login"}
      </button>
    </form>
  );
}
