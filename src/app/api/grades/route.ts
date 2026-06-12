import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToGrades } from "@/lib/api/grades-proxy"

// Grade management (Teacher).
// GET    /api/grades            -> backend GET    {BACKEND}/grades (filters forwarded via query)
// POST   /api/grades            -> backend POST   {BACKEND}/grades
// PUT    /api/grades?id=...     -> backend PUT    {BACKEND}/grades/:id
// DELETE /api/grades?id=...     -> backend DELETE {BACKEND}/grades/:id

export async function GET(request: NextRequest) {
  return proxyToGrades(request, "/grades")
}

export async function POST(request: NextRequest) {
  return proxyToGrades(request, "/grades")
}

export async function PUT(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ message: "Missing grade id" }, { status: 400 })
  }
  return proxyToGrades(request, `/grades/${encodeURIComponent(id)}`)
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ message: "Missing grade id" }, { status: 400 })
  }
  return proxyToGrades(request, `/grades/${encodeURIComponent(id)}`)
}
