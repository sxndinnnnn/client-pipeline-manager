import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/supabase/current-user";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-surface-sunken">
      <header className="relative border-b border-border bg-surface">
        <div className="flex items-center px-4 py-3 sm:px-6">
          <div className="flex flex-1 items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/branding/logo-dark.webp" alt="Logistix360" className="h-7 w-auto dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/logo-light.webp"
                alt="Logistix360"
                className="hidden h-7 w-auto dark:block"
              />
            </Link>
          </div>
          <nav className="hidden gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-3">
            <ThemeToggle />
            <div className="hidden lg:block">
              <UserMenu email={user?.email ?? ""} signOutAction={signOut} />
            </div>
            <MobileNav links={NAV_LINKS} userEmail={user?.email} signOutAction={signOut} />
          </div>
        </div>
      </header>
      <main className="w-full flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
