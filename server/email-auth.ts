import jwt from 'jsonwebtoken';
import { MailService } from '@sendgrid/mail';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourapp.com';

let mailService: MailService | null = null;

if (SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(SENDGRID_API_KEY);
}

export interface EmailAuthToken {
  userId: string;
  email: string;
  type: 'email_auth';
  exp: number;
}

export function generateEmailAuthToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
      type: 'email_auth',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function verifyEmailAuthToken(token: string): EmailAuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as EmailAuthToken;
    if (decoded.type === 'email_auth') {
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function sendMagicLink(email: string, baseUrl: string): Promise<boolean> {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user || user.status !== 'active') {
      return false;
    }

    const token = generateEmailAuthToken(user.id, email);
    const magicLink = `${baseUrl}/auth/magic?token=${token}`;

    if (!mailService) {
      // For development - log the magic link instead of sending email
      console.log('=== MAGIC LINK FOR DEVELOPMENT ===');
      console.log(`Email: ${email}`);
      console.log(`Magic Link: ${magicLink}`);
      console.log('=====================================');
      return true;
    }

    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Sign in to Property Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sign in to Property Management System</h2>
          <p>Hi ${user.firstName || 'there'},</p>
          <p>Click the button below to sign in to your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #007cba; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Sign In
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${magicLink}</p>
          <p><em>This link will expire in 1 hour.</em></p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await mailService.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending magic link:', error);
    return false;
  }
}