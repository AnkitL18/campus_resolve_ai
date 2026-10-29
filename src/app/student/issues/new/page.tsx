import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { IssueForm } from "@/components/issue-form";
import { prisma } from "@/lib/prisma";

export default async function NewIssuePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const categories = await prisma.category.findMany({
    where: {
      active: true,
    },

    select: {
      id: true,
      name: true,
    },

    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/student"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            ← Back to dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Report a college issue
          </h1>

          <p className="mt-2 text-slate-600">
            Select the appropriate category and describe the
            problem clearly.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-2xl bg-yellow-50 p-6 text-yellow-800">
            No active issue categories are currently available.
          </div>
        ) : (
          <IssueForm categories={categories} />
        )}
      </div>
    </main>
  );
}