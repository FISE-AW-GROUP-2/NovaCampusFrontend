/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:3000/api"
    const absencesServiceUrl =
      process.env.BACKEND_ABSENCES_SERVICE_URL || "http://localhost:3005"
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
      // Justification documents are served as static files by the Absence
      // service; documentUrl values are relative "/uploads/..." paths.
      {
        source: "/uploads/:path*",
        destination: `${absencesServiceUrl}/uploads/:path*`,
      },
    ]
  },
}

export default nextConfig
