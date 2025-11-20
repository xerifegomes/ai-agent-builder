import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: nextUrl }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.nextUrl.pathname.startsWith("/agents") ||
                nextUrl.nextUrl.pathname.startsWith("/dashboard")

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Redirect authenticated users to dashboard if they visit login page
                // This logic is handled in middleware matcher or specific page logic usually, 
                // but here we just return true to allow access to other pages
                return true
            }
            return true
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string
                // Role will be added in the full auth config with database access
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id
            }
            return token
        },
    },
    providers: [], // Configured in auth.ts with full database access
    session: {
        strategy: "jwt",
    },
} satisfies NextAuthConfig
