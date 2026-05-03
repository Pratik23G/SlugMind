import { logAction } from './service-worker.js';

async function sendToActiveTab(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
}

const SKIP_LABELS = ['CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_SOCIAL', 'CATEGORY_FORUMS'];

const SPAM_SENDER_PATTERNS = [
  'noreply', 'no-reply', 'donotreply', 'do-not-reply',
  'newsletter', 'subscribe', 'unsubscribe', 'marketing',
  'notification', 'alert@', 'updates@', 'confirm@',
];

const SKIP_SUBJECT_PATTERNS = [
  'unsubscribe', 'deal', 'offer', '% off', 'discount',
  'promo', 'newsletter', 'notification', 'alert',
  'verify your', 'confirm your', 'receipt', 'invoice',
  'order confirmation', 'shipping', 'delivery', 'package',
  'statement', 'sale ', ' sale',
];

async function shouldDraftReply(emailMeta, trustedSenders, settings) {
  const senderEmail = extractEmailAddress(emailMeta.from || '');
  const senderFull = (emailMeta.from || '').toLowerCase();
  const subject = (emailMeta.subject || '').toLowerCase();
  const labels = emailMeta.labelIds || [];

  // Trusted senders always bypass all filters
  if (trustedSenders.map(s => s.toLowerCase()).includes(senderEmail)) return true;

  // UCSC emails bypass if setting is on (default true)
  if (settings.includeUCSC !== false && senderEmail.endsWith('@ucsc.edu')) return true;

  // Gmail category label check — fastest rejection
  if (SKIP_LABELS.some(l => labels.includes(l))) return false;

  // Must be in INBOX
  if (!labels.includes('INBOX')) return false;

  // Sender pattern check
  if (SPAM_SENDER_PATTERNS.some(p => senderFull.includes(p))) return false;

  // Subject pattern check
  if (SKIP_SUBJECT_PATTERNS.some(p => subject.includes(p))) return false;

  // "Only known senders" filter (default true)
  if (settings.onlyKnownSenders !== false) {
    // Real person has a display name before their <email>
    const hasDisplayName = emailMeta.from.includes('<') && !emailMeta.from.trim().startsWith('<');
    if (!hasDisplayName) return false;

    // Check if we've replied to this sender before
    const { actionLog = [] } = await chrome.storage.local.get('actionLog');
    const prevReplied = actionLog.some(
      a => a.type === 'email' && a.outcome === 'sent' && (a.to || '').toLowerCase().includes(senderEmail)
    );

    // Allow if previously replied; otherwise still allow (display name is enough)
    // The display-name check above is the primary gate for "known"
    if (!hasDisplayName && !prevReplied) return false;
  }

  return true;
}

async function postActivity(dashboardUrl, payload) {
  try {
    await fetch(`${dashboardUrl}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // dashboard may not be running locally
  }
}

export async function checkEmails() {
  const token = await new Promise(res => chrome.identity.getAuthToken({ interactive: false }, res));
  if (!token) return;

  let threadsRes;
  try {
    threadsRes = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/threads?q=is:unread in:inbox&maxResults=10',
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    return;
  }

  if (!threadsRes.ok) return;

  const threadsData = await threadsRes.json();
  const threads = threadsData.threads || [];

  const { pendingDrafts = [] } = await chrome.storage.local.get('pendingDrafts');
  const settings = await chrome.storage.sync.get([
    'dashboardUrl', 'autoSend', 'trustedSenders', 'onlyKnownSenders', 'includeUCSC'
  ]);
  const dashboardUrl = settings.dashboardUrl || 'http://localhost:3000';
  const trustedSenders = settings.trustedSenders || [];

  const filterSettings = {
    onlyKnownSenders: settings.onlyKnownSenders !== false,
    includeUCSC: settings.includeUCSC !== false,
  };

  for (const threadMeta of threads) {
    if (pendingDrafts.some(d => d.threadId === threadMeta.id)) continue;

    let threadRes;
    try {
      threadRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/threads/${threadMeta.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      continue;
    }

    if (!threadRes.ok) continue;

    const threadData = await threadRes.json();
    const messages = threadData.messages || [];
    if (messages.length === 0) continue;

    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];

    const subject = extractHeader(firstMsg?.payload?.headers || [], 'Subject') || '(no subject)';
    const to = extractHeader(firstMsg?.payload?.headers || [], 'To') || '';
    const fromHeader = extractHeader(lastMsg?.payload?.headers || [], 'From') || '';
    const senderEmail = extractEmailAddress(fromHeader);

    const emailMeta = {
      labelIds: firstMsg.labelIds || [],
      from: fromHeader,
      subject,
    };

    const draft = await shouldDraftReply(emailMeta, trustedSenders, filterSettings);
    if (!draft) continue;

    const lastTwo = messages.slice(-2);
    const messagesText = lastTwo.map(msg => {
      const from = extractHeader(msg.payload?.headers || [], 'From') || '';
      const body = extractBody(msg.payload);
      return `From: ${from}\n${body.slice(0, 800)}`;
    }).join('\n\n---\n\n');

    const systemPrompt =
      'You are a helpful assistant for a college student at UCSC. Draft a short, friendly, natural reply to this email. The email is from a real person — a professor, classmate, friend, or colleague. Keep it under 80 words. Sound like a student, not a robot. Do not start with "I hope this email finds you well". Return ONLY the email body, nothing else.';
    const prompt = `Thread subject: ${subject}\n\nMessages:\n${messagesText}`;

    let draftText;
    try {
      const geminiRes = await fetch(`${dashboardUrl}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt }),
      });
      if (!geminiRes.ok) continue;
      const geminiData = await geminiRes.json();
      draftText = geminiData.text;
    } catch {
      continue;
    }

    if (!draftText) continue;

    const newDraft = {
      id: crypto.randomUUID(),
      threadId: threadMeta.id,
      subject,
      to,
      from: fromHeader,
      draft: draftText,
      autoSend: trustedSenders.map(s => s.toLowerCase()).includes(senderEmail),
      timestamp: Date.now(),
    };

    const { pendingDrafts: currentDrafts = [] } = await chrome.storage.local.get('pendingDrafts');
    await chrome.storage.local.set({ pendingDrafts: [...currentDrafts, newDraft] });

    await sendToActiveTab({
      type: 'SHOW_EMAIL_ALERT',
      draftId: newDraft.id,
      threadId: newDraft.threadId,
      from: fromHeader,
      fromEmail: senderEmail,
      subject,
      preview: draftText.substring(0, 120),
      draft: draftText,
      autoSend: newDraft.autoSend,
    });

    await logAction('email', 'Drafted reply to: ' + subject, 'pending');
    await postActivity(dashboardUrl, {
      type: 'email_drafted',
      subject,
      from: fromHeader,
      preview: draftText.substring(0, 100),
      extensionId: chrome.runtime.id,
    });
    await updateEmailBadge();
  }
}

export async function sendDraft(draftId) {
  const { pendingDrafts = [] } = await chrome.storage.local.get('pendingDrafts');
  const draft = pendingDrafts.find(d => d.id === draftId);
  if (!draft) return;

  const token = await new Promise(res => chrome.identity.getAuthToken({ interactive: false }, res));
  if (!token) return;

  const rawMessage = `To: ${draft.to}\r\nSubject: Re: ${draft.subject}\r\n\r\n${draft.draft}`;
  const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    if (!res.ok) return;
  } catch {
    return;
  }

  const updated = pendingDrafts.filter(d => d.id !== draftId);
  await chrome.storage.local.set({ pendingDrafts: updated });

  const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');
  await logAction('email', 'Sent reply to: ' + draft.subject, 'sent');
  await postActivity(dashboardUrl, {
    type: 'email_sent',
    subject: draft.subject,
    to: draft.to,
  });
  await updateEmailBadge();
}

async function updateEmailBadge() {
  const { pendingDrafts = [] } = await chrome.storage.local.get('pendingDrafts');
  const { focusMode } = await chrome.storage.session.get('focusMode');
  if (focusMode) return; // focus badge takes priority
  const count = pendingDrafts.length;
  if (count > 0) {
    chrome.action.setBadgeBackgroundColor({ color: '#7C3AED' });
    chrome.action.setBadgeText({ text: String(count) });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

function extractHeader(headers, name) {
  const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : null;
}

function extractEmailAddress(from) {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : from.toLowerCase().trim();
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
