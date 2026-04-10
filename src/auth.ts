import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { issueVerificationCodeForUser, confirmEmailCode } from "@/app/actions/verify-email";

class EmailNotVerified extends CredentialsSignin {
  code = "unverified";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otpUserId: { label: "OTP User Id", type: "text" },
        otpCode: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.otpUserId && credentials?.otpCode) {
          const res = await confirmEmailCode(
            credentials.otpUserId as string,
            credentials.otpCode as string
          );
          if (res.error) {
            const err = new CredentialsSignin();
            err.code = res.error;
            throw err;
          }
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, credentials.otpUserId as string))
            .limit(1);
          if (user) {
            return { id: user.id, email: user.email, name: user.name };
          }
          return null;
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        const user = result[0];

        if (!user) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
          return null;
        }

        if (!user.emailVerified) {
          await issueVerificationCodeForUser({
            userId: user.id,
            email: user.email,
          });
          throw new EmailNotVerified();
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // User is available during sign-in
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // We use the root logic for signIn
  },
});
