import nodemailer from 'nodemailer';

/**
 * Creates a Nodemailer transporter using environment variables or a fallback test transporter.
 */
const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // If EMAIL_USER and EMAIL_PASS are set (e.g. Gmail)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback: Test account / json transport for development & logging
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

/**
 * Sends an email to newly created doctors with their login credentials and a password reset/change link.
 */
export const sendDoctorWelcomeEmail = async ({
  fullName,
  email,
  password,
  specialisation,
  qualification,
  resetToken,
}) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = resetToken 
      ? `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      : `${clientUrl}/login`;
    const loginUrl = `${clientUrl}/login`;

    const transporter = await createTransporter();

    const mailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ObesityCare System</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #334155; }
          .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 16px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
          .credential-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .credential-row:last-child { margin-bottom: 0; }
          .label { color: #64748b; font-weight: 600; font-size: 13px; }
          .value { font-weight: 700; color: #0f172a; font-family: monospace; font-size: 15px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
          .btn:hover { background-color: #1d4ed8; }
          .notice { font-size: 12px; color: #64748b; background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hospital Dietary & Obesity Management System</h1>
            <p>Clinical Decision Support & Doctor Portal</p>
          </div>
          <div class="content">
            <span class="badge">Doctor Account Created</span>
            <p>Dear <strong>Dr. ${fullName}</strong>,</p>
            <p>An authorized administrator has created your clinical doctor account on the <strong>Obesity Management & Prediction System</strong>.</p>
            
            <div class="card">
              <div style="margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                <span class="label">Specialisation:</span> <strong style="color: #1e293b;">${specialisation || 'General'}</strong>
                ${qualification ? `<br><span class="label">Qualification:</span> <strong style="color: #1e293b;">${qualification}</strong>` : ''}
              </div>
              <div class="credential-row">
                <span class="label">Login Email:</span>
                <span class="value">${email}</span>
              </div>
              <div class="credential-row" style="margin-top: 8px;">
                <span class="label">Temporary Password:</span>
                <span class="value" style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</span>
              </div>
            </div>

            <p>For security, please click the button below to log in or set your own permanent password:</p>

            <div class="btn-container">
              <a href="${resetUrl}" class="btn">Log In & Set New Password</a>
            </div>

            <p style="font-size: 12px; color: #64748b; word-break: break-all;">
              Or copy this direct link into your browser:<br>
              <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
            </p>

            <div class="notice">
              <strong>Security Notice:</strong> Do not share these credentials with anyone. If you did not expect this account creation, please notify the hospital system administrator immediately.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Obesity Management System. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"ObesityCare Admin" <noreply@obesitycare.hospital.lk>',
      to: email,
      subject: 'Welcome to ObesityCare – Your Doctor Account & Credentials',
      html: mailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('\n=================== [DOCTOR WELCOME EMAIL DISPATCHED] ===================');
    console.log(`To: Dr. ${fullName} <${email}>`);
    console.log(`Specialisation: ${specialisation}`);
    console.log(`Temporary Password: ${password}`);
    console.log(`Set Password Link: ${resetUrl}`);
    console.log('=========================================================================\n');

    return { success: true, info };
  } catch (error) {
    console.error('Error sending doctor welcome email:', error);
    // Don't crash the server if email sending fails, just log it
    return { success: false, error: error.message };
  }
};
