"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, Camera, Building2, Tag, Coins } from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Investments", href: "/dashboard/investments", icon: TrendingUp },
  { label: "Snapshots", href: "/dashboard/snapshots", icon: Camera },
  { label: "Banks", href: "/dashboard/banks", icon: Building2 },
  { label: "Account Types", href: "/dashboard/account-types", icon: Tag },
  { label: "Currencies", href: "/dashboard/currencies", icon: Coins },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
