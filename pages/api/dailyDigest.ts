import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { processEmails } from '../../lib/gemini';
import nodemailer from 'nodemailer';
import { getToken } from "next-auth/jwt"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { authorization } = req.headers;

  if (!authorization || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // In a real-world scenario, you would fetch user details from a database
    // based on a user ID provided in the cron job request.
    // For this example, we'll use the session of the currently logged-in user.
    // This is a limitation that would need to be addressed in a production environment.
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.accessToken) {
      return res.status(401).json({ error: 'Not authenticated or access token not found' });
    }

    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: token.accessToken as string });
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const gmailRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
    });
    const messages = gmailRes.data.messages || [];
    const emails = await Promise.all(
        messages.map(async (message) => {
            const email = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
            });
            return email.data;
        })
    );

    if (emails.length === 0) {
      return res.status(200).json({ message: 'No unread emails to process.' });
    }

    const processedData = await processEmails(emails);

    const htmlBody = `
      <h1>Your Daily Email Digest</h1>
      <p>Here's a summary of your unread emails:</p>
      <h2>Summary</h2>
      <p>${processedData.summary}</p>
      
      <h2>Categorized Emails</h2>
      ${Object.entries(processedData.categorizedEmails).map(([category, emailIds]) => `
        <h3>${category}</h3>
        <ul>
          ${(emailIds as string[]).map(id => `<li>${id}</li>`).join('')}
        </ul>
      `).join('')}

      <h2>Unsubscribe Suggestions</h2>
      <ul>
        ${processedData.unsubscribeSuggestions.map((s: any) => `<li>${s.emailId}: ${s.reason}</li>`).join('')}
      </ul>

      <h2>Reply Suggestions</h2>
      <ul>
        ${processedData.replySuggestions.map((s: any) => `<li>${s.emailId}: ${s.suggestedReply}</li>`).join('')}
      </ul>
    `;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: `"Inbox Detoxer" <${process.env.SMTP_USER}>`,
        to: token.email!,
        subject: 'Your Daily Email Digest',
        html: htmlBody,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}