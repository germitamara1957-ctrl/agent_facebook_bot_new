import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const SECRET_FILE = path.resolve(process.cwd(), ".jwt_secret");
let jwtSecret: string;

function getSecret(): string {
  if (jwtSecret) return jwtSecret;

  const envSecret = process.env["JWT_SECRET"];
  if (envSecret) {
    jwtSecret = envSecret;
    return jwtSecret;
  }

  try {
    if (fs.existsSync(SECRET_FILE)) {
      const persisted = fs.readFileSync(SECRET_FILE, "utf8").trim();
      if (persisted.length >= 32) {
        jwtSecret = persisted;
        console.warn(
          "[auth] JWT_SECRET not set — loaded persisted key from .jwt_secret file.\n" +
          "       Set JWT_SECRET env var in production to avoid depending on this file."
        );
        return jwtSecret;
      }
    }
  } catch {
    // fall through to generate
  }

  jwtSecret = crypto.randomBytes(32).toString("hex");
  try {
    fs.writeFileSync(SECRET_FILE, jwtSecret, { mode: 0o600 });
    console.warn(
      "[auth] JWT_SECRET not set — generated new key and saved to .jwt_secret.\n" +
      "       Sessions will survive restarts. Set JWT_SECRET env var in production."
    );
  } catch {
    console.warn(
      "[auth] JWT_SECRET not set and .jwt_secret file not writable — sessions will invalidate on restart.\n" +
      "       Set JWT_SECRET env var to fix this."
    );
  }
  return jwtSecret;
}

export interface JwtPayload {
  id: number;
  username: string;
  tenantId: number;
  role: string;
}

export interface SuperAdminJwtPayload {
  id: number;
  username: string;
  role: "superadmin";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export function signSuperAdminToken(payload: SuperAdminJwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "12h" });
}

export function verifySuperAdminToken(token: string): SuperAdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as SuperAdminJwtPayload;
    if (decoded.role !== "superadmin") return null;
    return decoded;
  } catch {
    return null;
  }
}
