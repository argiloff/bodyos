"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/products", label: "Produkte" },
  { href: "/recipes", label: "Rezepte" },
  { href: "/planner", label: "Plan" },
  { href: "/import", label: "Import" },
  { href: "/profile", label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-lg">
      <div className="grid grid-cols-6 text-sm text-neutral-200">
        {links.map((link) => {
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-2 ${
                active ? "text-white font-semibold" : "text-neutral-400"
              }`}
            >
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
