async function sendToActiveTab(msg) {
  const allTabs = await chrome.tabs.query({});
  const validTabs = allTabs.filter(t =>
    t.url &&
    !t.url.startsWith('chrome://') &&
    !t.url.startsWith('chrome-extension://') &&
    !t.url.startsWith('about:') &&
    !t.url.startsWith('edge://')
  );
  validTabs.sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
  for (const tab of validTabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, msg);
      console.log('[SlugMind] calendar alert sent to tab:', tab.id);
      return;
    } catch { /* content script not on this tab, try next */ }
  }
}

function extractMeetLink(rawEvent) {
  const text = [rawEvent.hangoutLink, rawEvent.description, rawEvent.location]
    .filter(Boolean).join(' ');
  const match = text.match(/https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
  return match ? match[0] : rawEvent.hangoutLink || null;
}

export async function checkUpcomingEvents() {
  const token = await new Promise(res => chrome.identity.getAuthToken({ interactive: false }, res));
  if (!token) return;

  const now = new Date();
  const soon = new Date(now.getTime() + 20 * 60 * 1000);

  let res;
  try {
    res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${soon.toISOString()}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch { return; }
  if (!res.ok) return;

  const data = await res.json();
  const { remindedEvents = [], dismissedReminders = [] } = await chrome.storage.local.get(['remindedEvents', 'dismissedReminders']);

  for (const rawEvent of data.items || []) {
    if (!rawEvent.start?.dateTime) continue;
    const eventId = rawEvent.id;
    if (remindedEvents.includes(eventId) || dismissedReminders.includes(eventId)) continue;

    const startMs = new Date(rawEvent.start.dateTime).getTime();
    const minsUntil = Math.round((startMs - now.getTime()) / 60000);
    if (minsUntil < 12 || minsUntil > 18) continue;

    const meetLink = extractMeetLink(rawEvent);
    await sendToActiveTab({
      type: 'SHOW_REMINDER',
      eventId,
      title: rawEvent.summary || '(untitled)',
      minsUntil,
      meetLink,
    });

    await chrome.storage.local.set({ remindedEvents: [...remindedEvents, eventId] });
  }
}

export async function checkCalendarConflicts() {
  console.log('[SlugMind] checking calendar...');
  const token = await new Promise(res => chrome.identity.getAuthToken({ interactive: false }, res));
  if (!token) return;
  console.log('[SlugMind] calendar auth token ok');

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let eventsRes;
  try {
    eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${sevenDays.toISOString()}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    return;
  }

  if (!eventsRes.ok) return;

  const eventsData = await eventsRes.json();
  const rawEvents = eventsData.items || [];
  console.log('[SlugMind] calendar events:', rawEvents.length);

  const events = rawEvents
    .filter(e => e.start && (e.start.dateTime || e.start.date))
    .map(e => ({
      id: e.id,
      title: e.summary || '(untitled)',
      start: new Date(e.start.dateTime || e.start.date),
      end: new Date(e.end.dateTime || e.end.date)
    }));

  const hardConflicts = [];
  const nearConflicts = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      if (a.start < b.end && b.start < a.end) {
        hardConflicts.push({ eventA: a, eventB: b, type: 'hard' });
      } else {
        const earlier = a.end <= b.start ? a : b;
        const later = a.end <= b.start ? b : a;
        const gap = later.start.getTime() - earlier.end.getTime();
        if (gap >= 0 && gap < 15 * 60 * 1000) {
          nearConflicts.push({ eventA: earlier, eventB: later, type: 'near' });
        }
      }
    }
  }

  const allConflicts = [...hardConflicts, ...nearConflicts];

  const { knownConflicts = [] } = await chrome.storage.local.get('knownConflicts');
  const { pendingConflicts = [] } = await chrome.storage.local.get('pendingConflicts');
  const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');

  const newConflictIds = [];

  for (const conflict of allConflicts) {
    const conflictKey = `${conflict.eventA.id}_${conflict.eventB.id}_${conflict.type}`;
    if (knownConflicts.includes(conflictKey)) continue;

    const prompt =
      `A student has two ${conflict.type === 'hard' ? 'overlapping' : 'back-to-back (less than 15 min gap)'} calendar events:\n` +
      `Event 1: "${conflict.eventA.title}" from ${conflict.eventA.start.toISOString()} to ${conflict.eventA.end.toISOString()}\n` +
      `Event 2: "${conflict.eventB.title}" from ${conflict.eventB.start.toISOString()} to ${conflict.eventB.end.toISOString()}\n` +
      `Suggest 3 alternative times for the second event that don't conflict.`;

    const systemPrompt =
      "A student has two overlapping calendar events. Suggest 3 alternative times for the second event that don't conflict. Return ONLY a JSON array of [{date: 'YYYY-MM-DD', time: 'HH:MM', label: 'friendly label'}]. Nothing else.";

    let alternatives = [];
    try {
      const geminiRes = await fetch(`${dashboardUrl}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt })
      });
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const raw = geminiData.text || '[]';
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          alternatives = JSON.parse(jsonMatch[0]);
        }
      }
    } catch {
      alternatives = [];
    }

    const newConflict = {
      id: crypto.randomUUID(),
      eventA: conflict.eventA,
      eventB: conflict.eventB,
      alternatives,
      type: conflict.type,
      timestamp: Date.now()
    };

    console.log('[SlugMind] CONFLICT FOUND:', conflict.eventA.title, 'vs', conflict.eventB.title);
    pendingConflicts.push(newConflict);
    newConflictIds.push(conflictKey);

    await sendToActiveTab({
      type: 'SHOW_CONFLICT_ALERT',
      conflictId: newConflict.id,
      eventA: { id: conflict.eventA.id, title: conflict.eventA.title, start: conflict.eventA.start.toISOString(), end: conflict.eventA.end.toISOString() },
      eventB: { id: conflict.eventB.id, title: conflict.eventB.title, start: conflict.eventB.start.toISOString(), end: conflict.eventB.end.toISOString() },
      conflictType: conflict.type,
      alternatives,
    });

    try {
      await fetch(`${dashboardUrl}/api/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'conflict_detected',
          event1: conflict.eventA.title,
          event2: conflict.eventB.title,
          conflictType: conflict.type,
          timestamp: Date.now(),
        }),
      });
    } catch { /* dashboard may not be running */ }
  }

  if (newConflictIds.length > 0) {
    await chrome.storage.local.set({
      pendingConflicts,
      knownConflicts: [...knownConflicts, ...newConflictIds]
    });
  }

  const hasHard = pendingConflicts.some(c => c.type === 'hard');
  const hasNear = pendingConflicts.some(c => c.type === 'near');

  if (hasHard) {
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    chrome.action.setBadgeText({ text: '!' });
  } else if (hasNear) {
    chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    chrome.action.setBadgeText({ text: '~' });
  }
}
