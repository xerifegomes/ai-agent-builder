import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Authorize called with:", credentials?.email)
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })
        } catch (error) {
          console.error("Prisma initialization or connection error:", error)
          return null
        }

        if (!user || !user.password) {
          console.log("User not found or no password")
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          console.log("Invalid password")
          return null
        }

        console.log("User authenticated:", user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string

        // Buscar role do usuário
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.sub as string },
            select: { role: true },
          })

          if (user) {
            (session.user as any).role = user.role
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
        }
      }
      return session
    },
  }
})
