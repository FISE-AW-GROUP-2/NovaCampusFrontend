import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// User management routes for the Central Admin. These use the auth-service
// proxy (proxy.ts) and avoid dynamic route segments — the user id is passed
// via query string or JSON body and injected into the backend path here.
//
// Backend (auth service) endpoints:
//   POST   /users        (Central Admin)  create
//   GET    /users                          getAll
//   GET    /users/:id                      getOne   (use ?id=)
//   PUT    /users/:id                      update
//   DELETE /users/:id    (Central Admin)  remove

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (id) {
    return proxyToBackend(request, `/users/${encodeURIComponent(id)}`)
  }
  return proxyToBackend(request, "/users")
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/users")
}

export async function PUT(request: NextRequest) {
  let id = request.nextUrl.searchParams.get("id")

  if (!id) {
    try {
      const text = await request.clone().text()
      if (text) {
        const body = JSON.parse(text)
        id = body.id || body._id
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!id) {
    return NextResponse.json(
      { message: "id query parameter or body id is required" },
      { status: 400 }
    )
  }

  return proxyToBackend(request, `/users/${encodeURIComponent(id)}`)
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json(
      { message: "id query parameter is required" },
      { status: 400 }
    )
  }
  return proxyToBackend(request, `/users/${encodeURIComponent(id)}`)
}
