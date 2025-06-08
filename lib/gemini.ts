import { GoogleGenerativeAI } from "@google/generative-ai";
import { tags } from './tags';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

export async function tagEmail(email: any) {
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

  const allTags = Object.values(tags).flat();

  const prompt = `
    Analyze the following email and provide a JSON response with the most appropriate tag.
    For each email, you MUST determine its importance and set the 'importance' field in the JSON response to one of the following exact string values: 'Important', 'Urgent', or 'Can Be Ignored'. This field is mandatory.

    You MUST assign exactly one tag to the email. The tag MUST be one of the following values: ${allTags.join(', ')}. Do not create new tags or use variations.

    The response should be in the following JSON format:
    {
      "emailId": "${email.id}",
      "tag": "The most appropriate tag",
      "importance": "<'Important' | 'Urgent' | 'Can Be Ignored'>"
    }

    Here is the email content:
    Subject: ${subject}
    From: ${from}
    Body: ${body}
  `;

  const result = await model.generateContent(prompt);
  const responseText = await result.response.text();
  const cleanedText = responseText
    .replace(/^```json\s*/, '')
    .replace(/```\s*$/, '');
  
  const parsedResponse = JSON.parse(cleanedText);

  if (parsedResponse.tag && !parsedResponse.tag.startsWith('[') && !parsedResponse.tag.endsWith(']')) {
    parsedResponse.tag = `[${parsedResponse.tag}]`;
  }

  if (!parsedResponse.importance) {
    parsedResponse.importance = 'Can Be Ignored';
  }

  return parsedResponse;
}

export default genAI;