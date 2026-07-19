import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  allowedDevOrigins: [
    "localhost:3000",
    "0dee-2001-ee0-4f4f-aa00-705e-3cab-a257-c13c.ngrok-free.app",
  ],
};

export default nextConfig;
