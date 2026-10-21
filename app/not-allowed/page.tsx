import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

export default async function NotAllowed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <main className="flex h-[100dvh] items-center justify-center px-6">
      <div className="card w-full max-w-sm px-8 py-10 text-center">
        <h1 className="text-xl font-medium">Not an admin</h1>
        <p className="mt-3 text-sm text-ink/70">
          {user?.email ?? "This account"} doesn&apos;t have admin access. Ask an existing admin to turn on{" "}
          <code className="rounded bg-white px-1">is_superadmin</code> for you.
        </p>
        <form action={signOut} className="mt-6">
          <button className="rounded-full border border-ink px-5 py-2 text-sm hover:bg-white">Sign in with another account</button>
        </form>
      </div>
    </main>
  );
}
