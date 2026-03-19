import { Resend } from 'resend';

// This connects your app to the Resend service
export const resend = new Resend(process.env.RESEND_API_KEY);