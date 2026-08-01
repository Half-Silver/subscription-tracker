import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import prisma from '../db';
import { decrypt } from '../utils/encryption';
import { extractSubscriptionDetails, ExtractedSubscriptionData } from '../llm/extractor';

export async function processAccountEmails(accountId: string, sinceDateOverride?: Date) {
  const account = await prisma.connectedAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('Account not found');

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: {
      user: account.email,
      pass: decrypt(account.password)
    },
    logger: false
  });

  await client.connect();

  // Select the inbox
  const lock = await client.getMailboxLock('INBOX');
  
  try {
    // Determine the date to search from. If override is provided, use it. Otherwise use lastSyncAt or default 30 days.
    const sinceDate = sinceDateOverride 
      ? sinceDateOverride
      : (account.lastSyncAt ? account.lastSyncAt : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    // Search for emails containing keywords like "receipt", "subscription", "invoice"
    // Note: complex OR searches vary by IMAP server. We'll do a simple since date and subject filter client side,
    // or just fetch all recent and filter.
    const searchOptions = { since: sinceDate };
    
    for await (const message of client.fetch(searchOptions, { envelope: true, source: true })) {
      const subject = message.envelope?.subject || '';
      
      const isLikelyReceipt = /receipt|invoice|payment|subscription|renew|order/i.test(subject);
      
      if (isLikelyReceipt && message.source) {
        const parsed = await simpleParser(message.source);
        const textBody = parsed.text || parsed.html || '';

        console.log(`Analyzing email: ${subject}`);
        const extraction = await extractSubscriptionDetails(subject, textBody);
        
        if (extraction && extraction.merchantName && extraction.amount > 0) {
          console.log('Extracted Subscription:', extraction);
          await handleExtractedData(extraction, parsed.messageId || message.uid.toString(), parsed.date || new Date());
        }
      }
    }

    // Update lastSyncAt
    await prisma.connectedAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() }
    });

  } finally {
    lock.release();
    await client.logout();
  }
}

export async function handleExtractedData(data: ExtractedSubscriptionData, emailId: string, emailDate: Date) {
  let paymentMethodId: string | null = null;
  if (data.paymentMethod) {
    const parts = data.paymentMethod.trim().split(' ');
    let last4 = parts.length > 1 ? parts.pop() : data.paymentMethod;
    if (!last4) last4 = data.paymentMethod;
    const name = parts.length > 0 ? parts.join(' ') : data.paymentMethod;
    
    let pm = await prisma.paymentMethod.findFirst({
      where: { last4 }
    });
    if (!pm) {
      pm = await prisma.paymentMethod.create({
        data: { name, last4 }
      });
    }
    paymentMethodId = pm.id;
  }

  // Case insensitive match
  const subscriptions = await prisma.subscription.findMany();
  let subscription = subscriptions.find(s => s.merchantName?.toLowerCase() === data.merchantName.toLowerCase());

  let action = 'none';

  if (subscription) {
    let status = subscription.status;
    let nextRenewalDate = subscription.nextRenewalDate;
    
    if (data.eventType === 'charge_confirmed') {
      status = 'ACTIVE';
      if (nextRenewalDate) {
        const d = new Date(nextRenewalDate);
        if (data.billingCycle === 'MONTHLY') d.setMonth(d.getMonth() + 1);
        else if (data.billingCycle === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
        nextRenewalDate = d;
      } else {
        const d = new Date(emailDate);
        if (data.billingCycle === 'MONTHLY') d.setMonth(d.getMonth() + 1);
        else if (data.billingCycle === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
        nextRenewalDate = d;
      }
      action = 'updated_charge';
    } else if (data.eventType === 'pre_debit_alert') {
      status = 'RENEWING_SOON';
      action = 'updated_pre_debit';
    } else if (data.eventType === 'charge_failed') {
      status = 'FAILED';
      action = 'updated_failed';
    }

    if (data.amount !== subscription.amount && data.eventType !== 'charge_failed') {
      await prisma.alert.create({
        data: {
          type: "price_change",
          title: `Price Changed: ${data.merchantName}`,
          body: `The amount changed from ${subscription.amount} to ${data.amount} ${data.currency}.`,
          actionLink: `/subscriptions/${subscription.id}`,
        }
      });
      action = 'price_changed';
    }

    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        amount: data.amount,
        nextRenewalDate,
        ...(paymentMethodId && { paymentMethodId })
      }
    });
  } else if (data.eventType === 'charge_confirmed') {
    let nextRenewalDate = data.nextRenewalDate ? new Date(data.nextRenewalDate) : null;
    if (!nextRenewalDate) {
      const d = new Date(emailDate);
      if (data.billingCycle === 'MONTHLY') d.setMonth(d.getMonth() + 1);
      else if (data.billingCycle === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
      nextRenewalDate = d;
    }

    subscription = await prisma.subscription.create({
      data: {
        name: data.merchantName,
        merchantName: data.merchantName,
        amount: data.amount,
        currency: data.currency,
        billingCycle: data.billingCycle,
        nextRenewalDate,
        status: 'ACTIVE',
        ...(paymentMethodId && { paymentMethodId })
      }
    });
    action = 'created';
  }

  if (subscription) {
    await prisma.renewalEvent.create({
      data: {
        subscriptionId: subscription.id,
        amount: data.amount,
        currency: data.currency,
        date: emailDate,
        emailId: emailId
      }
    });

    const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    const threshold = settings?.largeChargeThreshold || 5000;
    if (data.amount >= threshold) {
      await prisma.alert.create({
        data: {
          type: "large_charge",
          title: `Large Charge Detected: ${data.merchantName}`,
          body: `A charge of ${data.amount} ${data.currency} was processed for ${data.merchantName}.`,
          actionLink: `/subscriptions/${subscription.id}`,
        }
      });
    }
  }

  return { action, subscription, eventType: data.eventType };
}
