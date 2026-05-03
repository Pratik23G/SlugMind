import { checkEmails, sendDraft } from './email-agent.js';
import { checkCalendar, checkUpcomingEvents } from './calendar-agent.js';
import { runRedundancyCheck, approveReminder } from './redundancy-agent.js';
import { startFocusTimer, stopFocusTimer, tickFocusTimer, addTask, updateTask } from './focus-agent.js';

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get([
    'dashboardUrl',
    'autoSend',
    'trustedSenders',
    'focusSuppressToasts',
    'timerPresets'
  ]);

  const defaults = {};
  if (existing.dashboardUrl === undefined) defaults.dashboardUrl = 'http://localhost:3000';
  if (existing.autoSend === undefined) defaults.autoSend = false;
  if (existing.trustedSenders === undefined) defaults.trustedSenders = [];
  if (existing.focusSuppressToasts === undefined) defaults.focusSuppressToasts = true;
  if (existing.timerPresets === undefined) defaults.timerPresets = [25, 45];

  if (Object.keys(defaults).length > 0) {
    await chrome.storage.sync.set(defaults);
  }

  chrome.alarms.create('emailPoll', { periodInMinutes: 1 });
  chrome.alarms.create('calendarPoll', { periodInMinutes: 5 });
  chrome.alarms.create('reminderCheck', { periodInMinutes: 1 });
  chrome.alarms.create('redundancyCheck', { periodInMinutes: 1440 });
  chrome.alarms.create('focusTick', { periodInMinutes: 1 });
  chrome.alarms.create('tokenRefresh', { periodInMinutes: 30 });
});

// Validate cached token is still alive; clear auth state if not
function refreshTokenCheck() {
  chrome.identity.getAuthToken({ interactive: false }, function (token) {
    if (chrome.runtime.lastError || !token) {
      chrome.storage.local.get('authToken', ({ authToken }) => {
        if (authToken) {
          chrome.identity.removeCachedAuthToken({ token: authToken }, () => {});
        }
      });
      chrome.storage.local.set({ isAuthenticated: false, authToken: null });
    }
  });
}

// Run a token check when the service worker wakes up
refreshTokenCheck();

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'tokenRefresh') {
    refreshTokenCheck();
    return;
  }

  if (alarm.name === 'emailPoll') {
    const { authToken } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      console.log('No auth token - skipping email poll');
      return;
    }
    await checkEmails();
  } else if (alarm.name === 'calendarPoll') {
    const { authToken } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      console.log('No auth token - skipping calendar poll');
      return;
    }
    await checkCalendar();
  } else if (alarm.name === 'reminderCheck') {
    const { authToken } = await chrome.storage.local.get('authToken');
    if (authToken) await checkUpcomingEvents();
  } else if (alarm.name === 'redundancyCheck') {
    await runRedundancyCheck();
  } else if (alarm.name === 'focusTick') {
    await tickFocusTimer();
  } else if (alarm.name.startsWith('reminder_')) {
    const reminderId = alarm.name.slice('reminder_'.length);
    const { suggestedReminders = [] } = await chrome.storage.local.get('suggestedReminders');
    const reminder = suggestedReminders.find(r => r.id === reminderId);
    if (reminder) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon-48.png',
        title: 'SlugMind Reminder',
        message: reminder.suggestedReminder
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true;
});

async function handleMessage(message, sendResponse) {
  switch (message.type) {
    case 'FOCUS_START': {
      await startFocusTimer(message.duration);
      sendResponse({ ok: true });
      break;
    }
    case 'FOCUS_STOP': {
      await stopFocusTimer();
      sendResponse({ ok: true });
      break;
    }
    case 'GET_STATUS': {
      const session = await chrome.storage.session.get(['focusMode']);
      const { pendingDrafts = [] } = await chrome.storage.local.get('pendingDrafts');
      const { pendingConflicts = [] } = await chrome.storage.local.get('pendingConflicts');
      sendResponse({
        focusMode: session.focusMode || false,
        emailDraftsPending: pendingDrafts.length,
        conflictsCount: pendingConflicts.length
      });
      break;
    }
    case 'ADD_TASK': {
      await addTask(message.task);
      sendResponse({ ok: true });
      break;
    }
    case 'UPDATE_TASK': {
      await updateTask(message.task);
      sendResponse({ ok: true });
      break;
    }
    case 'GET_TASKS': {
      const { tasks = [] } = await chrome.storage.local.get('tasks');
      sendResponse({ tasks });
      break;
    }
    case 'SEND_DRAFT': {
      await sendDraft(message.draftId);
      sendResponse({ ok: true });
      break;
    }
    case 'CLEAR_BADGE': {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ ok: true });
      break;
    }
    case 'DISMISS_DRAFT': {
      const { pendingDrafts = [] } = await chrome.storage.local.get('pendingDrafts');
      const updated = pendingDrafts.filter(d => d.id !== message.draftId);
      await chrome.storage.local.set({ pendingDrafts: updated });
      await updateBadgeCount();
      sendResponse({ ok: true });
      break;
    }
    case 'APPROVE_REMINDER': {
      await approveReminder(message.reminderId);
      sendResponse({ ok: true });
      break;
    }
    case 'GET_RESCHEDULE_OPTIONS': {
      const { pendingConflicts = [] } = await chrome.storage.local.get('pendingConflicts');
      const conflict = pendingConflicts.find(c => c.id === message.conflictId);
      sendResponse({ alternatives: conflict?.alternatives || [] });
      break;
    }
    case 'DRAFT_CONFLICT_EMAIL': {
      const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');
      const { eventA, eventB } = message;
      const systemPrompt = 'You are helping a college student write a professional email about a calendar conflict. Keep it under 60 words, friendly and direct. Return ONLY the email body.';
      const prompt = `I have a scheduling conflict between "${eventA?.title}" and "${eventB?.title}". Write a short email to the organizer of the second event explaining I may not be able to attend due to a prior commitment and asking if there is a way to reschedule or get notes.`;
      try {
        const res = await fetch(`${dashboardUrl}/api/gemini`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, systemPrompt }),
        });
        const data = res.ok ? await res.json() : {};
        sendResponse({ draft: data.text || '' });
      } catch {
        sendResponse({ draft: '' });
      }
      break;
    }
    case 'DRAFT_RESCHEDULE_EMAIL': {
      const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');
      const { eventTitle, oldTime, newTime } = message;
      const systemPrompt = 'You are helping a college student write a short email to reschedule a meeting. Under 60 words, friendly and professional. Return ONLY the email body.';
      const prompt = `Write a brief email asking to reschedule "${eventTitle}" from ${oldTime} to ${newTime}.`;
      try {
        const res = await fetch(`${dashboardUrl}/api/gemini`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, systemPrompt }),
        });
        const data = res.ok ? await res.json() : {};
        sendResponse({ draft: data.text || '' });
      } catch {
        sendResponse({ draft: '' });
      }
      break;
    }
    case 'SEND_PLAIN_EMAIL': {
      const token = await new Promise(res => chrome.identity.getAuthToken({ interactive: false }, res));
      if (!token) { sendResponse({ ok: false }); break; }
      const { to, subject, body } = message;
      const raw = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
      const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      try {
        const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: encoded }),
        });
        sendResponse({ ok: res.ok });
      } catch {
        sendResponse({ ok: false });
      }
      break;
    }
    case 'MARK_REMINDER_DISMISSED': {
      const { dismissedReminders = [] } = await chrome.storage.local.get('dismissedReminders');
      if (!dismissedReminders.includes(message.eventId)) {
        await chrome.storage.local.set({ dismissedReminders: [...dismissedReminders, message.eventId] });
      }
      sendResponse({ ok: true });
      break;
    }
    default:
      sendResponse({ error: 'Unknown message type' });
  }
}

async function updateBadgeCount() {
  const { pendingDrafts = [] } = await chrome.storage.local.get('pendingDrafts');
  const count = pendingDrafts.length;
  if (count > 0) {
    chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    chrome.action.setBadgeText({ text: String(count) });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-slugmind') {
    chrome.action.openPopup();
  }
});

export async function sendToActiveTab(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
  }
}

export async function logAction(type, description, outcome) {
  const { actionLog = [] } = await chrome.storage.local.get('actionLog');
  actionLog.push({
    id: crypto.randomUUID(),
    type,
    description,
    outcome,
    timestamp: Date.now()
  });
  const trimmed = actionLog.slice(-500);
  await chrome.storage.local.set({ actionLog: trimmed });
}
