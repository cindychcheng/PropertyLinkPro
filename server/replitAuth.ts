import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import "./types"; // Import type extensions

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl / 1000, // ttl in seconds
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      
      const claims = tokens.claims();
      
      if (!claims || !claims["sub"]) {
        return verified(new Error("Invalid claims from OAuth provider"), false);
      }
      
      const userId = String(claims["sub"]);
      const userEmail = claims["email"] ? String(claims["email"]) : null;
      
      // Check if user exists by Replit ID first
      let dbUser = await storage.getUser(userId);
      
      // If not found by Replit ID, check by email for approved registrations
      if (!dbUser && userEmail) {
        const userByEmail = await storage.getUserByEmail(userEmail);
        
        if (userByEmail && userByEmail.status === 'active') {
          // Create new user record with actual Replit ID, preserving approval info
          dbUser = await storage.createUser({
            id: userId,
            email: userEmail,
            firstName: (claims["first_name"] && typeof claims["first_name"] === 'string') ? claims["first_name"] : userByEmail.firstName,
            lastName: (claims["last_name"] && typeof claims["last_name"] === 'string') ? claims["last_name"] : userByEmail.lastName,
            profileImageUrl: (claims["profile_image_url"] && typeof claims["profile_image_url"] === 'string') ? claims["profile_image_url"] : null,
            role: userByEmail.role,
            status: 'active',
            createdBy: userByEmail.createdBy
          });
          
          // Delete the old temporary registration record
          await storage.deleteUser(userByEmail.id);
          
          // Log the account linking
          await storage.logUserAction({
            actionType: 'account_linked',
            targetUserId: userId,
            performedBy: "system",
            details: { 
              linkedFromEmail: userEmail, 
              previousTempId: userByEmail.id,
              role: userByEmail.role
            }
          });
        }
      }
      
      // If still no user found, upsert normally (this handles the original flow)
      if (!dbUser) {
        await upsertUser(claims);
      }
      
      verified(null, user);
    } catch (error) {
      console.error("Authentication error:", error);
      verified(error as Error, false);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const domain = process.env.REPLIT_DOMAINS!.split(",")[0];
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const domain = process.env.REPLIT_DOMAINS!.split(",")[0];
    passport.authenticate(`replitauth:${domain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Middleware to check if user is in whitelist and has proper role
export const requireRole = (minRole: string): RequestHandler => {
  return async (req, res, next) => {
    const user = req.user as any;
    
    if (!req.isAuthenticated() || !user.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Check if user exists in whitelist
      const dbUser = await storage.getUser(user.claims.sub);
      
      if (!dbUser) {
        return res.status(403).json({ message: "Access denied. Contact administrator." });
      }

      if (dbUser.status !== "active") {
        return res.status(403).json({ message: "Account inactive. Contact administrator." });
      }

      // Update last login time
      await storage.updateUserLastLogin(user.claims.sub);

      // Check role permissions
      const roleHierarchy = {
        "read_only": 1,
        "standard": 2,
        "admin": 3,
        "super_admin": 4
      };

      const userRoleLevel = roleHierarchy[dbUser.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Attach user info to request for use in routes
      req.currentUser = dbUser;
      return next();
    } catch (error) {
      console.error("Role check error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};