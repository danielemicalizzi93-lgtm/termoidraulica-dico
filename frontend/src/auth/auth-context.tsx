import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import { api, setToken } from "@/src/api/client";

WebBrowser.maybeCompleteAuthSession();

export type User = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  auth_provider: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function extractSessionId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/[?#&]session_id=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const handledSessions = useRef<Set<string>>(new Set());

  const exchangeSession = useCallback(async (sessionId: string) => {
    if (handledSessions.current.has(sessionId)) return;
    handledSessions.current.add(sessionId);
    const res = await api<{ session_token: string; user: User }>("/auth/session", {
      method: "POST",
      body: { session_id: sessionId },
    });
    await setToken(res.session_token);
    setUser(res.user);
  }, []);

  useEffect(() => {
    let sub: Linking.EventSubscription | undefined;

    async function init() {
      // Web: process session_id from URL first
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const sid = extractSessionId(window.location.href);
        if (sid) {
          try {
            await exchangeSession(sid);
            window.history.replaceState(
              window.history.state,
              "",
              window.location.pathname,
            );
            setLoading(false);
            return;
          } catch {
            // fall through to session check
          }
        }
      } else {
        // Mobile: cold-start deep link
        const initial = await Linking.getInitialURL();
        const sid = extractSessionId(initial);
        if (sid) {
          try {
            await exchangeSession(sid);
          } catch {
            // ignore
          }
        }
        sub = Linking.addEventListener("url", async ({ url }) => {
          const s = extractSessionId(url);
          if (s) {
            try {
              await exchangeSession(s);
            } catch {
              // ignore
            }
          }
        });
      }

      // Check existing session
      try {
        const res = await api<{ user: User }>("/auth/me");
        setUser(res.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    init();
    return () => sub?.remove();
  }, [exchangeSession]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const res = await api<{ session_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await setToken(res.session_token);
    setUser(res.user);
  }, []);

  const signUpEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api<{ session_token: string; user: User }>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      await setToken(res.session_token);
      setUser(res.user);
    },
    [],
  );

  const signInGoogle = useCallback(async () => {
    const redirectUrl =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.origin + "/"
        : Linking.createURL("");
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = authUrl;
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    let sid: string | null = null;
    if (result.type === "success" && result.url) {
      sid = extractSessionId(result.url);
    }
    if (!sid) {
      const initial = await Linking.getInitialURL();
      sid = extractSessionId(initial);
    }
    if (sid) {
      await exchangeSession(sid);
    }
  }, [exchangeSession]);

  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    await setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInEmail, signUpEmail, signInGoogle, signOut }),
    [user, loading, signInEmail, signUpEmail, signInGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
