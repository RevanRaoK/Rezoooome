import type { Metadata } from "next";
import { SignInClient } from "@/components/auth/SignInClient";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const params = await searchParams;
  const initialMode =
    params.mode === "signup"
      ? "signup"
      : params.mode === "forgot"
        ? "forgot"
        : "signin";

  return (
    <SignInClient
      initialMode={initialMode}
      nextPath={typeof params.next === "string" ? params.next : "/dashboard"}
    />
  );
}
