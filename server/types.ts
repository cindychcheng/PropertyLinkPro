import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
    interface Session {
      emailAuth?: {
        userId: string;
        email: string;
        loginTime: number;
      };
      azureAuth?: {
        userId: string;
        email: string;
        loginTime: number;
      };
    }
  }
}