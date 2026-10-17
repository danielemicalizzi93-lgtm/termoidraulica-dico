import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { storage } from "@/src/utils/storage";

const PIN_KEY = "dico_pin";

type LockState = {
  ready: boolean;
  hasPin: boolean;
  locked: boolean;
  unlock: (pin: string) => boolean;
  setPin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
};

const LockContext = createContext<LockState | null>(null);

export function LockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pin, setPinState] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const pinRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await storage.secureGet<string>(PIN_KEY, "");
      const value = stored || null;
      pinRef.current = value;
      setPinState(value);
      setLocked(!!value);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" && pinRef.current) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const unlock = useCallback((entered: string) => {
    if (pinRef.current && entered === pinRef.current) {
      setLocked(false);
      return true;
    }
    return false;
  }, []);

  const setPin = useCallback(async (newPin: string) => {
    await storage.secureSet(PIN_KEY, newPin);
    pinRef.current = newPin;
    setPinState(newPin);
    setLocked(false);
  }, []);

  const disablePin = useCallback(async () => {
    await storage.secureRemove(PIN_KEY);
    pinRef.current = null;
    setPinState(null);
    setLocked(false);
  }, []);

  const value = useMemo(
    () => ({ ready, hasPin: !!pin, locked, unlock, setPin, disablePin }),
    [ready, pin, locked, unlock, setPin, disablePin],
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error("useLock must be used within LockProvider");
  return ctx;
}
