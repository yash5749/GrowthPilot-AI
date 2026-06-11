"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Tags,
  Send,
  BarChart3,
  Rocket,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/segments", label: "Segments", icon: Tags },
  { href: "/campaigns", label: "Campaigns", icon: Send },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-[#ebebeb] bg-white sticky top-0">
      <div className="flex items-center gap-2.5 border-b border-[#ebebeb] px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#171717] text-white">
          <Rocket className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[#171717]">
          GrowthPilot
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-[#f5f5f5] text-[#171717] before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[#171717]"
                  : "text-[#888888] hover:bg-[#f5f5f5] hover:text-[#171717]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#ebebeb] px-5 py-3">
        <p className="text-[11px] text-[#a1a1a1]">GrowthPilot AI v0.1</p>
      </div>
    </aside>
  );
}
