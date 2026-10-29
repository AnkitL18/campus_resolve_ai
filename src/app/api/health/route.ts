import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [userCount, categoryCount, ticketCount, eventCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.category.count(),
        prisma.ticket.count(),
        prisma.ticketEvent.count(),
      ]);

    return Response.json(
      {
        status: "ok",
        database: "connected",
        message: "CampusResolve API is connected to MySQL",
        counts: {
          users: userCount,
          categories: categoryCount,
          tickets: ticketCount,
          ticketEvents: eventCount,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Database health check failed:", error);

    return Response.json(
      {
        status: "error",
        database: "disconnected",
        message: "Unable to connect to MySQL",
      },
      {
        status: 500,
      }
    );
  }
}