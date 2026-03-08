/**
 * NextAuth catch-all route: handles sign-in (e.g. Google), JWT/session.
 * On sign-in, calls backend POST /auth/google with name/email and stores backend token + role in JWT/session.
 */
import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
declare module "next-auth" {
  interface Session {
    user: {
      backendToken?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    role?: string;
  }
}
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt", // store JWT in session
  },

  callbacks: {
    // Called on sign-in
    async signIn({ user }) {
      // Always allow sign-in; backend call will be in jwt callback
      return true;
    },

    // Called when JWT is created or updated
    async jwt({ token, user }) {
      if (user) {
        try {
          const backendRes = await fetch(`${process.env.REACT_APP_API_URL}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: user.name,
              email: user.email,
            }),
          });

          if (!backendRes.ok) {
            console.error("Backend error", await backendRes.text());
            return token; // fallback: continue with default token
          }

          const data = await backendRes.json();

          // Attach backend token and role to NextAuth JWT
          token.backendToken = data.token;
          token.role = data.role;
        } catch (err) {
          console.error("Error fetching backend JWT:", err);
        }
      }

      return token;
    },

    // Called when session object is sent to the client
    async session({ session, token }) {
      session.user.backendToken = token.backendToken;
      session.user.role = token.role;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin", // optional custom sign-in page
    error: "/auth/error",   // optional error page
  },
});

export { handler as GET, handler as POST };