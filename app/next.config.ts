import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@naviprotocol/lending", "@pythnetwork/pyth-sui-js"],
};

export default nextConfig;
