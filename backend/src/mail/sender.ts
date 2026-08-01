import nodemailer from 'nodemailer';
import prisma from '../db';
import { decrypt } from '../utils/encryption';

export async function sendAlert(subscription: any) {
  const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
  const amountStr = `${subscription.amount} ${subscription.currency}`;
  const renewalDate = subscription.nextRenewalDate 
    ? new Date(subscription.nextRenewalDate).toLocaleDateString() 
    : 'soon';

  // Create an in-app alert first
  await prisma.alert.create({
    data: {
      type: "renewal",
      title: `Upcoming Renewal: ${subscription.merchantName || subscription.name}`,
      body: `Your subscription is scheduled to renew on ${renewalDate} for ${amountStr}.`,
      actionLink: `/subscriptions/${subscription.id}`,
    }
  });

  // Check if email notifications are enabled
  if (settings?.notify === "none" || settings?.notify === "desktop") {
    console.log(`[ALERT] In-app alert created. Email notifications are disabled in settings.`);
    return;
  }

  // Find an account to use for sending
  const accountId = settings?.smtpSenderAccountId;
  const account = accountId 
    ? await prisma.connectedAccount.findUnique({ where: { id: accountId } })
    : await prisma.connectedAccount.findFirst();
  
  if (!account) {
    console.warn('[ALERT] No connected account found to send SMTP alert.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: {
      user: account.email,
      pass: decrypt(account.password)
    }
  });

  // Variables already defined above

  const mailOptions = {
    from: `"Subscription Tracker" <${account.email}>`,
    to: account.email, // Send alert to yourself
    subject: `🚨 Upcoming Renewal: ${subscription.merchantName || subscription.name} (${amountStr})`,
    text: `Heads up!\n\nYour subscription for ${subscription.merchantName || subscription.name} is scheduled to renew on ${renewalDate} for ${amountStr}.\n\n- Subscription Tracker (Local)`,
    html: `
      <h2>Upcoming Renewal Alert</h2>
      <p>Heads up! Your subscription is renewing soon.</p>
      <ul>
        <li><strong>Merchant:</strong> ${subscription.merchantName || subscription.name}</li>
        <li><strong>Amount:</strong> ${amountStr}</li>
        <li><strong>Date:</strong> ${renewalDate}</li>
        <li><strong>Cycle:</strong> ${subscription.billingCycle}</li>
      </ul>
      <p><em>- Subscription Tracker (Local)</em></p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[ALERT] Email sent for ${subscription.name}: ${info.messageId}`);
  } catch (err) {
    console.error(`[ALERT] Failed to send email for ${subscription.name}:`, err);
  }
}
