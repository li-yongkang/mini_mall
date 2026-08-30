"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode, from }: { mode: "login" | "register"; from?: string }) {
  const action = mode === "login" ? login : register;
  const [state, formAction, pending] = useActionState(action, undefined);
  // 切换登录/注册时保留 from 回跳参数
  const withFrom = (path: string) =>
    from ? `${path}?from=${encodeURIComponent(from)}` : path;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === "login" ? "登录" : "注册"}</CardTitle>
        <CardDescription>
          {mode === "login" ? "登录 Mini Mall 继续购物" : "创建 Mini Mall 账号"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {from && <input type="hidden" name="from" value={from} />}
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">昵称</Label>
              <Input id="name" name="name" placeholder="你的昵称" required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 6 : undefined}
            />
          </div>
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="confirm">确认密码</Label>
              <Input id="confirm" name="confirm" type="password" required />
            </div>
          )}
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "处理中…" : mode === "login" ? "登录" : "注册"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              没有账号？
              <Link href={withFrom("/register")} className="text-foreground underline">
                去注册
              </Link>
            </>
          ) : (
            <>
              已有账号？
              <Link href={withFrom("/login")} className="text-foreground underline">
                去登录
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
