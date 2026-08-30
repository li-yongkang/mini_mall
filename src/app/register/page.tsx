import { AuthForm } from "@/components/auth/auth-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <AuthForm mode="register" from={from} />
    </main>
  );
}
