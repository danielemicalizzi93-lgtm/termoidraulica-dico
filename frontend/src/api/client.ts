import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
export const TOKEN_KEY = "dico_session_token";

let inMemoryToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  const t = await storage.secureGet<string | null>(TOKEN_KEY, null);
  inMemoryToken = t;
  return t;
}

export async function setToken(token: string | null) {
  inMemoryToken = token;
  if (token) await storage.secureSet(TOKEN_KEY, token);
  else await storage.secureRemove(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: string;
  body?: unknown;
};

export async function api<T = any>(path: string, options: Options = {}): Promise<T> {
  const token = await loadToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    await setToken(null);
    throw new ApiError(401, "Sessione scaduta");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || "Errore di rete";
    throw new ApiError(res.status, typeof detail === "string" ? detail : "Errore");
  }
  return data as T;
}
