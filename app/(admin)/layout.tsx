import { requireAdmin } from "@/lib/admin";
import { signOut } from "../actions";
import Nav from "./nav";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-[100dvh] lg:flex">
      <aside className="sticky top-0 z-30 flex flex-col border-b border-ink/15 bg-face/95 px-4 py-3 backdrop-blur lg:h-[100dvh] lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r lg:bg-face/70 lg:px-5 lg:py-6">
        <div className="flex items-baseline justify-between gap-3 lg:block">
          <p className="hand text-sm">
            At 116 &amp; Broadway <span className="text-xs text-ink/50 lg:hidden">Admin</span>
          </p>
          <p className="hidden text-xs text-ink/50 lg:block">Admin</p>
          <form action={signOut} className="lg:hidden">
            <button className="text-xs underline">Sign out</button>
          </form>
        </div>
        <Nav />
        <div className="mt-auto hidden lg:block">
          <p className="truncate text-xs text-ink/60" title={user.email ?? ""}>
            {user.email}
          </p>
          <form action={signOut}>
            <button className="mt-2 text-xs underline">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-7">{children}</main>
    </div>
  );
}
