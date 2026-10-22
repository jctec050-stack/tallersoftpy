export const SESSION_COOKIE_NAME = "tallersoft_admin_session";
const DEFAULT_SECRET = "tallersoft-sanluis-secret-key-2026-auth-session";
const DEFAULT_PIN = "2026";

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
}

export function getExpectedPin(): string {
  return (process.env.ADMIN_PIN || DEFAULT_PIN).trim();
}

export function verifyPin(enteredPin: string): boolean {
  if (!enteredPin) return false;
  const expected = getExpectedPin();
  return enteredPin.trim() === expected;
}

// Convert string to Uint8Array
function stringToUint8Array(str: string): BufferSource {
  return new TextEncoder().encode(str) as unknown as BufferSource;
}

// Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Sign data with HMAC-SHA256
async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    stringToUint8Array(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    stringToUint8Array(data)
  );
  return bufferToHex(signature);
}

// Create Signed Session Token
export async function createSessionToken(rememberMe: boolean = true): Promise<{ token: string; maxAge: number }> {
  const durationMs = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 24 * 60 * 60 * 1000;      // 1 day

  const maxAgeSeconds = Math.floor(durationMs / 1000);
  const payload = {
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + durationMs,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = await sign(payloadStr, getSecret());
  const token = `${payloadStr}.${signature}`;

  return { token, maxAge: maxAgeSeconds };
}

// Verify Session Token (Safe for Middleware & Server Actions)
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payloadStr, signature] = parts;
    const expectedSignature = await sign(payloadStr, getSecret());

    // Constant-time comparison
    if (signature !== expectedSignature) {
      return false;
    }

    const payloadJson = Buffer.from(payloadStr, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    if (payload.role !== "admin") return false;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}
