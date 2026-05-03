import { logAction } from './service-worker.js';

export async function runRedundancyCheck() {
  const { actionLog = [] } = await chrome.storage.local.get('actionLog');

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentLog = actionLog.filter(entry => entry.timestamp > cutoff);

  if (recentLog.length < 10) return;

  const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');

  const prompt =
    "Here is a student's recent email and task history (JSON array). Identify repeating patterns (same action type, same time of day/week, same recipient). Return ONLY a JSON array of [{pattern: string, suggestedReminder: string, frequency: 'daily'|'weekly', dayOfWeek: 0-6 or null, hour: 0-23, count: number}]. If no patterns found, return [].\n\nHistory: " +
    JSON.stringify(recentLog);

  let patterns = [];
  try {
    const res = await fetch(`${dashboardUrl}/api/ollama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) return;
    const data = await res.json();
    const raw = data.text || '[]';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      patterns = JSON.parse(jsonMatch[0]);
    }
  } catch {
    return;
  }

  const qualified = patterns.filter(p => p.count >= 3);
  if (qualified.length === 0) return;

  const { suggestedReminders = [] } = await chrome.storage.local.get('suggestedReminders');

  const newReminders = qualified.map(p => ({
    id: crypto.randomUUID(),
    pattern: p.pattern,
    suggestedReminder: p.suggestedReminder,
    frequency: p.frequency,
    dayOfWeek: p.dayOfWeek ?? null,
    hour: p.hour,
    count: p.count,
    approved: false,
    timestamp: Date.now()
  }));

  const updatedReminders = [...suggestedReminders, ...newReminders];
  await chrome.storage.local.set({ suggestedReminders: updatedReminders });

  for (const reminder of newReminders) {
    try {
      chrome.runtime.sendMessage({ type: 'NEW_REMINDER_SUGGESTION', reminder });
    } catch {
      // popup may not be open
    }
  }
}

export async function approveReminder(reminderId) {
  const { suggestedReminders = [] } = await chrome.storage.local.get('suggestedReminders');
  const reminder = suggestedReminders.find(r => r.id === reminderId);
  if (!reminder) return;

  reminder.approved = true;
  await chrome.storage.local.set({ suggestedReminders });

  const periodInMinutes = reminder.frequency === 'weekly' ? 10080 : 1440;
  chrome.alarms.create(`reminder_${reminderId}`, { periodInMinutes });

  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon-48.png',
    title: 'SlugMind Reminder Approved',
    message: reminder.suggestedReminder
  });

  await logAction('reminder', 'Approved reminder: ' + reminder.suggestedReminder, 'active');
}
