import type { ApiEnvelope } from "@/types/backend";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      credentials: "same-origin",
      cache: "no-store",
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiClientError("Could not reach the NEXORA backend.", 0);
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.ok) {
    const message = payload && !payload.ok ? payload.error : `Request failed with status ${response.status}.`;
    throw new ApiClientError(message, response.status);
  }

  return payload.data;
}
