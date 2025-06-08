import { google } from 'googleapis';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token.accessToken });

  const gmail = google.gmail({ version: 'v1', auth });

  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: ids,
        removeLabelIds: ['UNREAD', 'INBOX'],
      },
    });

    res.status(200).json({ message: 'Emails cleaned successfully' });
  } catch (error) {
    console.error('The API returned an error: ' + error);
    res.status(500).json({ error: 'Failed to clean emails' });
  }
}