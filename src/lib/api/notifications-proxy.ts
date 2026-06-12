import { createServiceProxy } from "./service-proxy"

// Notification microservice (default port 3009, mounted at /api/notifications).
const { proxyJson } = createServiceProxy(
  "notifications",
  process.env.BACKEND_NOTIFICATIONS_API_URL
)

export { proxyJson as proxyToNotifications }
