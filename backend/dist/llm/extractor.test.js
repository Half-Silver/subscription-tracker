"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const extractor_1 = require("./extractor");
// Mock the global fetch
global.fetch = vitest_1.vi.fn();
(0, vitest_1.describe)('extractor', () => {
    (0, vitest_1.it)('should extract subscription details from an email', async () => {
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
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const subject = "Your Netflix Receipt";
        const body = "Thank you for your payment of $15.99. Your next billing date is May 10, 2024.";
        // Act
        const result = await (0, extractor_1.extractSubscriptionDetails)(subject, body);
        // Assert
        (0, vitest_1.expect)(result).toEqual({
            merchantName: "Netflix",
            amount: 15.99,
            currency: "USD",
            billingCycle: "MONTHLY",
            nextRenewalDate: "2024-05-10"
        });
        // Verify fetch was called correctly
        (0, vitest_1.expect)(global.fetch).toHaveBeenCalledTimes(1);
        const fetchCall = global.fetch.mock.calls[0];
        const fetchBody = JSON.parse(fetchCall[1].body);
        (0, vitest_1.expect)(fetchBody.messages[0].content).toContain(subject);
    });
    (0, vitest_1.it)('should handle API errors gracefully', async () => {
        // Arrange
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });
        // Act
        const result = await (0, extractor_1.extractSubscriptionDetails)("Test", "Test body");
        // Assert
        (0, vitest_1.expect)(result).toBeNull();
    });
});
