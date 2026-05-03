const SKIP_LABELS = ['CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_SOCIAL', 'CATEGORY_FORUMS'];

const SPAM_SENDER_PATTERNS = [
  'noreply', 'no-reply', 'donotreply', 'do-not-reply',
  'newsletter', 'subscribe', 'unsubscribe',
  'team@', 'hello@', 'info@', 'support@',
  'notifications@', 'updates@', 'mailer@', 'billing@',
];

const SPAM_SUBJECT_PATTERNS = [
  'roundup', 'newsletter', 'digest', 'weekly', 'deals',
  'offer', 'unsubscribe', '% off', 'discount', 'promo',
];

async function sendToActiveTab(msg) {
  const allTabs = await chrome.tabs.query({});
  // Prefer active http tabs that aren't Gmail (Gmail can be noisy), fall back to any http tab
  const httpTabs = allTabs.filter(t => t.url && t.url.startsWith('http'));
  const preferred = httpTabs.filter(t => !t.url.includes('mail.google.com'));
  const ordered = [
    ...preferred.filter(t => t.active),
    ...preferred.filter(t => !t.active),
    ...httpTabs.filter(t => t.url.includes('mail.google.com')),
  ];

  for (const tab of ordered) {
    try {
      console.log('[SlugMind] trying tab:', tab.id, tab.url);
      const response = await chrome.tabs.sendMessage(tab.id, msg);
      console.log('[SlugMind] panel reached on tab:', tab.id, response);
      return;
    } catch (err) {
      console.log('[SlugMind] tab', tab.id, 'no content script:', err.message);
    }
  }
  console.log('[SlugMind] no tab has ambient-panel.js loaded — open any webpage');
}

async function postActivity(dashboardUrl, payload) {
  try {
    await fetch(`${dashboardUrl}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {}
}

function isRealPerson(from) {
  const lower = from.toLowerCase();
  // Must have a display name before the angle bracket
  const hasDisplayName = from.includes('<') && !from.trim().startsWith('<');
  if (!hasDisplayName) return false;
  // Display name must not look like a service/team name
  const displayName = from.slice(0, from.indexOf('<')).toLowerCase().trim().replace(/['"]/g, '');
  const serviceWords = ['team', 'support', 'newsletter', 'noreply', 'no-reply', 'info',
    'hello', 'updates', 'notifications', 'help', 'billing', 'mailer', 'digest'];
  if (serviceWords.some(w => displayName.includes(w))) return false;
  return true;
}

function shouldShowAlert(labelIds, from, subject) {
  // Category check FIRST — hard reject before anything else
  if (SKIP_LABELS.some(l => labelIds.includes(l))) {
    console.log('[SlugMind] filtered: category label hit:', labelIds.filter(l => SKIP_LABELS.includes(l)));
    return false;
  }
  if (!labelIds.includes('INBOX'))  { console.log('[SlugMind] filtered: no INBOX label');  return false; }
  if (!labelIds.includes('UNREAD')) { console.log('[SlugMind] filtered: no UNREAD label'); return false; }
  const lowerFrom = from.toLowerCase();
  if (SPAM_SENDER_PATTERNS.some(p => lowerFrom.includes(p))) {
    console.log('[SlugMind] filtered: spam sender pattern');
    return false;
  }
  const lowerSubject = (subject || '').toLowerCase();
  if (SPAM_SUBJECT_PATTERNS.some(p => lowerSubject.includes(p))) {
    console.log('[SlugMind] filtered: spam subject pattern');
    return false;
  }
  if (!isRealPerson(from)) {
    console.log('[SlugMind] filtered: not a real person sender');
    return false;
  }
  return true;
}

export async function checkEmails() {
  console.log('[SlugMind] checkEmails() called');
  const token = await new Promise(res => chrome.identity.getAuthToken({ interactive: false }, res));
  if (!token) return;

  let res;
  try {
    res = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread+in:inbox&maxResults=15',
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch { return; }
  if (!res.ok) return;

  const data = await res.json();
  const messages = data.messages || [];
  console.log('[SlugMind] found emails:', messages.length);

  const { shownEmailIds = [] } = await chrome.storage.session.get('shownEmailIds');
  const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');

  for (const msgMeta of messages) {
    if (shownEmailIds.includes(msgMeta.id)) continue;

    // Mark seen immediately so next poll skips it even if we bail early
    const { shownEmailIds: cur = [] } = await chrome.storage.session.get('shownEmailIds');
    await chrome.storage.session.set({ shownEmailIds: [...cur, msgMeta.id] });

    let msgRes;
    try {
      msgRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msgMeta.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { continue; }
    if (!msgRes.ok) continue;

    const msg = await msgRes.json();
    const headers = msg.payload?.headers || [];
    const subject    = extractHeader(headers, 'Subject')    || '(no subject)';
    const fromHeader = extractHeader(headers, 'From')       || '';
    const messageId  = extractHeader(headers, 'Message-ID') || '';

    console.log('[SlugMind] email labels:', msg.labelIds);
    console.log('[SlugMind] email from:', fromHeader);
    console.log('[SlugMind] email subject:', subject);

    if (!shouldShowAlert(msg.labelIds || [], fromHeader, subject)) {
      console.log('[SlugMind] filtered out:', subject);
      continue;
    }
    console.log('[SlugMind] passed filter, building alert for:', subject);

    const body = extractBody(msg.payload);
    const preview = body.replace(/\s+/g, ' ').trim().slice(0, 150);

    // Draft reply with Gemini (best-effort — panel shows even if draft fails)
    const systemPrompt =
      'You are a helpful assistant for a college student at UCSC. Draft a short, friendly, natural reply to this email. Keep it under 80 words. Sound like a student, not a robot. Do not start with "I hope this email finds you well". Return ONLY the email body, nothing else.';
    const prompt = `Subject: ${subject}\nFrom: ${fromHeader}\n\nEmail:\n${body.slice(0, 1000)}`;

    let draftText = '';
    try {
      const geminiRes = await fetch(`${dashboardUrl}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt }),
      });
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        draftText = geminiData.text || '';
      }
    } catch {}

    // "to" is the original sender — that's who the reply goes to
    await sendToActiveTab({
      type: 'SHOW_EMAIL_ALERT',
      emailId:   msgMeta.id,
      messageId,
      threadId:  msg.threadId,
      from:      fromHeader,
      subject,
      preview,
      draft:     draftText,
      to:        fromHeader,
    });

    await postActivity(dashboardUrl, {
      type: 'email_drafted',
      subject,
      from: fromHeader,
      preview: preview.substring(0, 100),
    });

    // One panel per poll cycle to avoid flooding
    break;
  }
}

export async function sendDraft({ emailId, messageId, threadId, to, subject, body }) {
  const token = await new Promise(res => chrome.identity.getAuthToken({ interactive: false }, res));
  if (!token) return false;

  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
  const headers = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
  ];
  if (messageId) {
    headers.push(`In-Reply-To: ${messageId}`);
    headers.push(`References: ${messageId}`);
  }
  const rawMessage = [...headers, '', body].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded, threadId }),
    });
    if (!res.ok) return false;
  } catch { return false; }

  // Mark original as read
  try {
    await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    });
  } catch {}

  const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');
  await postActivity(dashboardUrl, { type: 'email_sent', subject, to });
  return true;
}

function extractHeader(headers, name) {
  const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : null;
}

function extractBody(payload) {
  if (!payload) return '';
  if (payload.body?.data) return base64UrlDecode(payload.body.data);
  const parts = payload.parts || [];
  const textPart = parts.find(p => p.mimeType === 'text/plain');
  if (textPart?.body?.data) return base64UrlDecode(textPart.body.data);
  for (const part of parts) {
    const nested = extractBody(part);
    if (nested) return nested;
  }
  return '';
}

function base64UrlDecode(data) {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(
      atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
  } catch {
    return atob(base64);
  }
}
