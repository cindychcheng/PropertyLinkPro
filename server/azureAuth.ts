import { ConfidentialClientApplication, LogLevel } from "@azure/msal-node";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Azure AD configuration
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!,
    clientSecret: process.env.AZURE_CLIENT_SECRET!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: LogLevel, message: string, containsPii: boolean) {
        if (containsPii) return;
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Warning,
    }
  }
};

let msalInstance: ConfidentialClientApplication;

export function setupAzureAuth(app: Express) {
  // Initialize MSAL instance
  msalInstance = new ConfidentialClientApplication(msalConfig);

  // Azure login route
  app.get("/api/auth/azure/login", async (req, res) => {
    try {
      const host = req.get('host');
      const protocol = host?.includes('replit.dev') ? 'https' : req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/azure/callback`;
      
      console.log("Azure login - redirect URI:", redirectUri);
      
      const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: redirectUri,
      };

      const response = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
      res.redirect(response);
    } catch (error) {
      console.error("Azure auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Azure callback route
  app.get("/api/auth/azure/callback", async (req, res) => {
    try {
      const host = req.get('host');
      const protocol = host?.includes('replit.dev') ? 'https' : req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/azure/callback`;
      
      console.log("Azure callback - redirect URI:", redirectUri);
      console.log("Azure callback - received code:", req.query.code ? "present" : "missing");
      
      const tokenRequest = {
        code: req.query.code as string,
        scopes: ["user.read"],
        redirectUri: redirectUri,
      };

      const response = await msalInstance.acquireTokenByCode(tokenRequest);
      
      if (!response || !response.account) {
        return res.status(400).json({ error: "Invalid authentication response" });
      }

      const email = response.account.username;
      console.log("Azure auth successful for email:", email);

      // Check if user exists and is approved
      const dbUser = await storage.getUserByEmail(email);
      
      if (!dbUser) {
        console.log("User not found in database:", email);
        return res.redirect('/?error=user_not_found');
      }

      if (dbUser.status !== 'active') {
        console.log("User not active:", email, "Status:", dbUser.status);
        return res.redirect('/?error=user_not_approved');
      }

      // Update last login
      await storage.updateUserLastLogin(dbUser.id);

      // Set session
      (req.session as any).azureAuth = {
        userId: dbUser.id,
        email: email,
        loginTime: Date.now()
      };

      console.log("Azure auth session created for user:", dbUser.id);
      res.redirect('/');
    } catch (error) {
      console.error("Azure callback error:", error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Azure logout route
  app.get("/api/auth/azure/logout", (req, res) => {
    if ((req.session as any).azureAuth) {
      delete (req.session as any).azureAuth;
    }
    
    const logoutUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get('host')}`)}`;
    res.redirect(logoutUrl);
  });
}

export const isAzureAuthenticated: RequestHandler = (req, res, next) => {
  if ((req.session as any).azureAuth && (req.session as any).azureAuth.userId) {
    return next();
  }
  res.status(401).json({ message: "Azure authentication required" });
};