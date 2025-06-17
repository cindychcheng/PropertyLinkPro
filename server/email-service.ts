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
      from: 'onboarding@resend.dev',
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
  const subject = 'Property Management System - Access Approved';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; margin-bottom: 20px;">Access Approved</h1>
      
      <p style="font-size: 16px; margin-bottom: 16px;">Hello ${userName},</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">Great news! Your access request has been approved.</p>
      
      <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0; color: #1e40af;">How to Sign In:</h3>
        <p style="margin-bottom: 10px;"><strong>Option 1:</strong> Email login - Enter your email on the sign-in page</p>
        <p style="margin-bottom: 0;"><strong>Option 2:</strong> Use your Replit account if you have one</p>
      </div>
      
      <a href="${dashboardUrl}" 
         style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; 
                text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">
        Access System
      </a>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        This email was sent from the Property Management System. If you didn't request access, please ignore this message.
      </p>
    </div>
  `;

  console.log(`Attempting to send approval email to: ${userEmail}`);
  
  // For development/testing: send to verified email address due to Resend limitations
  const testEmail = 'cindychcheng@gmail.com';
  const actualRecipient = userEmail;
  
  // Update email content to show it's for another user
  const testHtml = html.replace(
    `<p style="font-size: 16px; margin-bottom: 16px;">Hello ${userName},</p>`,
    `<p style="font-size: 16px; margin-bottom: 16px;">Hello ${userName},</p>
     <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b;">
       <p style="margin: 0; color: #92400e; font-size: 14px;">
         <strong>Note:</strong> This approval email was intended for ${actualRecipient} but sent to you for testing due to Resend domain restrictions.
       </p>
     </div>`
  );
  
  const result = await sendEmail({
    to: testEmail,
    from: 'onboarding@resend.dev',
    subject: `${subject} (for ${actualRecipient})`,
    html: testHtml
  });
  
  if (result) {
    console.log(`Approval email successfully sent to ${testEmail} (intended for ${userEmail})`);
    console.log('Note: Check your email for the approval notification');
  }
  
  return result;
}