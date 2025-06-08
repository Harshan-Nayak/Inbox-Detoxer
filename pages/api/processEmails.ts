import type { NextApiRequest, NextApiResponse } from 'next';
import { tagEmail } from '../../lib/gemini';
import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailIds } = req.body;

    if (!emailIds || !Array.isArray(emailIds)) {
      return res.status(400).json({ error: 'Invalid email IDs data' });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token.accessToken });
    const gmail = google.gmail({ version: 'v1', auth });

    const processedEmails = await Promise.all(
      emailIds.map(async (emailId: string) => {
        const emailDetails = await gmail.users.messages.get({ userId: 'me', id: emailId });
        const email = emailDetails.data;

        const parsedResponse = await tagEmail(email);
        const cleanEmail: { emailId: string; tag?: string; importance?: string } = { emailId: email.id! };

        if (parsedResponse.tag) {
          cleanEmail.tag = parsedResponse.tag;
        } else {
          cleanEmail.tag = "Miscellaneous";
        }

        if (["Important", "Urgent", "Can Be Ignored"].includes(parsedResponse.importance)) {
          cleanEmail.importance = parsedResponse.importance;
        } else {
          cleanEmail.importance = "Can Be Ignored";
        }

        return cleanEmail;
      })
    );

    res.status(200).json(processedEmails);
  } catch (error) {
    console.error('Error processing emails:', error);
    res.status(500).json({ error: 'Failed to process emails' });
  }
}