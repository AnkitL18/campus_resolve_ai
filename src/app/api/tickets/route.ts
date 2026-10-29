
import { randomUUID } from "crypto";
import { z } from "zod";

import { auth } from "@/auth";
import { queueTicketTriage } from "@/lib/n8n";
import { prisma } from "@/lib/prisma";

const ticketSchema = z.object({
  categoryId: z.coerce.number().int().positive(),

  description: z
    .string()
    .trim()
    .min(10, "Description must contain at least 10 characters.")
    .max(2000, "Description cannot exceed 2000 characters."),
});

function generateTicketCode(): string {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const randomPart = randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `CR-${date}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    // Step 1: Authenticate the current user
    const session = await auth();

    if (!session?.user) {
      return Response.json(
        {
          status: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    // Step 2: Only students can submit tickets
    if (session.user.role !== "STUDENT") {
      return Response.json(
        {
          status: false,
          message: "Only students can submit complaints.",
        },
        { status: 403 },
      );
    }

    const studentId = Number(session.user.id);

    if (!Number.isSafeInteger(studentId) || studentId <= 0) {
      return Response.json(
        {
          status: false,
          message: "Invalid authenticated user.",
        },
        { status: 401 },
      );
    }

    // Step 3: Fetch student details from MySQL
    // NEW: Includes roll number and department
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true,
        department: true,
        role: true,
      },
    });

    if (!student || student.role !== "STUDENT") {
      return Response.json(
        {
          status: false,
          message: "Student account not found.",
        },
        { status: 403 },
      );
    }

    // Step 4: Validate ticket request
    const body: unknown = await request.json();
    const parsed = ticketSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          status: false,
          message:
            parsed.error.issues[0]?.message ??
            "Invalid complaint details.",
        },
        { status: 400 },
      );
    }

    // Step 5: Verify selected category
    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        active: true,
      },
    });

    if (!category) {
      return Response.json(
        {
          status: false,
          message: "Selected category was not found.",
        },
        { status: 404 },
      );
    }

    // Step 6: Generate unique ticket code
    const ticketCode = generateTicketCode();

    // Step 7: Save ticket and event in MySQL
    const ticket = await prisma.$transaction(
      async (transaction) => {
        const createdTicket = await transaction.ticket.create({
          data: {
            ticketCode,
            studentId,
            categoryId: category.id,
            assignedStaffId: category.responsibleStaffId,
            description: parsed.data.description,
            status: "SUBMITTED",
            urgency: null,
            aiSummary: null,
          },

          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        await transaction.ticketEvent.create({
          data: {
            ticketId: createdTicket.id,
            previousStatus: null,
            newStatus: "SUBMITTED",
            note: "Complaint submitted by student.",
            createdById: studentId,
          },
        });

        return createdTicket;
      },
    );

    // Step 8: Send ticket and student details to n8n
    // NEW: Sends roll number and department from MySQL
    const triageQueued = await queueTicketTriage({
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      category: ticket.category.name,
      description: ticket.description,
      studentName: student.name,
      studentEmail: student.email,
      studentRollNo: student.rollNo,
      studentDepartment: student.department,
      assignedStaffId: category.responsibleStaffId,
    });

    // Step 9: Return successful API response
    return Response.json(
      {
        status: true,
        message: triageQueued
          ? "Complaint submitted and sent for AI triage."
          : "Complaint submitted, but AI triage is temporarily unavailable.",
        triageQueued,
        ticket: {
          id: ticket.id,
          ticketCode: ticket.ticketCode,
          category: ticket.category.name,
          status: ticket.status,
          createdAt: ticket.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Ticket creation failed:", error);

    return Response.json(
      {
        status: false,
        message: "Unable to submit complaint.",
      },
      { status: 500 },
    );
  }
}
