import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

export async function processEmails(emails: any[]) {
  const processedEmails = emails.map((email: any) => {
    const headers = email.payload.headers;
    const subject = headers.find((header: any) => header.name === 'Subject')?.value || '';
    const from = headers.find((header: any) => header.name === 'From')?.value || '';
    
    let body = '';
    if (email.payload.parts) {
      const part = email.payload.parts.find((part: any) => part.mimeType === 'text/plain');
      if (part && part.body && part.body.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    } else if (email.payload.body && email.payload.body.data) {
      body = Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
    }

    return {
      id: email.id,
      subject,
      from,
      body,
    };
  });

  const prompt = `
    Analyze the following emails and provide a JSON response with the structure:
    {
      "summary": "A concise summary of all the important emails.",
      "categorizedEmails": {
        "Promo": ["emailId1", "emailId2"],
        "Work": ["emailId3"],
        "Personal": ["emailId4"]
      },
      "unsubscribeSuggestions": [
        { "emailId": "emailId1", "reason": "This appears to be a promotional email you haven't engaged with." }
      ],
      "replySuggestions": [
        { "emailId": "emailId3", "suggestedReply": "Thank you for the update. I will review this and get back to you shortly." }
      ]
    }

    Here are the emails:
    ${JSON.stringify(processedEmails, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  const responseText = await result.response.text();
  const cleanedText = responseText
    .replace(/^```json\s*/, '')
    .replace(/```\s*$/, '');

  const parsedResponse = JSON.parse(cleanedText);

  if (!parsedResponse.categorizedEmails || typeof parsedResponse.categorizedEmails !== 'object' || parsedResponse.categorizedEmails === null) {
    parsedResponse.categorizedEmails = {};
  }

  return parsedResponse;
}

export default genAI;