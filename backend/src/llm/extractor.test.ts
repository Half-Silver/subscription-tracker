import { describe, it, expect, vi } from 'vitest';
import { extractSubscriptionDetails } from './extractor';

// Mock the global fetch
global.fetch = vi.fn();

describe('extractor', () => {
  it('should extract subscription details from an email', async () => {
    // Arrange
    const mockResponse = {
      choices: [
        {
          message: {
            content: `\`\`\`json
{
  "merchantName": "Netflix",
  "amount": 15.99,
  "currency": "USD",
  "billingCycle": "MONTHLY",
  "nextRenewalDate": "2024-05-10"
}
\`\`\``
          }
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const subject = "Your Netflix Receipt";
    const body = "Thank you for your payment of $15.99. Your next billing date is May 10, 2024.";

    // Act
    const result = await extractSubscriptionDetails(subject, body);

    // Assert
    expect(result).toEqual({
      merchantName: "Netflix",
      amount: 15.99,
      currency: "USD",
      billingCycle: "MONTHLY",
      nextRenewalDate: "2024-05-10"
    });
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as any).mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body);
    expect(fetchBody.messages[0].content).toContain(subject);
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    // Act
    const result = await extractSubscriptionDetails("Test", "Test body");

    // Assert
    expect(result).toBeNull();
  });
});
