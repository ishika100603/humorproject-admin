"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: [string, [string, string][]][] = [
  ["", [["/", "Dashboard"]]],
  ["Content", [["/media", "AI media"], ["/images", "Images"], ["/votes", "Votes"]]],
  ["Caption pipeline", [["/requests", "Generation requests"], ["/responses", "LLM responses"], ["/chains", "Prompt chains"], ["/terms", "Terms"], ["/examples", "Caption examples"], ["/models", "LLM models"], ["/providers", "LLM providers"]]],
  ["Access", [["/users", "Users"], ["/admins", "Admins"], ["/domains", "Signup domains"], ["/whitelist", "Whitelisted emails"]]],
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="-mx-4 mt-2 flex gap-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:mt-6 lg:grid lg:overflow-x-visible lg:overflow-y-auto lg:px-0 lg:pb-0">
      {GROUPS.map(([group, links]) => (
        <div key={group || "top"} className="flex shrink-0 items-center gap-0.5 lg:grid">
          {group && <p className="hidden px-3 pb-1 text-[11px] uppercase tracking-wide text-ink/40 lg:block">{group}</p>}
          {links.map(([href, label]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${active ? "bg-ink text-white" : "hover:bg-white"}`}>
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
