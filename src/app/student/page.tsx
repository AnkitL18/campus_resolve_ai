import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";

function formatStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: string): string {
  switch (status) {
    case "RESOLVED":
    case "CLOSED":
      return "bg-green-100 text-green-700";

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";

    case "REOPENED":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function StudentDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const studentId = Number(session.user.id);

  if (!Number.isInteger(studentId)) {
    redirect("/login");
  }

  const [
    openCount,
    inProgressCount,
    resolvedCount,
    recentTickets,
  ] = await Promise.all([
    prisma.ticket.count({
      where: {
        studentId,
        status: {
          in: ["SUBMITTED", "ASSIGNED", "REOPENED"],
        },
      },
    }),

    prisma.ticket.count({
      where: {
        studentId,
        status: "IN_PROGRESS",
      },
    }),

    prisma.ticket.count({
      where: {
        studentId,
        status: {
          in: ["RESOLVED", "CLOSED"],
        },
      },
    }),

    prisma.ticket.findMany({
      where: {
        studentId,
      },

      include: {
        category: {
          select: {
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 10,
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Student Portal
            </p>

            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, {session.user.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {session.user.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/student/issues/new"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Report new issue
            </Link>

            <LogoutButton />
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Open tickets
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {openCount}
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              In progress
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {inProgressCount}
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {resolvedCount}
            </p>
          </article>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              My recent issues
            </h2>
          </div>

          {recentTickets.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">
                You have not submitted any issues.
              </p>

              <Link
                href="/student/issues/new"
                className="mt-4 inline-block font-semibold text-blue-700 hover:underline"
              >
                Report your first issue
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Urgency</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Submitted</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-800">
                        {ticket.ticketCode}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {ticket.category.name}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {ticket.urgency ?? "Pending AI review"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            ticket.status
                          )}`}
                        >
                          {formatStatus(ticket.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {ticket.createdAt.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}