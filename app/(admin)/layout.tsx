import { requireAdmin } from "@/lib/admin";
import { signOut } from "../actions";
import Nav from "./nav";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireAdmin();
  return (
    <div className="flex min-h-[100dvh]">
      <aside className="sticky top-0 flex h-[100dvh] w-56 shrink-0 flex-col border-r border-ink/15 bg-face/70 px-5 py-6">
        <p className="hand text-sm">At 116 &amp; Broadway</p>
        <p className="text-xs text-ink/50">Admin</p>
        <Nav />
        <div className="mt-auto">
          <p className="truncate text-xs text-ink/60" title={user.email ?? ""}>
            {user.email}
          </p>
          <form action={signOut}>
            <button className="mt-2 text-xs underline">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-7">{children}</main>
    </div>
  );
}
