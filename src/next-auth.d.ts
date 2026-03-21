import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string; // Add the question mark (?) to make it optional
    } & DefaultSession["user"];
  }

  // Also update the User object itself
  interface User {
    role?: string; // Add the question mark here too
  }
}