import { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupSimpleAuth(app: Express) {
  // Simple login endpoint
  app.post("/api/simple/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log("🔑 Simple login attempt for user:", username);
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Check for the super admin account using environment variables
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminUsername || !adminPassword) {
        console.error("❌ Admin credentials not configured properly");
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      console.log("🔍 Checking credentials for user:", username);
      
      if (username === adminUsername && password === adminPassword) {
        console.log("✅ Credentials match, creating/getting admin user");
        // Create or get the admin user using dynamic email
        const adminEmail = `${adminUsername}@system.local`;
        let adminUser = await storage.getUserByEmail(adminEmail);
        
        if (!adminUser) {
          // Create the admin user
          const hashedPassword = await hashPassword(password);
          adminUser = await storage.createUser({
            id: adminUsername,
            email: adminEmail,
            firstName: "System",
            lastName: "Administrator",
            role: "super_admin",
            status: "active",
            password: hashedPassword
          });
        }

        // Set session
        (req.session as any).simpleAuth = {
          userId: adminUser.id,
          email: adminUser.email,
          loginTime: Date.now()
        };

        // Remove password from response for security
        const { password: _, ...userWithoutPassword } = adminUser;
        console.log("🟢 Simple auth login successful for admin");
        return res.json({ success: true, user: userWithoutPassword });
      }

      console.log("❌ Invalid credentials provided");
      return res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Simple auth login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // Simple logout endpoint
  app.post("/api/simple/logout", (req, res) => {
    if ((req.session as any).simpleAuth) {
      delete (req.session as any).simpleAuth;
    }
    res.json({ success: true });
  });
}

export const isSimpleAuthenticated: RequestHandler = async (req, res, next) => {
  if ((req.session as any).simpleAuth) {
    const user = await storage.getUser((req.session as any).simpleAuth.userId);
    if (user && user.status === "active") {
      req.currentUser = user;
      return next();
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
};