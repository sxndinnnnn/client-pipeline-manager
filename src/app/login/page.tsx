import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="relative w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <h1 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Client Pipeline Manager
        </h1>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
