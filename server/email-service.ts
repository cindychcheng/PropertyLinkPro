import { Resend } from 'resend';

let resend: Resend | null = null;

// Initialize Resend if API key is available
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!resend) {
    // For development - log the email instead of sending
    console.log('=== EMAIL FOR DEVELOPMENT ===');
    console.log('To:', params.to);
    console.log('From:', params.from);
    console.log('Subject:', params.subject);
    console.log('Body:', params.html);
    console.log('===============================');
    return true;
  }

  try {
    const result = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    console.log('Email sent successfully:', result.data?.id);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export async function sendAccessRequestNotification(
  requestorName: string,
  requestorEmail: string,
  adminEmails: string[],
  dashboardUrl: string
): Promise<boolean> {
  const subject = `New Access Request - ${requestorName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Access Request</h2>
      
      <p>A new user has requested access to the Property Management System:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${requestorName}</p>
        <p><strong>Email:</strong> ${requestorEmail}</p>
        <p><strong>Request Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p>To approve or deny this request, please log in to the admin dashboard:</p>
      
      <a href="${dashboardUrl}" 
         style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin: 10px 0;">
        Review Access Request
      </a>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        This notification was sent automatically from the Property Management System.
      </p>
    </div>
  `;

  // Send email to all admin users
  const emailPromises = adminEmails.map(adminEmail => 
    sendEmail({
      to: adminEmail,
      from: 'notifications@property-management.app', // This needs to be a verified domain in production
      subject,
      html
    })
  );

  try {
    const results = await Promise.all(emailPromises);
    return results.every(result => result === true);
  } catch (error) {
    console.error('Failed to send access request notifications:', error);
    return false;
  }
}

export async function sendAccessApprovedNotification(
  userName: string,
  userEmail: string,
  dashboardUrl: string
): Promise<boolean> {
  const subject = 'Access Approved - Property Management System';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">Access Approved!</h2>
      
      <p>Hello ${userName},</p>
      
      <p>Your access request to the Property Management System has been approved!</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>You can now access the system using either:</p>
        <ul>
          <li><strong>Email Sign-in:</strong> Enter your email address on the sign-in page to receive a secure login link</li>
          <li><strong>Replit Account:</strong> Sign in with your Replit account if you have one</li>
        </ul>
      </div>
      
      <a href="${dashboardUrl}" 
         style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; margin: 10px 0;">
        Access Dashboard
      </a>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Welcome to the Property Management System!
      </p>
    </div>
  `;

  return await sendEmail({
    to: userEmail,
    from: 'notifications@property-management.app',
    subject,
    html
  });
}