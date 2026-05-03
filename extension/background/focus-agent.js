import { logAction } from './service-worker.js';

export async function startFocusTimer(durationMinutes) {
  const now = Date.now();
  await chrome.storage.session.set({
    focusMode: true,
    focusStart: now,
    focusEnd: now + durationMinutes * 60 * 1000,
    actionsCount: 0
  });

  chrome.action.setBadgeBackgroundColor({ color: '#7C3AED' });
  chrome.action.setBadgeText({ text: durationMinutes + 'm' });

  await logAction('focus', 'Started ' + durationMinutes + 'min focus session', 'active');

  const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');
  try {
    await fetch(`${dashboardUrl}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'focus_started', duration: durationMinutes, timestamp: Date.now() }),
    });
  } catch { /* dashboard may not be running */ }
}

export async function stopFocusTimer() {
  const session = await chrome.storage.session.get(['focusMode', 'actionsCount', 'focusStart']);

  const focusStart = session.focusStart || Date.now();
  const actionsCount = session.actionsCount || 0;

  await chrome.storage.session.set({ focusMode: false });
  chrome.action.setBadgeText({ text: '' });

  const duration = Math.round((Date.now() - focusStart) / 60000);

  try {
    chrome.runtime.sendMessage({
      type: 'FOCUS_ENDED',
      summary: { duration, actionsCount }
    });
  } catch {
    // popup may not be open
  }

  await logAction('focus', 'Ended focus session', 'completed');

  const { dashboardUrl = 'http://localhost:3000' } = await chrome.storage.sync.get('dashboardUrl');
  try {
    await fetch(`${dashboardUrl}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'focus_ended', duration, actionsCount, timestamp: Date.now() }),
    });
  } catch { /* dashboard may not be running */ }

  await advanceStaleTasks(focusStart);
}

export async function tickFocusTimer() {
  const session = await chrome.storage.session.get(['focusMode', 'focusEnd']);
  if (!session.focusMode) return;

  const remaining = session.focusEnd - Date.now();
  if (remaining <= 0) {
    await stopFocusTimer();
    return;
  }

  const mins = Math.ceil(remaining / 60000);
  chrome.action.setBadgeText({ text: mins + 'm' });
}

export async function addTask(task) {
  const { tasks = [] } = await chrome.storage.local.get('tasks');
  tasks.push({
    id: crypto.randomUUID(),
    title: task.title,
    bucket: task.bucket || 'today',
    createdAt: Date.now(),
    completedAt: null,
    missedSessions: 0,
    dueDate: task.dueDate || null
  });
  await chrome.storage.local.set({ tasks });
}

export async function updateTask(task) {
  const { tasks = [] } = await chrome.storage.local.get('tasks');
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx === -1) return;

  const existing = tasks[idx];
  const wasIncomplete = existing.completedAt === null;
  const nowComplete = task.completedAt != null;

  tasks[idx] = { ...existing, ...task };
  await chrome.storage.local.set({ tasks });

  if (wasIncomplete && nowComplete) {
    await logAction('task', 'Completed: ' + tasks[idx].title, 'done');
  }
}

async function advanceStaleTasks(focusStart) {
  const { tasks = [] } = await chrome.storage.local.get('tasks');
  let changed = false;

  const updated = tasks.map(task => {
    if (
      task.bucket === 'today' &&
      task.completedAt === null &&
      task.missedSessions >= 2
    ) {
      changed = true;
      return { ...task, bucket: 'needs_attention' };
    }

    if (task.bucket === 'today' && task.completedAt === null) {
      return { ...task, missedSessions: (task.missedSessions || 0) + 1 };
    }

    return task;
  });

  if (changed || updated.some((t, i) => t.missedSessions !== tasks[i].missedSessions)) {
    await chrome.storage.local.set({ tasks: updated });
  }
}
