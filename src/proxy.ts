import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

// Next 16：middleware.ts 已废弃，路由保护用 src/proxy.ts（与 app 同级，Node runtime）
// 验签逻辑复用 lib/jwt.ts，避免与 session.ts 分裂

/**
 * 第一层防护：验签 JWT cookie。
 * 只判断"是否已登录"，权限与账号状态最终以 DB 为准（layout / Server Action 里再查一次）。
 */
export async function proxy(request: NextRequest) {
  const valid = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );
  if (!valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // from 携带完整原始路径+查询参数
    url.searchParams.set("from", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/cart/:path*", "/orders/:path*", "/member/:path*", "/admin/:path*"],
};
