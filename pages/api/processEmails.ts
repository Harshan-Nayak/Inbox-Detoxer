import type { NextApiRequest, NextApiResponse } from 'next';
import { processEmails } from '../../lib/gemini';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Invalid emails data' });
    }

    const processedData = await processEmails(emails);
    res.status(200).json(processedData);
  } catch (error) {
    console.error('Error processing emails:', error);
    res.status(500).json({ error: 'Failed to process emails' });
  }
}