"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  LogOut,
  FileQuestion,
  Users,
  Package,
  BarChart3,
  ShoppingCart,
  BookOpen,
  UserCircle,
} from "lucide-react";
import type { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Pregled", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Pitanja", href: "/admin/questions", icon: <FileQuestion className="h-4 w-4" /> },
    { label: "Korisnici", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
    { label: "Paketi", href: "/admin/bundles", icon: <Package className="h-4 w-4" /> },
    { label: "Izvještaji", href: "/admin/reports", icon: <BarChart3 className="h-4 w-4" /> },
  ],
  creator: [
    { label: "Pregled", href: "/creator", icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      label: "Moja pitanja",
      href: "/creator/questions",
      icon: <FileQuestion className="h-4 w-4" />,
    },
  ],
  user: [
    { label: "Pregled", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Kupnja", href: "/dashboard/buy", icon: <ShoppingCart className="h-4 w-4" /> },
    {
      label: "Moja pitanja",
      href: "/dashboard/questions",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      label: "Povijest kupnji",
      href: "/dashboard/purchases",
      icon: <Package className="h-4 w-4" />,
    },
  ],
};

export function DashboardShell({
  role,
  userName,
  children,
}: {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS[role];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div className="flex h-screen bg-[#030304] text-[#ececf1]">
      <aside className="hidden w-64 flex-col border-r border-white/[0.08] bg-[#050506] md:flex">
        <div className="flex h-14 items-center px-6">
          <Link
            href="/"
            className="font-display text-xl tracking-[0.15em] text-[#ececf1]"
          >
            PUBKVIZ
          </Link>
        </div>
        <Separator className="bg-white/10" />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors",
                pathname === item.href
                  ? "bg-white/[0.08] text-[#ececf1]"
                  : "text-[#8b8b96] hover:bg-white/[0.04] hover:text-[#ececf1]"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/[0.08] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] text-[#9b9ba8]">{userName}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Odjava"
              className="text-[#8b8b96] hover:bg-white/10 hover:text-[#ececf1]"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#030304]/90 px-6 backdrop-blur-md md:hidden">
          <Link href="/" className="font-display text-lg tracking-[0.12em]">
            PUBKVIZ
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-[#8b8b96] hover:text-[#ececf1]"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-white/[0.08] px-4 py-2 md:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide",
                pathname === item.href
                  ? "bg-white/10 text-[#ececf1]"
                  : "text-[#6b6b78] hover:bg-white/5 hover:text-[#c8c8d4]"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 overflow-auto bg-[#030304] p-6">{children}</main>
      </div>
    </div>
  );
}
