"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/", "Dashboard"],
  ["/media", "AI media"],
  ["/users", "Users"],
  ["/votes", "Votes"],
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="mt-8 grid gap-1">
      {LINKS.map(([href, label]) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-sm ${active ? "bg-ink text-white" : "hover:bg-white"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
