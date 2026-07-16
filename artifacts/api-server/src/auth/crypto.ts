import {
  argon2,
  createHmac,
  randomBytes,
  timingSafeEqual,
  type Argon2Parameters,
} from "node:crypto";

export interface Argon2idOptions {
  memoryKiB: number;
  passes: number;
  parallelism: number;
  tagLength: number;
}

const PASSWORD_FORMAT =
  /^ytt-argon2id:v1:m=(\d+),t=(\d+),p=(\d+),l=(\d+):([A-Za-z0-9_-]+):([A-Za-z0-9_-]+)$/;

function deriveArgon2id(parameters: Argon2Parameters): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    argon2("argon2id", parameters, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

function validateArgon2idOptions(options: Argon2idOptions): void {
  if (
    !Number.isInteger(options.memoryKiB) ||
    options.memoryKiB <= 8 * options.parallelism ||
    options.memoryKiB > 262_144 ||
    !Number.isInteger(options.passes) ||
    options.passes < 2 ||
    options.passes > 10 ||
    !Number.isInteger(options.parallelism) ||
    options.parallelism < 2 ||
    options.parallelism > 16 ||
    !Number.isInteger(options.tagLength) ||
    options.tagLength < 16 ||
    options.tagLength > 64
  ) {
    throw new Error("Invalid Argon2id parameters.");
  }
}

function passwordBuffer(password: string): Buffer {
  const value = Buffer.from(password, "utf8");
  if (value.length === 0 || value.length > 1024) {
    throw new Error("Password length is outside the supported range.");
  }
  return value;
}

export async function hashPassword(
  password: string,
  options: Argon2idOptions,
): Promise<string> {
  validateArgon2idOptions(options);
  const salt = randomBytes(16);
  const derived = await deriveArgon2id({
    message: passwordBuffer(password),
    nonce: salt,
    memory: options.memoryKiB,
    passes: options.passes,
    parallelism: options.parallelism,
    tagLength: options.tagLength,
  });
  return [
    "ytt-argon2id:v1",
    `m=${options.memoryKiB},t=${options.passes},p=${options.parallelism},l=${options.tagLength}`,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join(":");
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const match = PASSWORD_FORMAT.exec(encodedHash);
  if (!match) return false;

  try {
    const options: Argon2idOptions = {
      memoryKiB: Number(match[1]),
      passes: Number(match[2]),
      parallelism: Number(match[3]),
      tagLength: Number(match[4]),
    };
    validateArgon2idOptions(options);
    const salt = Buffer.from(match[5]!, "base64url");
    const expected = Buffer.from(match[6]!, "base64url");
    if (salt.length < 16 || expected.length !== options.tagLength) return false;
    const actual = await deriveArgon2id({
      message: passwordBuffer(password),
      nonce: salt,
      memory: options.memoryKiB,
      passes: options.passes,
      parallelism: options.parallelism,
      tagLength: options.tagLength,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function domainHmac(
  secret: string,
  domain: string,
  value: string,
): string {
  const domainKey = createHmac("sha256", secret).update(domain).digest();
  return createHmac("sha256", domainKey).update(value).digest("hex");
}

export function deriveSynchronizerToken(secret: string, sessionId: string): string {
  const domainKey = createHmac("sha256", secret)
    .update("ytt/csrf-token/v1")
    .digest();
  return createHmac("sha256", domainKey)
    .update(sessionId)
    .digest("base64url");
}

export function safeHmacEqual(left: string, right: string): boolean {
  try {
    const leftBytes = Buffer.from(left, "hex");
    const rightBytes = Buffer.from(right, "hex");
    return (
      leftBytes.length === 32 &&
      rightBytes.length === 32 &&
      timingSafeEqual(leftBytes, rightBytes)
    );
  } catch {
    return false;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().normalize("NFKC").toLowerCase();
}
