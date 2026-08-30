import { SignJWT, jwtVerify } from "jose";

/**
 * 认证叶子模块：不依赖 next/headers，proxy.ts（Node runtime 独立打包）
 * 与 session.ts / auth.ts 共用同一份密钥、cookie 名与验签逻辑，
 * 避免"改名/加固只改一处导致全线断登录"的分裂脑。
 */

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET 未配置：请在 .env 中设置（见 .env.example）");
}

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 天

/**
 * 仅存 userId。isAdmin 等权限信息不写入 token——
 * 权限一律回源 DB（lib/auth.ts），避免过期 claim 被误信。
 */
export type SessionPayload = {
  userId: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

/** 过期/篡改/缺失一律返回 null（视为未登录） */
export async function verifySessionToken(
  token?: string | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
