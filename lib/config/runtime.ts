export function getPublicAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${deployment.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export function deploymentInfo() {
  return {
    appUrl: getPublicAppUrl(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || null,
  };
}
