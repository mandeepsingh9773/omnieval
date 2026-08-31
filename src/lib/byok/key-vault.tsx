"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  bytesToBase64,
  decryptSecret,
  deriveVaultKey,
  encryptSecret,
  randomBytes,
} from "./crypto";
import { validateProviderKey } from "./validation";
import type { KeyProvider, KeyVaultState, ValidationResult } from "./types";

export type { KeyProvider, KeyVaultState, ValidationResult };

const VAULT_STORAGE_KEY = "omnieval:byok:vault:v1";
const SEED_STORAGE_KEY = "omnieval:byok:seed:v1";

const PROVIDERS: readonly KeyProvider[] = ["openai", "anthropic", "gemini", "groq"];

const EMPTY_STATE: KeyVaultState = {
  openai: "",
  anthropic: "",
  gemini: "",
  groq: "",
};

interface StoredVault {
  v: 1;
  entries: Partial<Record<KeyProvider, string>>;
}

export interface KeyVaultContextValue {
  /** True once persisted keys have been decrypted into memory. */
  isReady: boolean;
  /** Plaintext keys in memory only. Values are empty strings when unset. */
  keys: KeyVaultState;
  hasKey: (provider: KeyProvider) => boolean;
  getKey: (provider: KeyProvider) => string;
  setKey: (provider: KeyProvider, key: string) => Promise<void>;
  removeKey: (provider: KeyProvider) => Promise<void>;
  clearKeys: () => Promise<void>;
  validateKey: (provider: KeyProvider) => Promise<ValidationResult>;
}

const KeyVaultContext = createContext<KeyVaultContextValue | null>(null);

/**
 * Builds (and lazily persists) the per-origin derivation seed, then derives
 * the AES-256-GCM vault key from `seed + pepper` via PBKDF2.
 */
async function acquireVaultKey(): Promise<CryptoKey> {
  const pepper = process.env.NEXT_PUBLIC_BYOK_PEPPER ?? "omnieval-default-pepper";

  let seed = window.localStorage.getItem(SEED_STORAGE_KEY);
  if (!seed) {
    seed = bytesToBase64(randomBytes(32));
    window.localStorage.setItem(SEED_STORAGE_KEY, seed);
  }

  return deriveVaultKey(`${seed}::${pepper}`);
}

function readStoredVault(): StoredVault | null {
  try {
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredVault;
    if (parsed?.v !== 1 || !parsed?.entries) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredVault(entries: Partial<Record<KeyProvider, string>>): void {
  const payload: StoredVault = { v: 1, entries };
  window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(payload));
}

async function decryptVault(stored: StoredVault, key: CryptoKey): Promise<KeyVaultState> {
  const result: KeyVaultState = { ...EMPTY_STATE };
  await Promise.all(
    PROVIDERS.map(async (provider) => {
      const ciphertext = stored.entries[provider];
      if (!ciphertext) return;
      try {
        result[provider] = await decryptSecret(ciphertext, key);
      } catch {
        // Corrupt or undecryptable entry (e.g. seed rotated). Drop it.
      }
    }),
  );
  return result;
}

export function KeyVaultProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [keys, setKeys] = useState<KeyVaultState>(EMPTY_STATE);

  const vaultKeyRef = useRef<CryptoKey | null>(null);
  const keysRef = useRef<KeyVaultState>(EMPTY_STATE);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);

  // Initial decryption of persisted ciphertext.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const vaultKey = await acquireVaultKey();
        vaultKeyRef.current = vaultKey;
        const stored = readStoredVault();
        const decrypted = stored ? await decryptVault(stored, vaultKey) : { ...EMPTY_STATE };
        if (!cancelled) {
          keysRef.current = decrypted;
          setKeys(decrypted);
        }
      } catch (error) {
        console.error("[KeyVault] failed to initialise vault:", error);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep other tabs in sync when the vault changes.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== VAULT_STORAGE_KEY || !vaultKeyRef.current) return;
      const stored = readStoredVault();
      if (!stored) {
        keysRef.current = { ...EMPTY_STATE };
        setKeys(EMPTY_STATE);
        return;
      }
      void decryptVault(stored, vaultKeyRef.current).then((decrypted) => {
        keysRef.current = decrypted;
        setKeys(decrypted);
      });
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Serialized, encrypted write-back of the full vault state. */
  const persist = useCallback((next: KeyVaultState): Promise<void> => {
    const vaultKey = vaultKeyRef.current;
    if (!vaultKey) {
      return Promise.reject(new Error("[KeyVault] vault is not ready yet"));
    }

    const task = async () => {
      const entries: Partial<Record<KeyProvider, string>> = {};
      for (const provider of PROVIDERS) {
        const value = next[provider];
        if (value) {
          entries[provider] = await encryptSecret(value, vaultKey);
        }
      }
      writeStoredVault(entries);
    };

    writeQueueRef.current = writeQueueRef.current.then(task, task);
    return writeQueueRef.current;
  }, []);

  const commit = useCallback(
    (next: KeyVaultState) => {
      keysRef.current = next;
      setKeys(next);
    },
    [],
  );

  const setKey = useCallback(
    async (provider: KeyProvider, key: string) => {
      const trimmed = key.trim();
      const next = { ...keysRef.current, [provider]: trimmed };
      await persist(next);
      commit(next);
    },
    [persist, commit],
  );

  const removeKey = useCallback(
    async (provider: KeyProvider) => {
      const next = { ...keysRef.current, [provider]: "" };
      await persist(next);
      commit(next);
    },
    [persist, commit],
  );

  const clearKeys = useCallback(async () => {
    const next: KeyVaultState = { ...EMPTY_STATE };
    await persist(next);
    commit(next);
  }, [persist, commit]);

  const validateKey = useCallback(
    (provider: KeyProvider): Promise<ValidationResult> => {
      const value = keysRef.current[provider];
      if (!value) {
        return Promise.resolve({
          ok: false,
          status: "invalid",
          message: "No key is stored for this provider yet.",
        });
      }
      return validateProviderKey(provider, value);
    },
    [],
  );

  const hasKey = useCallback(
    (provider: KeyProvider) => Boolean(keysRef.current[provider]),
    [],
  );

  const getKey = useCallback(
    (provider: KeyProvider) => keysRef.current[provider],
    [],
  );

  const value = useMemo<KeyVaultContextValue>(
    () => ({
      isReady,
      keys,
      hasKey,
      getKey,
      setKey,
      removeKey,
      clearKeys,
      validateKey,
    }),
    [isReady, keys, hasKey, getKey, setKey, removeKey, clearKeys, validateKey],
  );

  return <KeyVaultContext.Provider value={value}>{children}</KeyVaultContext.Provider>;
}

export function useKeyVault(): KeyVaultContextValue {
  const context = useContext(KeyVaultContext);
  if (!context) {
    throw new Error("useKeyVault must be used within a <KeyVaultProvider>.");
  }
  return context;
}
