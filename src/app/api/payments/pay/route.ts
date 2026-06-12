import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToPayments } from "@/lib/api/payments-proxy"

// Mark a payment as paid (Education Manager).
// PATCH /api/payments/pay?id=... -> backend PATCH {BACKEND}/payments/:id/pay
export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ message: "Missing payment id" }, { status: 400 })
  }
  return proxyToPayments(request, `/payments/${encodeURIComponent(id)}/pay`)
}
