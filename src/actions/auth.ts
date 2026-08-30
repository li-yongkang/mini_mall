"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

const MAX_PASSWORD_BYTES = 72; // bcrypt 只取前 72 字节，超长多字节密码会被静默截断

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "请输入昵称").max(30, "昵称最长 30 字"),
    email: z
      .string()
      .trim()
      .transform((v) => v.toLowerCase())
      .pipe(z.email("邮箱格式不正确")),
    password: z
      .string()
      .min(6, "密码至少 6 位")
      .refine((p) => new TextEncoder().encode(p).length <= MAX_PASSWORD_BYTES, {
        message: "密码过长（按字节计，最多 72 字节）",
      }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "两次输入的密码不一致",
    path: ["confirm"],
  });

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((v) => v.toLowerCase())
    .pipe(z.email("邮箱格式不正确")),
  password: z.string().min(1, "请输入密码"),
});

export type AuthActionState = { error?: string } | undefined;

/**
 * 仅允许站内路径：用 URL 解析器归一化（反斜杠会被浏览器当斜杠处理），
 * 任何解析出外部 origin 的值一律拒绝。
 */
function safeFrom(value: unknown): string {
  if (typeof value !== "string") return "/";
  try {
    const u = new URL(value, "https://mini-mall.invalid");
    if (u.origin !== "https://mini-mall.invalid") return "/";
    return u.pathname + u.search || "/";
  } catch {
    return "/";
  }
}

export async function register(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await prisma.user.create({
      data: { name, email, passwordHash }, // isAdmin 默认 false
    });
  } catch (e) {
    // 并发注册同邮箱时 @unique 约束兜底，避免 500
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "该邮箱已注册，请直接登录" };
    }
    throw e;
  }

  await setSessionCookie({ userId: user.id });
  redirect(safeFrom(formData.get("from"))); // 注册即登录，并回跳原始目标
}

export async function login(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { error: "邮箱或密码错误" };

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "邮箱或密码错误" };

  await setSessionCookie({ userId: user.id });
  redirect(safeFrom(formData.get("from")));
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
