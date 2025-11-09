import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Validate required environment variables
const validateEmailConfig = () => {
  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }
};

// Create transporter with validation
const createTransporter = () => {
  validateEmailConfig();
  
  const port = parseInt(process.env.EMAIL_PORT || '587');
  
  const config: SMTPTransport.Options = {
    host: process.env.EMAIL_HOST,
    port: port,
    secure: false, // false for STARTTLS (ports 587, 2525, 25, etc.)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
      minVersion: 'TLSv1.2', // Ensure modern TLS
    },
    // Connection timeouts
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };

  console.log('[Email Config]', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth?.user,
    from: process.env.EMAIL_FROM
  });

  return nodemailer.createTransport(config);
};

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const transporter = createTransporter();

    // Verify connection configuration
    await transporter.verify();
    console.log('[Email] SMTP connection verified successfully');

    const info = await transporter.sendMail({
      from: `"VERSEANDME SCALES" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('[Email] Message sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Error]', error);
    throw error;
  }
}