import { google } from 'googleapis';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token.accessToken });

  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10, // Or however many you want to fetch
    });

    const messages = response.data.messages || [];
    const emails = await Promise.all(
      messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });
        return msg.data;
      })
    );

    res.status(200).json(emails);
  } catch (error) {
    console.error('The API returned an error: ' + error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
}