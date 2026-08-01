export interface ExtractedSubscriptionData {
  merchantName: string;
  amount: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'UNKNOWN';
  nextRenewalDate?: string; // ISO format date string if found
  eventType: 'charge_confirmed' | 'pre_debit_alert' | 'charge_failed' | 'amount_changed';
  paymentMethod?: string;
}

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1/chat/completions';

export async function extractSubscriptionDetails(emailSubject: string, emailBody: string): Promise<ExtractedSubscriptionData | null> {
  const prompt = `
You are a helpful assistant that extracts subscription and payment details from emails.
Analyze the following email and extract the merchant name, payment amount, currency, billing cycle, next renewal date (if mentioned), event type, and payment method.
Respond ONLY with valid JSON. Do not include any explanations or markdown formatting outside the JSON.

Expected JSON schema:
{
  "merchantName": "string",
  "amount": number,
  "currency": "string (e.g., USD)",
  "billingCycle": "MONTHLY" | "YEARLY" | "WEEKLY" | "UNKNOWN",
  "nextRenewalDate": "YYYY-MM-DD or null if not found",
  "eventType": "charge_confirmed" | "pre_debit_alert" | "charge_failed" | "amount_changed",
  "paymentMethod": "string like 'HDFC 1234' or 'UPI @handle', or null"
}

Email Subject: ${emailSubject}
Email Body:
${emailBody.slice(0, 4000)} // Truncating to avoid massive token counts
`;

  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'local-model', // LM Studio typically ignores this if a model is loaded
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Low temperature for deterministic extraction
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`);
    }

    const data: any = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // Clean up potential markdown formatting like \`\`\`json
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedContent) as ExtractedSubscriptionData;
  } catch (err) {
    console.error('Failed to extract data via LLM:', err);
    return null;
  }
}
