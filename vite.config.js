import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

function resendApiPlugin() {
  return {
    name: 'resend-api',
    configureServer(server) {
      server.middlewares.use('/api/send-enquiry', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const { name, businessName, phone, email, message, selectedPlan, billingCycle, planPrice } = data;

            if (!name || !businessName || !phone || !email) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
              return;
            }

            const recipientEmail = process.env.RESEND_TO || 'amarmicrosoft2021@gmail.com';

            const enquiryRecord = {
              id: 'ENQ-' + Date.now().toString(36).toUpperCase(),
              name: name.trim(),
              businessName: businessName.trim(),
              phone: phone.trim(),
              email: email.trim(),
              message: (message || '').trim(),
              selectedPlan: selectedPlan || '',
              billingCycle: billingCycle || '',
              planPrice: planPrice || '',
              receivedAt: new Date().toISOString(),
              targetEmail: recipientEmail
            };

            // Save to local enquiries log as persistent backup
            try {
              const logFile = path.resolve('enquiries.json');
              const existing = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8') || '[]') : [];
              existing.unshift(enquiryRecord);
              fs.writeFileSync(logFile, JSON.stringify(existing, null, 2));
            } catch (err) {
              console.error('Failed to log enquiry to file:', err);
            }

            const apiKey = process.env.RESEND_API_KEY;
            let emailResult = null;

            if (apiKey) {
              try {
                const resend = new Resend(apiKey);
                const htmlContent = `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
                    <div style="border-bottom: 2px solid #0C7744; padding-bottom: 12px; margin-bottom: 20px;">
                      <h2 style="color: #0C7744; margin: 0; font-size: 20px;">ZipBi — New Café Sales Enquiry</h2>
                      <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 13px;">Received from Official ZipBi Website Contact Form</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; width: 140px;"><strong>Client Name:</strong></td>
                        <td style="padding: 8px 0; color: #111827;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;"><strong>Café / Business:</strong></td>
                        <td style="padding: 8px 0; color: #111827;"><strong>${businessName}</strong></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;"><strong>Phone Number:</strong></td>
                        <td style="padding: 8px 0; color: #111827;"><a href="tel:${phone}" style="color: #0C7744; text-decoration: none;">${phone}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;"><strong>Email Address:</strong></td>
                        <td style="padding: 8px 0; color: #111827;"><a href="mailto:${email}" style="color: #0C7744; text-decoration: none;">${email}</a></td>
                      </tr>
                      ${selectedPlan ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280;"><strong>Selected Plan:</strong></td>
                        <td style="padding: 8px 0; color: #0C7744; font-weight: bold;">${selectedPlan} Plan (${billingCycle}) — ${planPrice}</td>
                      </tr>
                      ` : ''}
                      ${message ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; vertical-align: top;"><strong>Message:</strong></td>
                        <td style="padding: 8px 0; color: #374151; white-space: pre-wrap;">${message}</td>
                      </tr>
                      ` : ''}
                    </table>
                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px;">
                      <p style="margin: 0;">Enquiry ID: ${enquiryRecord.id} · Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
                      <p style="margin: 4px 0 0 0;">Operating Base: Coimbatore, Tamil Nadu, India.</p>
                    </div>
                  </div>
                `;

                emailResult = await resend.emails.send({
                  from: process.env.RESEND_FROM || 'ZipBi Sales <onboarding@resend.dev>',
                  to: [recipientEmail],
                  reply_to: email,
                  subject: `New Café Enquiry: ${businessName} (${name})`,
                  html: htmlContent,
                });
                console.log('[Resend] Email dispatch successfully processed:', emailResult);
              } catch (resendErr) {
                console.error('[Resend] Dispatch error:', resendErr);
                emailResult = { error: resendErr.message };
              }
            } else {
              console.warn('[Resend] Note: RESEND_API_KEY is not defined in .env. Enquiry recorded locally to enquiries.json.');
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              data: enquiryRecord,
              emailDispatched: !!apiKey && !emailResult?.error,
              resendResponse: emailResult,
              message: 'Your enquiry has been received. Our team will contact you shortly.'
            }));
          } catch (error) {
            console.error('Error handling enquiry:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: error.message || 'Internal server error' }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), resendApiPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
