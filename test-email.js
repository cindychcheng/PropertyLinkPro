// Quick email test script
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'cindychcheng@gmail.com',
      subject: 'Test - Property Management System Email Check',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email System Test</h2>
          <p>This is a direct test email to verify delivery.</p>
          <p>If you receive this, the email system is working correctly.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    });
    
    console.log('Email sent successfully:', result.data?.id);
    console.log('Check your inbox at cindychcheng@gmail.com');
  } catch (error) {
    console.error('Email failed:', error);
  }
}

testEmail();