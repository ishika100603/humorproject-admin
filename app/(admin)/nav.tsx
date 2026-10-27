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
    <nav className="mt-6 grid gap-4 overflow-y-auto">
      {GROUPS.map(([group, links]) => (
        <div key={group || "top"} className="grid gap-0.5">
          {group && <p className="px-3 pb-1 text-[11px] uppercase tracking-wide text-ink/40">{group}</p>}
          {links.map(([href, label]) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href} className={`rounded-md px-3 py-1.5 text-sm ${active ? "bg-ink text-white" : "hover:bg-white"}`}>
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
