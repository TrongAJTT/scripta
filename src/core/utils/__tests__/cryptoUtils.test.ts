import { describe, it, expect } from "vitest";
import {
  encryptData,
  decryptData,
  isEncryptedPayload,
  encryptWithDeviceKey,
  decryptWithDeviceKey,
  isDeviceEncryptedRecord,
} from "../cryptoUtils";

describe("cryptoUtils", () => {
  it("encrypts and decrypts text with password", async () => {
    const secret = "Top secret workspace payload 🔐";
    const password = "strong-passphrase-123";

    const payload = await encryptData(secret, password);
    expect(isEncryptedPayload(payload)).toBe(true);
    expect(payload.ciphertext).not.toContain(secret);

    const decrypted = await decryptData(payload, password);
    expect(decrypted).toBe(secret);
  });

  it("throws when decrypting with the wrong password", async () => {
    const payload = await encryptData("hello", "correct-password");
    await expect(decryptData(payload, "wrong-password")).rejects.toThrow(
      "Incorrect password or corrupted encrypted data.",
    );
  });

  it("rejects invalid payload structures in type guards", () => {
    expect(isEncryptedPayload(null)).toBe(false);
    expect(isEncryptedPayload({ version: 2 })).toBe(false);
    expect(isDeviceEncryptedRecord(null)).toBe(false);
    expect(isDeviceEncryptedRecord({ __encrypted: false })).toBe(false);
  });

  it("encrypts and decrypts using a device-bound AES-GCM CryptoKey", async () => {
    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );

    const tokenJson = JSON.stringify({ accessToken: "tok_123" });
    const record = await encryptWithDeviceKey(tokenJson, key);
    expect(isDeviceEncryptedRecord(record)).toBe(true);

    const decrypted = await decryptWithDeviceKey(record, key);
    expect(decrypted).toBe(tokenJson);
  });
});
