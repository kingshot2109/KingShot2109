import { config } from "./config";
export type Status = "Pending" | "Approved" | "Rejected";
export interface Application {
  id: number;
  inGameName: string;
  currentKingdom: number;
  totalPower: number;
  killPoints: number;
  troopTier: string;
  discordHandle: string;
  primaryLanguage: string;
  timeZone: string;
  screenshotUrl: string;
  additionalNotes: string;
  status: Status;
  submittedAt: string;
}
export interface ApplicationPage {
  items: Application[];
  total: number;
  page: number;
  pageSize: number;
}
export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  key?: string,
): Promise<T> {
  const isStaticApplicationSubmit =
    path === "/applications" && options.method === "POST";
  if (!config.apiUrl && !isStaticApplicationSubmit)
    throw new ApiError("requestError", 503);

  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("networkError", 0);
  }
  if (!response.ok) {
    throw new ApiError(
      response.status === 401
        ? "invalidKey"
        : response.status === 429
          ? "rateLimited"
          : response.status === 503
            ? "notConfigured"
            : "requestError",
      response.status,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export function errorKey(error: unknown) {
  return error instanceof ApiError ? error.code : "requestError";
}
