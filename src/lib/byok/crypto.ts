"use client";

/**
 * Browser-side crypto helpers for the BYOK vault.
 *
 * Keys are encrypted with AES-256-GCM using the Web Crypto API. The
 * AES key is derived from a seed via PBKDF2 (310k iterations, SHA-256).
 *
 * THREAT MODEL
 * ------------
 * This protects API keys "at rest" in localStorage: ciphertext is not
 * human-readable, survives casual inspection, and is scoped so keys are
 * never stored in plaintext and never sent to our backend. Because the
 * derivation seed lives in the same origin, this is *obfuscation-grade*
 * protection against a determined attacker who has access to the browser
 * profile — the practical ceiling for client-only BYOK. Keys are kept in
 * memory (React state) while the app runs and are never logged or
 * transmitted anywhere except directly to the provider API at call time.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Derive an AES-256-GCM key from an opaque passphrase (seed + pepper).
 */
export async function deriveVaultKey(passphrase: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("omnieval:byok:v1"),
      iterations: 310_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a secret. Returns `base64(iv).base64(ciphertext+tag)`.
 */
export async function encryptSecret(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const iv = randomBytes(12);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext)),
  );
  return `${bytesToBase64(iv)}.${bytesToBase64(ciphertext)}`;
}

/**
 * Decrypt a payload produced by `encryptSecret`. Throws on malformed
 * payloads, wrong key, or tampered ciphertext (GCM auth tag fails).
 */
export async function decryptSecret(
  payload: string,
  key: CryptoKey,
): Promise<string> {
  const [ivBase64, dataBase64] = payload.split(".");
  if (!ivBase64 || !dataBase64) {
    throw new Error("Malformed encrypted payload");
  }
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivBase64) },
    key,
    base64ToBytes(dataBase64),
  );
  return decoder.decode(plaintext);
}

/** Best-effort heuristic mask for display: `sk-••••abcd`. */
export function maskSecret(secret: string): string {
  const trimmed = secret.trim();
  if (trimmed.length <= 8) return "••••";
  const prefix = trimmed.slice(0, 3);
  const tail = trimmed.slice(-4);
  return `${prefix}••••${tail}`;
}
