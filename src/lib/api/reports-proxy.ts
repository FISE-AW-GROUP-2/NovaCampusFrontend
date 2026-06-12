import { createServiceProxy } from "./service-proxy"

// Reporting microservice (default port 3007, mounted at /api/reports).
const { proxyJson, proxyBinary } = createServiceProxy(
  "reports",
  process.env.BACKEND_REPORTING_API_URL
)

export { proxyJson as proxyToReports, proxyBinary as proxyBinaryToReports }
