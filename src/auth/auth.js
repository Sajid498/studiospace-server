
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { getDB, getMongoClient } from "../config/database.js";

let authInstance;

export const getAuth = () => {
  if (!authInstance) {
    authInstance = betterAuth({
      database: mongodbAdapter(getDB(), {
        client: getMongoClient(),
      }),

      baseURL: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,

      emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
      },

      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      },

      account: {
        accountLinking: {
          enabled: true,
          trustedProviders: ["google"],
        },
      },

      session: {
        cookieCache: {
          enabled: true,
          strategy: "jwt",
        },
      },

      advanced: {
        defaultCookieAttributes: {
          sameSite: "none",
          secure: true,
          httpOnly: true,
        },
      },

      plugins: [
        jwt({
          sessionCookieCache: true,
        }),
      ],

      trustedOrigins: [
        process.env.CLIENT_URL || "http://localhost:3000",
      ],
    });
  }

  return authInstance;
};
