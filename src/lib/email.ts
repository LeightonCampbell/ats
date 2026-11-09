import { Resend } from "resend";
import { getEnv } from "./worker-env";

function getResend() {
  const key = getEnv("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

function requireFromEmail(): string {
  const fromEmail = getEnv("FROM_EMAIL");
  if (!fromEmail) throw new Error("FROM_EMAIL is not configured");
  return fromEmail;
}

function requireAdminEmail(): string {
  const adminEmail = getEnv("ADMIN_EMAIL");
  if (!adminEmail) throw new Error("ADMIN_EMAIL is not configured");
  return adminEmail;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Contact / speaking / course inquiry → admin inbox */
export async function sendInquiryToAdmin({
  fullName,
  email,
  phone,
  message,
  subject = "Website inquiry",
}: {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  subject?: string;
}) {
  const resend = getResend();
  const fromEmail = requireFromEmail();
  const adminEmail = requireAdminEmail();

  await resend.emails.send({
    from: `ATS Inquiries <${fromEmail}>`,
    to: adminEmail,
    replyTo: email,
    subject,
    html: `
      <h2>${escapeHtml(subject)}</h2>
      <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit;background:#f5f5f7;padding:16px;border-radius:8px;">${escapeHtml(message)}</pre>
    `,
  });
}

/** Auto-reply to the person who submitted an inquiry */
export async function sendInquiryAutoReply({
  to,
  fullName,
}: {
  to: string;
  fullName: string;
}) {
  const resend = getResend();
  const fromEmail = requireFromEmail();

  await resend.emails.send({
    from: `Alert Training Services <${fromEmail}>`,
    to,
    subject: "We received your inquiry — Alert Training Services",
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Thanks for contacting Alert Training Services. We received your message and will get back to you soon.</p>
      <p>If you need help right away, call us at <strong>323-921-6244</strong> or email <strong>info@alerttrainingservices.com</strong>.</p>
      <p>— Alert Training Services, LLC</p>
    `,
  });
}

/** Newsletter signup → admin */
export async function sendNewsletterSignupToAdmin({ email }: { email: string }) {
  const resend = getResend();
  const fromEmail = requireFromEmail();
  const adminEmail = requireAdminEmail();

  await resend.emails.send({
    from: `ATS Newsletter <${fromEmail}>`,
    to: adminEmail,
    subject: `Newsletter signup: ${email}`,
    html: `
      <h2>Newsletter signup</h2>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    `,
  });
}

/** Newsletter confirmation → subscriber */
export async function sendNewsletterConfirmation({ email }: { email: string }) {
  const resend = getResend();
  const fromEmail = requireFromEmail();

  await resend.emails.send({
    from: `Alert Training Services <${fromEmail}>`,
    to: email,
    subject: "You're on the list — Alert Training Services",
    html: `
      <p>Thanks for subscribing.</p>
      <p>We'll share class openings, workplace training tips, and speaking updates. No spam.</p>
      <p>— Alert Training Services, LLC</p>
    `,
  });
}

/** Daycare guide purchase → admin */
export async function sendGuidePurchaseToAdmin({
  email,
  firstName,
  paymentIntentId,
  productTitle,
}: {
  email: string;
  firstName?: string;
  paymentIntentId: string;
  productTitle: string;
}) {
  const resend = getResend();
  const fromEmail = requireFromEmail();
  const adminEmail = requireAdminEmail();

  await resend.emails.send({
    from: `ATS Sales <${fromEmail}>`,
    to: adminEmail,
    subject: `Guide purchase: ${productTitle}`,
    html: `
      <h2>Guide purchase</h2>
      <p><strong>Name:</strong> ${escapeHtml(firstName || "Not provided")}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Product:</strong> ${escapeHtml(productTitle)}</p>
      <p><strong>Payment ID:</strong> ${escapeHtml(paymentIntentId)}</p>
    `,
  });
}

/** Optional buyer confirmation for daycare guide */
export async function sendGuidePurchaseConfirmation({
  to,
  firstName,
  productTitle,
}: {
  to: string;
  firstName?: string;
  productTitle: string;
}) {
  const resend = getResend();
  const fromEmail = requireFromEmail();
  const greeting = firstName?.trim() ? escapeHtml(firstName.trim()) : "there";

  await resend.emails.send({
    from: `Alert Training Services <${fromEmail}>`,
    to,
    subject: `Your download — ${productTitle}`,
    html: `
      <p>Hi ${greeting},</p>
      <p>Thanks for purchasing <strong>${escapeHtml(productTitle)}</strong>. Your downloads should appear on the confirmation page.</p>
      <p>Questions? Call <strong>323-921-6244</strong> or email <strong>info@alerttrainingservices.com</strong>.</p>
      <p>— Alert Training Services, LLC</p>
    `,
  });
}

/** Receipt email sent to the student after EMSA enrollment */
export async function sendReceiptEmail({
  to,
  name,
  classTitle,
  classDate,
  paymentIntentId,
  zoomJoinUrl1,
  zoomJoinUrl2,
}: {
  to: string;
  name: string;
  classTitle: string;
  classDate: string;
  paymentIntentId: string;
  zoomJoinUrl1: string;
  zoomJoinUrl2: string;
}) {
  const resend = getResend();
  const fromEmail = requireFromEmail();
  await resend.emails.send({
    from: `Alert Training Services <${fromEmail}>`,
    to,
    subject: `Your booking is confirmed — ${classTitle}`,
    html: receiptTemplate({
      name,
      classTitle,
      classDate,
      paymentIntentId,
      zoomJoinUrl1,
      zoomJoinUrl2,
    }),
  });
}

/** Notification email sent to the admin after enrollment */
export async function sendAdminNotification({
  studentName,
  studentEmail,
  studentPhone,
  mailingAddress,
  classTitle,
  classDate,
  paymentIntentId,
}: {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  mailingAddress?: string;
  classTitle: string;
  classDate: string;
  paymentIntentId: string;
}) {
  const resend = getResend();
  const fromEmail = requireFromEmail();
  const adminEmail = requireAdminEmail();
  await resend.emails.send({
    from: `ATS Bookings <${fromEmail}>`,
    to: adminEmail,
    subject: `New enrollment: ${studentName} — ${classTitle}`,
    html: `
      <h2>New Enrollment</h2>
      <p><strong>Name:</strong> ${escapeHtml(studentName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(studentEmail)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(studentPhone || "Not provided")}</p>
      <p><strong>Mailing address:</strong> ${escapeHtml(mailingAddress || "Not provided")}</p>
      <p><strong>Class:</strong> ${escapeHtml(classTitle)}</p>
      <p><strong>Date:</strong> ${escapeHtml(classDate)}</p>
      <p><strong>Payment ID:</strong> ${escapeHtml(paymentIntentId)}</p>
    `,
  });
}

function receiptTemplate({
  name,
  classTitle,
  classDate,
  paymentIntentId,
  zoomJoinUrl1,
  zoomJoinUrl2,
}: {
  name: string;
  classTitle: string;
  classDate: string;
  paymentIntentId: string;
  zoomJoinUrl1: string;
  zoomJoinUrl2: string;
}) {
  const safe = {
    name: escapeHtml(name),
    classTitle: escapeHtml(classTitle),
    classDate: escapeHtml(classDate),
    paymentIntentId: escapeHtml(paymentIntentId),
    zoomJoinUrl1,
    zoomJoinUrl2,
  };
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, Arial, sans-serif; background: #f5f5f7; margin: 0; padding: 40px 16px; }
    .card { background: white; max-width: 560px; margin: 0 auto; border-radius: 16px; overflow: hidden; }
    .header { background: #0F2744; padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0; }
    .header p { color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .row:last-of-type { border-bottom: none; }
    .label { color: #86868b; }
    .value { font-weight: 600; color: #1d1d1f; }
    .total-row { background: #eef2f7; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; margin: 20px 0; }
    .total-label { color: #0F2744; font-weight: 600; }
    .total-value { color: #0F2744; font-weight: 700; font-size: 20px; }
    .zoom-box { background: #eef2f7; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
    .zoom-box p { color: #515154; font-size: 14px; margin: 0 0 14px; }
    .zoom-btn { display: inline-block; background: #0F2744; color: white; padding: 12px 28px; border-radius: 980px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { padding: 20px 32px; background: #f5f5f7; text-align: center; font-size: 12px; color: #86868b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Booking Confirmed ✓</h1>
      <p>Alert Training Services · Los Angeles, CA</p>
    </div>
    <div class="body">
      <p style="font-size:15px;color:#1d1d1f;">Hi ${safe.name},</p>
      <p style="font-size:14px;color:#515154;line-height:1.6;">
        You're enrolled! Here are your booking details. Your personal Zoom join links for both class nights are below — save them somewhere safe.
      </p>

      <div style="margin:24px 0;">
        <div class="row"><span class="label">Course</span><span class="value">${safe.classTitle}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${safe.classDate}</span></div>
        <div class="row"><span class="label">Format</span><span class="value">Online (Zoom)</span></div>
        <div class="row"><span class="label">Payment ID</span><span class="value">${safe.paymentIntentId}</span></div>
      </div>

      <div class="total-row">
        <span class="total-label">Amount Paid</span>
        <span class="total-value">$80.00</span>
      </div>

      <div class="zoom-box">
        <p style="font-weight:600;margin-bottom:16px;">Your personal Zoom join links:</p>
        <p style="font-size:13px;color:#515154;margin-bottom:8px;">Session 1 — Monday</p>
        <a class="zoom-btn" href="${safe.zoomJoinUrl1}">Join Session 1 →</a>
        <p style="margin:10px 0 20px;font-size:11px;color:#86868b;">${escapeHtml(safe.zoomJoinUrl1)}</p>
        <p style="font-size:13px;color:#515154;margin-bottom:8px;">Session 2 — Tuesday</p>
        <a class="zoom-btn" href="${safe.zoomJoinUrl2}">Join Session 2 →</a>
        <p style="margin-top:10px;font-size:11px;color:#86868b;">${escapeHtml(safe.zoomJoinUrl2)}</p>
      </div>

      <p style="font-size:13px;color:#86868b;line-height:1.6;">
        Questions? Reply to this email or call us at <strong>323-921-6244</strong>.<br>
        We look forward to seeing you in class!
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Alert Training Services, LLC · Los Angeles, CA<br>
      This is an automated confirmation — please keep it for your records.
    </div>
  </div>
</body>
</html>
  `;
}
