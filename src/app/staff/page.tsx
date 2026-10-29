import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function StaffDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "STAFF") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700">
              Staff Portal
            </p>

            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, {session.user.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Assigned complaint management
            </p>
          </div>

          <LogoutButton />
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Assigned</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">High urgency</p>
            <p className="mt-2 text-3xl font-bold text-red-700">0</p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Overdue</p>
            <p className="mt-2 text-3xl font-bold text-orange-700">0</p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Assigned tickets
          </h2>

          <p className="mt-2 text-slate-500">
            Tickets assigned to your department will appear here.
          </p>
        </section>
      </div>
    </main>
  );
}