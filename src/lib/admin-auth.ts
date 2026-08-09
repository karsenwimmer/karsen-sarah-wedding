import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "ks_admin_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

function adminPassword() {
  return process.env.ADMIN_DASHBOARD_PASSWORD;
}

function adminSecret() {
  return process.env.ADMIN_DASHBOARD_SECRET ?? adminPassword();
}

function sign(value: string) {
  const secret = adminSecret();

  if (!secret) {
    return "";
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}

function constantCompare(left: string, right: string) {
  const leftHash = sign(left);
  const rightHash = sign(right);

  if (!leftHash || !rightHash) {
    return false;
  }

  return timingSafeEqual(Buffer.from(leftHash), Buffer.from(rightHash));
}

export function isAdminConfigured() {
  return Boolean(adminPassword());
}

export function verifyAdminPassword(value: string) {
  const expectedPassword = adminPassword();

  if (!expectedPassword) {
    return false;
  }

  return constantCompare(value, expectedPassword);
}

function createSessionToken() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export async function setAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_SECONDS,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const [issuedAt, signature] = token.split(".");
  const issuedAtNumber = Number.parseInt(issuedAt ?? "", 10);

  if (!issuedAt || !signature || !Number.isFinite(issuedAtNumber)) {
    return false;
  }

  if (Date.now() - issuedAtNumber > ADMIN_SESSION_SECONDS * 1000) {
    return false;
  }

  return constantCompare(signature, sign(issuedAt));
}
