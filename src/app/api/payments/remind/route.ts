import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToPayments } from "@/lib/api/payments-proxy"

// Payment reminders (Education Manager).
// POST /api/payments/remind?id=... -> backend POST {BACKEND}/payments/:id/remind
//   Triggers the Notification service for the student.
// GET  /api/payments/remind?id=... -> backend GET  {BACKEND}/payments/:id/reminders
//   Lists the ReminderLog entries of a payment.

export async function POST(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ message: "Missing payment id" }, { status: 400 })
  }
  return proxyToPayments(request, `/payments/${encodeURIComponent(id)}/remind`)
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ message: "Missing payment id" }, { status: 400 })
  }
  return proxyToPayments(request, `/payments/${encodeURIComponent(id)}/reminders`)
}
