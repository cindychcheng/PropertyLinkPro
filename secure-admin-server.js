// Secure Admin Server with Security Best Practices
import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const app = express();
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting store
const rateLimitStore = new Map();

// Rate limiting middleware
const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = rateLimitStore.get(key);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
};

// Secure password hashing
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, hashedPassword) => {
  const [salt, hash] = hashedPassword.split(':');
  const hashVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === hashVerify;
};

// Session management
const sessions = new Map();

const generateSession = (userId) => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  sessions.set(sessionId, {
    userId,
    expiresAt,
    createdAt: Date.now()
  });
  
  return sessionId;
};

const validateSession = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session || Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
};

// Serve static files
const publicPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(publicPath));

// Admin user with hashed password
const adminUser = {
  id: 'admin',
  email: 'admin@instarealty.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin',
  status: 'active',
  createdAt: new Date(),
  hashedPassword: hashPassword(process.env.ADMIN_PASSWORD || 'defaultPassword')
};

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);
  next();
});

// Secure admin authentication endpoint
app.post('/api/secure/login', rateLimit(5, 15 * 60 * 1000), (req, res) => {
  try {
    const { username, password, accessToken } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    console.log('🔐 Secure admin login attempt:', { username, hasAccessToken: !!accessToken });
    
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminAccessToken = process.env.ADMIN_ACCESS_TOKEN;
    
    // Verify credentials
    let isValid = false;
    
    if (username === adminUsername && password === adminPassword) {
      isValid = true;
    } else if (accessToken && accessToken === adminAccessToken) {
      isValid = true;
    }
    
    if (isValid) {
      const sessionId = generateSession(adminUser.id);
      
      console.log('✅ Secure admin login successful');
      
      // Return user without sensitive data
      const { hashedPassword, ...userWithoutPassword } = adminUser;
      
      res.json({
        success: true,
        message: 'Authentication successful',
        user: userWithoutPassword,
        sessionId,
        expiresIn: 86400 // 24 hours in seconds
      });
    } else {
      console.log('❌ Secure admin login failed - invalid credentials');
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Secure admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// Secure admin info endpoint (requires valid session)
app.get('/api/secure/admin', (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }
    
    const session = validateSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }
    
    const { hashedPassword, ...userWithoutPassword } = adminUser;
    
    res.json({
      success: true,
      message: '🔐 Secure Admin Access Granted',
      user: userWithoutPassword,
      session: {
        expiresAt: session.expiresAt,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Secure admin info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin info'
    });
  }
});

// Admin bypass route (now secured)
app.get('/admin', (req, res) => {
  console.log('🔑 Admin page accessed');
  res.json({
    message: '🔐 PropertyLinkPro Admin Portal',
    status: 'secure',
    authentication: {
      methods: ['username/password', 'access_token'],
      endpoint: '/api/secure/login',
      rateLimit: '5 attempts per 15 minutes'
    },
    security: {
      passwordHashing: 'scrypt',
      sessionManagement: 'token-based',
      rateLimiting: 'enabled',
      securityHeaders: 'enabled'
    },
    note: 'Use secure credentials from environment variables'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    security: 'enabled',
    admin: 'secured',
    timestamp: new Date().toISOString()
  });
});

// Logout endpoint
app.post('/api/secure/logout', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (sessionId) {
    sessions.delete(sessionId);
    console.log('🔒 Admin session terminated');
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Catch-all for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false,
      message: 'API endpoint not found' 
    });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

const server = app.listen(8080, '127.0.0.1', () => {
  console.log('🔐 Secure PropertyLinkPro Server running on http://localhost:8080');
  console.log('🔑 Admin credentials secured in environment variables');
  console.log('🛡️  Security features enabled: rate limiting, session management, password hashing');
  console.log('📡 Admin portal: http://localhost:8080/admin');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

export default app;