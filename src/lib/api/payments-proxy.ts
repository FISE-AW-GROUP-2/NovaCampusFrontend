import { createServiceProxy } from "./service-proxy"

// Payment microservice (default port 3008, mounted at /api/payments).
const { proxyJson } = createServiceProxy(
  "payments",
  process.env.BACKEND_PAYMENTS_API_URL
)

export { proxyJson as proxyToPayments }
