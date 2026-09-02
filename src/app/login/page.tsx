import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Client Pipeline Manager</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your team workspace.</p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-xs text-zinc-400">
          No self-signup — ask a teammate to invite you from the Supabase dashboard.
        </p>
      </div>
    </div>
  );
}
