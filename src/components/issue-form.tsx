"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CategoryOption = {
  id: number;
  name: string;
};

type IssueFormProps = {
  categories: CategoryOption[];
};

type TicketResponse = {
  status: boolean;
  message: string;
  ticket?: {
    id: number;
    ticketCode: string;
    category: string;
    status: string;
    createdAt: string;
  };
};

export function IssueForm({
  categories,
}: IssueFormProps) {
  const router = useRouter();

  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setTicketCode("");

    if (!categoryId) {
      setErrorMessage("Please select an issue category.");
      return;
    }

    if (description.trim().length < 10) {
      setErrorMessage(
        "Description must contain at least 10 characters."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          categoryId: Number(categoryId),
          description: description.trim(),
        }),
      });

      const result =
        (await response.json()) as TicketResponse;

      if (!response.ok || !result.status) {
        setErrorMessage(
          result.message || "Unable to submit complaint."
        );
        return;
      }

      setSuccessMessage(result.message);
      setTicketCode(result.ticket?.ticketCode ?? "");
      setCategoryId("");
      setDescription("");

      router.refresh();
    } catch {
      setErrorMessage(
        "A network error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function returnToDashboard() {
    router.push("/student");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Issue category
          </label>

          <select
            id="category"
            value={categoryId}
            onChange={(event) =>
              setCategoryId(event.target.value)
            }
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select a category</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-slate-700"
            >
              Describe the issue
            </label>

            <span className="text-xs text-slate-500">
              {description.length}/2000
            </span>
          </div>

          <textarea
            id="description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            rows={8}
            minLength={10}
            maxLength={2000}
            required
            placeholder="Explain what happened, where it happened and how it is affecting students..."
            className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <p className="mt-2 text-xs text-slate-500">
            Do not include passwords, financial details or other
            unnecessary sensitive information.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg bg-green-50 px-4 py-4 text-sm text-green-800">
            <p className="font-semibold">
              {successMessage}
            </p>

            {ticketCode && (
              <p className="mt-1">
                Ticket ID:{" "}
                <span className="font-mono font-bold">
                  {ticketCode}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit complaint"}
          </button>

          <button
            type="button"
            onClick={returnToDashboard}
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Return to dashboard
          </button>
        </div>
      </form>
    </div>
  );
}