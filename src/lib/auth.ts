import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySessionToken } from "@/lib/jwt";
import { getSessionToken } from "@/lib/session";

/**
 * 当前登录用户。每次回源 DB 查询：token 里的声明不可信，
 * 权限与账号状态以数据库为准（禁用账号即时生效）。
 * cache() 保证同一请求内 Header + 页面多处调用只查一次库。
 */
export const getCurrentUser = cache(async () => {
  const session = await verifySessionToken(await getSessionToken());
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    // 白名单列：passwordHash 等敏感列不进组件内存
    select: { id: true, email: true, name: true, isAdmin: true, totalSpent: true },
  });
});

/** 未登录跳转 /login，尽量携带 from 回跳参数（取 referer，登录侧有 safeFrom 兜底） */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect(await loginRedirectPath());
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}

async function loginRedirectPath(): Promise<string> {
  try {
    const referer = (await headers()).get("referer");
    if (referer) {
      const from = new URL(referer).pathname + new URL(referer).search;
      if (from && from !== "/login") {
        return `/login?from=${encodeURIComponent(from)}`;
      }
    }
  } catch {
    // 非法 referer 忽略，退回裸 /login
  }
  return "/login";
}
