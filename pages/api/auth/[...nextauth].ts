import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
      async jwt({ token, account }) {
        // Initial sign in
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.accessTokenExpires = (account.expires_at ?? 0) * 1000;
          return token;
        }

        // Return previous token if the access token has not expired yet
        if (Date.now() < (token.accessTokenExpires as number)) {
          return token;
        }

        // Access token has expired, try to update it
        return refreshAccessToken(token);
      },
      async session({ session, token }) {
        session.accessToken = token.accessToken as string;
        session.error = token.error as string;
        return session;
      },
    },
})
import { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT) {
      try {
        const url = "https://oauth2.googleapis.com/token?" + new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        });

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        });

        const refreshedTokens = await response.json();

        if (!response.ok) {
          throw refreshedTokens;
        }

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    }