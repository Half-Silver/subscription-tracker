import { Router } from 'express';
import { extractSubscriptionDetails } from '../llm/extractor';
import { handleExtractedData } from '../mail/fetcher';
import crypto from 'crypto';

const router = Router();

router.post('/', async (req, res) => {
  const { emailText } = req.body;
  if (!emailText) {
    return res.status(400).json({ error: 'emailText is required' });
  }

  try {
    const extraction = await extractSubscriptionDetails('Ingested Email', emailText);
    if (!extraction) {
      return res.status(500).json({ error: 'Failed to extract data' });
    }
    
    const result = await handleExtractedData(extraction, 'ingest-' + crypto.randomUUID(), new Date());
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process email text' });
  }
});

router.post('/test', async (req, res) => {
  const { merchant, amount, currency, paymentMethod, eventType, date } = req.body;
  
  if (!merchant || amount == null || !currency || !eventType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const extraction = {
      merchantName: merchant,
      amount: amount,
      currency: currency,
      billingCycle: 'UNKNOWN' as any,
      eventType: eventType,
      paymentMethod: paymentMethod
    };

    const emailDate = date ? new Date(date) : new Date();
    const result = await handleExtractedData(extraction, 'test-' + crypto.randomUUID(), emailDate);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process test data' });
  }
});

export default router;
