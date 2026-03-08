"use client";

/** Wraps the app in NextAuth SessionProvider so session is available to client components. */
import { SessionProvider } from "next-auth/react";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
