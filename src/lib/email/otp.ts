import { createHash, randomInt } from "crypto";

const OTP_LENGTH = 4;
const MAX_ATTEMPTS = 5;

export function generateOtpCode() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export function hashOtp(code: string, userId: string): string {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

export function verifyOtpHash(
  code: string,
  userId: string,
  hash: string,
): boolean {
  return hashOtp(code, userId) === hash;
}

export { OTP_LENGTH, MAX_ATTEMPTS };
