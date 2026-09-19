/**
 * Zero-Knowledge Client-Side Encryption Utilities using Web Crypto API.
 * Uses AES-GCM 256-bit encryption with PBKDF2 (HMAC-SHA256) key derivation.
 */

export interface EncryptedPayload {
  version: 1;
  algorithm: "AES-GCM-256";
  salt: string; // Base64
  iv: string; // Base64
  ciphertext: string; // Base64
}

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256;

/**
 * Encodes an ArrayBuffer or Uint8Array to a Base64 string.
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string to a Uint8Array.
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM CryptoKey from a user password and salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts a plaintext UTF-8 string with a password using AES-GCM.
 */
export async function encryptData(
  plaintext: string,
  password: string,
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate 16 bytes salt and 12 bytes IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as ArrayBuffer,
    },
    key,
    data,
  );

  return {
    version: 1,
    algorithm: "AES-GCM-256",
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer),
  };
}

/**
 * Decrypts an EncryptedPayload with a password, returning the plaintext UTF-8 string.
 * Throws an Error if the password is incorrect or data is corrupted.
 */
export async function decryptData(
  payload: EncryptedPayload,
  password: string,
): Promise<string> {
  if (payload.version !== 1 || payload.algorithm !== "AES-GCM-256") {
    throw new Error("Unsupported encryption format or version.");
  }

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(password, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as unknown as ArrayBuffer,
      },
      key,
      ciphertext as unknown as ArrayBuffer,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error("Incorrect password or corrupted encrypted data.");
  }
}

/**
 * Helper to test if a string represents an EncryptedPayload JSON.
 */
export function isEncryptedPayload(data: unknown): data is EncryptedPayload {
  if (typeof data !== "object" || data === null) return false;
  const p = data as Record<string, unknown>;
  return (
    p.version === 1 &&
    p.algorithm === "AES-GCM-256" &&
    typeof p.salt === "string" &&
    typeof p.iv === "string" &&
    typeof p.ciphertext === "string"
  );
}

export interface DeviceEncryptedRecord {
  __encrypted: true;
  version: 1;
  iv: string; // Base64
  ciphertext: string; // Base64
}

export function isDeviceEncryptedRecord(data: unknown): data is DeviceEncryptedRecord {
  if (typeof data !== "object" || data === null) return false;
  const p = data as Record<string, unknown>;
  return (
    p.__encrypted === true &&
    p.version === 1 &&
    typeof p.iv === "string" &&
    typeof p.ciphertext === "string"
  );
}

/**
 * Encrypts data directly with a device-bound CryptoKey.
 */
export async function encryptWithDeviceKey(
  plaintext: string,
  key: CryptoKey,
): Promise<DeviceEncryptedRecord> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as ArrayBuffer,
    },
    key,
    data,
  );

  return {
    __encrypted: true,
    version: 1,
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer),
  };
}

/**
 * Decrypts data using a device-bound CryptoKey.
 */
export async function decryptWithDeviceKey(
  record: DeviceEncryptedRecord,
  key: CryptoKey,
): Promise<string> {
  const iv = base64ToBuffer(record.iv);
  const ciphertext = base64ToBuffer(record.ciphertext);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as ArrayBuffer,
    },
    key,
    ciphertext as unknown as ArrayBuffer,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
