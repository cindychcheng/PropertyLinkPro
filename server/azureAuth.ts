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
    console.log("=== MICROSOFT AUTHENTICATION INITIATED ===");
    console.log("Request from host:", req.get('host'));
    console.log("User agent:", req.get('user-agent'));
    console.log("Azure credentials configured:", {
      clientId: !!process.env.AZURE_CLIENT_ID,
      clientSecret: !!process.env.AZURE_CLIENT_SECRET,
      tenantId: !!process.env.AZURE_TENANT_ID
    });
    
    try {
      const host = req.get('host');
      const protocol = host?.includes('replit.dev') || host?.includes('replit.app') ? 'https' : req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/azure/callback`;
      
      console.log("Azure login - redirect URI:", redirectUri);
      
      const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: redirectUri,
      };

      const response = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
      console.log("Azure auth URL generated successfully");
      console.log("Redirecting to Microsoft...");
      res.redirect(response);
    } catch (error) {
      console.error("Azure auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Azure callback route
  app.get("/api/auth/azure/callback", async (req, res) => {
    console.log("=== AZURE CALLBACK RECEIVED ===");
    console.log("Full URL:", req.url);
    console.log("Query params:", req.query);
    console.log("Headers host:", req.get('host'));
    console.log("Has auth code:", !!req.query.code);
    console.log("Has error:", !!req.query.error);
    console.log("Session ID at callback:", req.sessionID);
    
    // If there's an error in the callback
    if (req.query.error) {
      console.error("Azure auth error:", req.query.error);
      console.error("Error description:", req.query.error_description);
      return res.redirect('/?error=azure_auth_error');
    }
    try {
      const host = req.get('host');
      const protocol = host?.includes('replit.dev') || host?.includes('replit.app') ? 'https' : req.protocol;
      const redirectUri = `${protocol}://${host}/api/auth/azure/callback`;
      
      console.log("Azure callback - redirect URI:", redirectUri);
      console.log("Azure callback - received code:", req.query.code ? "present" : "missing");
      console.log("Processing Microsoft authentication...");
      
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
      console.log("=== AZURE AUTH SUCCESS ===");
      console.log("Azure auth successful for email:", email);
      console.log("Full account object:", JSON.stringify(response.account, null, 2));

      // Check if user exists and is approved
      const dbUser = await storage.getUserByEmail(email);
      console.log("Database user lookup result:", dbUser ? "found" : "not found");
      if (dbUser) {
        console.log("User status:", dbUser.status);
        console.log("User role:", dbUser.role);
      }
      
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

      // Set session - ensure session object exists
      if (!req.session) {
        console.error("Session object is undefined");
        return res.redirect('/?error=session_error');
      }
      
      (req.session as any).azureAuth = {
        userId: dbUser.id,
        email: email,
        loginTime: Date.now()
      };

      console.log("Azure auth session created for user:", dbUser.id);
      console.log("Session ID:", req.sessionID);
      console.log("Session azureAuth:", (req.session as any).azureAuth);
      console.log("Microsoft authentication successful for:", email);
      
      // Save session explicitly before redirect
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        } else {
          console.log("Session saved successfully");
        }
        console.log("Redirecting to dashboard...");
        res.redirect('/');
      });
    } catch (error: any) {
      console.error("=== AZURE CALLBACK ERROR ===");
      console.error("Error details:", error);
      console.error("Error message:", (error as Error)?.message || 'Unknown error');
      console.error("Error stack:", (error as Error)?.stack || 'No stack trace');
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