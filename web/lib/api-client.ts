"use client";

import { authClient } from "@/lib/auth/client";

export type ApiMeResponse = {
  user_id: string;
  email: string | null;
  name: string | null;
};

export class ApiUnauthorizedError extends Error {
  constructor(message = "Session expired or invalid authentication token.") {
    super(message);
    this.name = "ApiUnauthorizedError";
  }
}

export class ApiClientError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
}

export async function getApiBearerToken(): Promise<string> {
  const result = await authClient.token();
  const token = result?.data?.token;
  if (!token) {
    throw new ApiUnauthorizedError("Could not mint a short-lived API token. Please sign in again.");
  }
  return token;
}

export async function fetchApiMe(): Promise<ApiMeResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiClientError("NEXT_PUBLIC_API_URL is not configured.");
  }

  const token = await getApiBearerToken();
  const response = await fetch(`${baseUrl}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new ApiUnauthorizedError("Your API token was rejected (401 Unauthorized).");
  }
  if (!response.ok) {
    throw new ApiClientError(`API /me failed with HTTP ${response.status}.`, response.status);
  }

  return (await response.json()) as ApiMeResponse;
}
