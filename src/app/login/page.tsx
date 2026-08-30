import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <AuthForm mode="login" from={from} />
    </main>
  );
}
