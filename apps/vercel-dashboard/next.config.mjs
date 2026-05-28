import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  outputFileTracingIncludes: {
    "/api/chat": ["./qa/rental-qa.yaml", "../../qa/rental-qa.yaml"],
    "/api/health": ["./qa/rental-qa.yaml", "../../qa/rental-qa.yaml"],
    "/dashboard": ["./qa/rental-qa.yaml", "../../qa/rental-qa.yaml"]
  }
};

export default nextConfig;
