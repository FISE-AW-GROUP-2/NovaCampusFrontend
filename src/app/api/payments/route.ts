import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToPayments } from "@/lib/api/payments-proxy"

// Payment management (Education Manager) / read-only listing (Student).
// GET    /api/payments          -> backend GET    {BACKEND}/payments
// GET    /api/payments?id=...   -> backend GET    {BACKEND}/payments/:id
// POST   /api/payments          -> backend POST   {BACKEND}/payments
// PUT    /api/payments?id=...   -> backend PUT    {BACKEND}/payments/:id
// DELETE /api/payments?id=...   -> backend DELETE {BACKEND}/payments/:id

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (id) {
    return proxyToPayments(request, `/payments/${encodeURIComponent(id)}`)
  }
  return proxyToPayments(request, "/payments")
}

export async function POST(request: NextRequest) {
  return proxyToPayments(request, "/payments")
}

export async function PUT(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ message: "Missing payment id" }, { status: 400 })
  }
  return proxyToPayments(request, `/payments/${encodeURIComponent(id)}`)
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ message: "Missing payment id" }, { status: 400 })
  }
  return proxyToPayments(request, `/payments/${encodeURIComponent(id)}`)
}
