import { createServiceProxy } from "./service-proxy"

// Grade microservice (default port 3006, mounted at /api/grades).
const { proxyJson, proxyBinary } = createServiceProxy(
  "grades",
  process.env.BACKEND_GRADES_API_URL
)

export { proxyJson as proxyToGrades, proxyBinary as proxyBinaryToGrades }
