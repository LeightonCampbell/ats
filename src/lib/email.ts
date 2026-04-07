import { Resend } from "resend";

function getResend() {
  const key = import.meta.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Receipt email sent to the student
export async function sendReceiptEmail({
  to,
  name,
  classTitle,
  classDate,
  paypalOrderId,
  zoomJoinUrl1,
  zoomJoinUrl2,
}: {
  to: string;
  name: string;
  classTitle: string;
  classDate: string;
  paypalOrderId: string;
  zoomJoinUrl1: string;
  zoomJoinUrl2: string;
}) {
  const resend = getResend();
  const fromEmail = import.meta.env.FROM_EMAIL;
  await resend.emails.send({
    from: `Alert Training Services <${fromEmail}>`,
    to,
    subject: `Your booking is confirmed — ${classTitle}`,
    html: receiptTemplate({
      name,
      classTitle,
      classDate,
      paypalOrderId,
      zoomJoinUrl1,
      zoomJoinUrl2,
    }),
  });
}

// Notification email sent to the admin
export async function sendAdminNotification({
  studentName,
  studentEmail,
  studentPhone,
  classTitle,
  classDate,
  paypalOrderId,
}: {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  classTitle: string;
  classDate: string;
  paypalOrderId: string;
}) {
  const resend = getResend();
  const fromEmail = import.meta.env.FROM_EMAIL;
  const adminEmail = import.meta.env.ADMIN_EMAIL;
  await resend.emails.send({
    from: `ATS Bookings <${fromEmail}>`,
    to: adminEmail,
    subject: `New enrollment: ${studentName} — ${classTitle}`,
    html: `
      <h2>New Enrollment</h2>
      <p><strong>Name:</strong> ${escapeHtml(studentName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(studentEmail)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(studentPhone || "Not provided")}</p>
      <p><strong>Class:</strong> ${escapeHtml(classTitle)}</p>
      <p><strong>Date:</strong> ${escapeHtml(classDate)}</p>
      <p><strong>PayPal Order ID:</strong> ${escapeHtml(paypalOrderId)}</p>
    `,
  });
}

function receiptTemplate({
  name,
  classTitle,
  classDate,
  paypalOrderId,
  zoomJoinUrl1,
  zoomJoinUrl2,
}: {
  name: string;
  classTitle: string;
  classDate: string;
  paypalOrderId: string;
  zoomJoinUrl1: string;
  zoomJoinUrl2: string;
}) {
  const safe = {
    name: escapeHtml(name),
    classTitle: escapeHtml(classTitle),
    classDate: escapeHtml(classDate),
    paypalOrderId: escapeHtml(paypalOrderId),
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
    .header { background: #1B3A5C; padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0; }
    .header p { color: rgba(255,255,255,0.6); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .row:last-of-type { border-bottom: none; }
    .label { color: #86868b; }
    .value { font-weight: 600; color: #1d1d1f; }
    .total-row { background: #eef2f7; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; margin: 20px 0; }
    .total-label { color: #1B3A5C; font-weight: 600; }
    .total-value { color: #1B3A5C; font-weight: 700; font-size: 20px; }
    .zoom-box { background: #eef2f7; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
    .zoom-box p { color: #515154; font-size: 14px; margin: 0 0 14px; }
    .zoom-btn { display: inline-block; background: #1B3A5C; color: white; padding: 12px 28px; border-radius: 980px; text-decoration: none; font-weight: 700; font-size: 14px; }
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
        <div class="row"><span class="label">Order ID</span><span class="value">${safe.paypalOrderId}</span></div>
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
      © 2026 Alert Training Services · Los Angeles, CA<br>
      This is an automated receipt — please keep it for your records.
    </div>
  </div>
</body>
</html>
  `;
}
