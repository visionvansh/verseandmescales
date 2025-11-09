// utils/sms.ts
import twilio from 'twilio';

interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS(options: SMSOptions) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
   console.log({
    body: options.message,
    to: options.to,
    from: process.env.TWILIO_PHONE_NUMBER,
  });
}