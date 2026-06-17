import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ContactBody = {
  name?: unknown;
  email?: unknown;
  mobile?: unknown;
  message?: unknown;
  source?: unknown;
  page?: unknown;
  companyWebsite?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function cleanMessage(value: unknown, max = 4000) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;') // Fixed: Changed from invalid '''
    .replaceAll('\n', '<br>');
}

export async function POST(request: NextRequest) {
  let body: ContactBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid enquiry data.' },
      { status: 400 }
    );
  }

  const honeypot = clean(body.companyWebsite, 200);
  if (honeypot) {
    return NextResponse.json({ message: 'Thank you. Your enquiry has been received.' });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 180).toLowerCase();
  const mobile = clean(body.mobile, 40);
  const message = cleanMessage(body.message, 4000);
  const source = clean(body.source, 140) || 'Website contact form';
  const page = clean(body.page, 500);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'Not available';
  const userAgent = request.headers.get('user-agent') || 'Not available';

  if (!name || name.length < 2) {
    return NextResponse.json({ message: 'Please enter your name.' }, { status: 400 });
  }

  if (!emailPattern.test(email)) {
    return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!mobile || mobile.length < 7) {
    return NextResponse.json({ message: 'Please enter a valid mobile number.' }, { status: 400 });
  }

  if (!message || message.length < 10) {
    return NextResponse.json({ message: 'Please enter a short message.' }, { status: 400 });
  }

  const token = process.env.MAILTRAP_API_TOKEN || process.env.MAILTRAP_API_KEY;
  const fromEmail = process.env.MAILTRAP_FROM_EMAIL;
  const fromName = process.env.MAILTRAP_FROM_NAME || 'WannaApps Website';
  const toEmail = process.env.CONTACT_TO_EMAIL || 'contact@wannaapps.com';
  const toName = process.env.CONTACT_TO_NAME || 'WannaApps';
  const sandboxInboxId = process.env.MAILTRAP_SANDBOX_INBOX_ID;

  if (!token || !fromEmail) {
    console.error('Mailtrap is not configured. Missing MAILTRAP_API_TOKEN or MAILTRAP_FROM_EMAIL.');
    return NextResponse.json(
      { message: 'Email service is not configured yet. Please call +91 9884732100.' },
      { status: 500 }
    );
  }

  const subject = `New WannaApps enquiry from ${name}`;
  const text = [
    'New WannaApps website enquiry',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Mobile: ${mobile}`,
    `Source: ${source}`,
    `Page: ${page}`,
    `IP: ${ip}`,
    `User Agent: ${userAgent}`,
    '',
    'Message:',
    message,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:720px">
      <h2 style="margin:0 0 16px;color:#111827">New WannaApps website enquiry</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:700">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:700">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:700">Mobile</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(mobile)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:700">Source</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(source)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:700">Page</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(page)}</td></tr>
      </table>
      <h3 style="margin:20px 0 8px;color:#111827">Message</h3>
      <div style="padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px">${escapeHtml(message)}</div>
      <p style="margin-top:18px;color:#6b7280;font-size:13px">IP: ${escapeHtml(ip)}<br>User Agent: ${escapeHtml(userAgent)}</p>
    </div>
  `;

  const payload = {
    from: { email: fromEmail, name: fromName },
    to: [{ email: toEmail, name: toName }],
    subject,
    text,
    html,
  };

  const endpoint = sandboxInboxId
    ? `https://sandbox.api.mailtrap.io/api/send/${sandboxInboxId}`
    : 'https://send.api.mailtrap.io/api/send';

  // Fixed: Added Record<string, string> type here to resolve fetch overload conflict
  const authHeaders: Record<string, string> = sandboxInboxId
    ? { 'Api-Token': token }
    : { Authorization: `Bearer ${token}` };

  const mailtrapResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!mailtrapResponse.ok) {
    const errorText = await mailtrapResponse.text().catch(() => '');
    console.error('Mailtrap send failed:', mailtrapResponse.status, errorText);
    return NextResponse.json(
      { message: 'Unable to send enquiry right now. Please call +91 9884732100.' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: 'Thank you. Your enquiry has been sent to WannaApps.',
  });
}
