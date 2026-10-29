
type TicketTriagePayload = {
  ticketId: number;
  ticketCode: string;
  category: string;
  description: string;
  studentName: string;
  studentEmail: string;
  studentRollNo: string | null;
  studentDepartment: string | null;
  assignedStaffId: number | null;
};

export async function queueTicketTriage(
  payload: TicketTriagePayload,
): Promise<boolean> {
  const webhookUrl = process.env.N8N_TRIAGE_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.error("n8n configuration is missing.");
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-campusresolve-secret": webhookSecret,
      },
      body: JSON.stringify({
  ticket_id: payload.ticketId,
  ticket_code: payload.ticketCode,
  student_name: payload.studentName,
  roll_number: payload.studentRollNo ?? "",
  department: payload.studentDepartment ?? "",
  email: payload.studentEmail,
  issue_type: payload.category,
  description: payload.description,
  assigned_staff_id: payload.assignedStaffId,
}),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`n8n webhook failed: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unable to trigger n8n:", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
