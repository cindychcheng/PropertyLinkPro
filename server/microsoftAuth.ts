import { ConfidentialClientApplication, Configuration, AuthenticationResult } from '@azure/msal-node';
import { Express, RequestHandler } from 'express';
import session from 'express-session';
import { storage } from './storage';
import connectPg from 'connect-pg-simple';

// Microsoft Azure AD configuration
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`
  },
  system: {
    loggerOptions: {
      loggerCallback(level, message, containsPii) {
        if (containsPii) return;
        console.log(`[MSAL] ${level}: ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: 3, // LogLevel.Info
    }
  }
};

let msalInstance: ConfidentialClientApplication;

export function initializeMSAL() {
  if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET) {
    console.log('Microsoft authentication not configured - missing Azure credentials');
    return null;
  }
  
  msalInstance = new ConfidentialClientApplication(msalConfig);
  return msalInstance;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupMicrosoftAuth(app: Express) {
  const msal = initializeMSAL();
  if (!msal) {
    console.log('Skipping Microsoft authentication setup - not configured');
    return;
  }

  app.set('trust proxy', 1);
  app.use(getSession());

  // Microsoft login route
  app.get('/api/auth/microsoft/login', async (req: any, res) => {
    try {
      const redirectUri = `${req.protocol}://${req.hostname}/api/auth/microsoft/callback`;
      
      const authCodeUrlParameters = {
        scopes: ['user.read', 'email', 'profile'],
        redirectUri: redirectUri,
        state: req.sessionID, // Use session ID as state for security
      };

      const authUrl = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
      res.redirect(authUrl);
    } catch (error) {
      console.error('Microsoft login error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Microsoft callback route
  app.get('/api/auth/microsoft/callback', async (req: any, res) => {
    try {
      if (req.query.state !== req.sessionID) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      if (req.query.error) {
        console.error('Microsoft auth error:', req.query.error_description);
        return res.redirect('/?error=auth_failed');
      }

      const redirectUri = `${req.protocol}://${req.hostname}/api/auth/microsoft/callback`;
      
      const tokenRequest = {
        code: req.query.code as string,
        scopes: ['user.read', 'email', 'profile'],
        redirectUri: redirectUri,
      };

      const response: AuthenticationResult = await msalInstance.acquireTokenByCode(tokenRequest);
      
      if (response && response.account) {
        const userEmail = response.account.username; // This is the email in Microsoft auth
        const userDisplayName = response.account.name || '';
        const userId = response.account.homeAccountId;

        // Check if user exists and is approved
        let user = await storage.getUserByEmail(userEmail);
        
        if (!user) {
          // Create pending user for Microsoft accounts
          const [firstName, lastName] = userDisplayName.split(' ');
          user = await storage.createUser({
            id: `microsoft_${userId}`,
            email: userEmail,
            firstName: firstName || '',
            lastName: lastName || '',
            role: 'read_only',
            status: 'pending',
            createdBy: 'microsoft-auth'
          });
          
          // Redirect to pending approval page
          return res.redirect('/?status=pending_approval');
        }

        if (user.status !== 'active') {
          return res.redirect('/?status=pending_approval');
        }

        // Store user session
        req.session.microsoftAuth = {
          userId: user.id,
          email: userEmail,
          loginTime: Date.now(),
          accessToken: response.accessToken
        };

        // Update last login
        await storage.updateUserLastLogin(user.id);

        res.redirect('/');
      } else {
        res.redirect('/?error=auth_failed');
      }
    } catch (error) {
      console.error('Microsoft callback error:', error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Microsoft logout route
  app.get('/api/auth/microsoft/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      
      // Redirect to Microsoft logout
      const logoutUri = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(`${req.protocol}://${req.hostname}`)}`;
      res.redirect(logoutUri);
    });
  });

  console.log('Microsoft authentication configured');
}

// Middleware to check Microsoft authentication
export const isMicrosoftAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session && req.session.microsoftAuth && req.session.microsoftAuth.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Microsoft authentication required' });
  }
};

// Combined authentication check (Replit OR Microsoft OR Email)
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Check Microsoft authentication
  if (req.session && req.session.microsoftAuth && req.session.microsoftAuth.userId) {
    return next();
  }
  
  // Check Replit authentication
  if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.claims && req.user.claims.sub) {
    return next();
  }
  
  // Check email authentication
  if (req.session && req.session.emailAuth && req.session.emailAuth.userId) {
    return next();
  }
  
  res.status(401).json({ message: 'Authentication required' });
};

// Role-based authorization middleware
export const requireRole = (minRole: string): RequestHandler => {
  return async (req: any, res, next) => {
    let userId: string | null = null;
    
    // Determine user ID from various auth methods
    if (req.session && req.session.microsoftAuth && req.session.microsoftAuth.userId) {
      userId = req.session.microsoftAuth.userId;
    } else if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.claims && req.user.claims.sub) {
      userId = req.user.claims.sub;
    } else if (req.session && req.session.emailAuth && req.session.emailAuth.userId) {
      userId = req.session.emailAuth.userId;
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Account not active' });
      }
      
      // Role hierarchy check
      const roleHierarchy = ['read_only', 'standard', 'admin', 'super_admin'];
      const userRoleIndex = roleHierarchy.indexOf(user.role);
      const requiredRoleIndex = roleHierarchy.indexOf(minRole);
      
      if (userRoleIndex < requiredRoleIndex) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};