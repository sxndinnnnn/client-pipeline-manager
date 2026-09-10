import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface-sunken px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/branding/login-bg-light.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/branding/login-bg-dark.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 hidden h-full w-full object-cover dark:block"
      />
      <div className="absolute inset-0 bg-background/70 dark:bg-background/65" />

      <div className="fixed right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-floating">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/logo-dark.webp" alt="Logistix360" className="h-10 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-light.webp"
            alt="Logistix360"
            className="hidden h-10 w-auto dark:block"
          />
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
