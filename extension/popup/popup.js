document.addEventListener("DOMContentLoaded", function () {
  let selectedMinutes = 25;
  let focusCountdownInterval = null;
  let currentTasks = [];

  const statusDot = document.getElementById("statusDot");
  const focusBanner = document.getElementById("focusBanner");
  const focusCountdownEl = document.getElementById("focusCountdown");
  const stopFocusBtn = document.getElementById("stopFocusBtn");
  const startFocusBtn = document.getElementById("startFocusBtn");
  const customInput = document.getElementById("customInput");
  const customMinutesInput = document.getElementById("customMinutes");
  const taskInput = document.getElementById("taskInput");
  const taskBucketSelect = document.getElementById("taskBucket");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const recentActionsEl = document.getElementById("recentActions");
  const openDashboardBtn = document.getElementById("openDashboardBtn");
  const authBtn = document.getElementById("authBtn");
  const presetBtns = document.querySelectorAll(".preset-btn");
  const onlyKnownCheck = document.getElementById("onlyKnownSenders");
  const includeUCSCCheck = document.getElementById("includeUCSC");

  function setActivePreset(btn) {
    presetBtns.forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
  }

  presetBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectedMinutes = parseInt(btn.dataset.minutes, 10);
      setActivePreset(btn);
      if (selectedMinutes === 0) {
        customInput.classList.remove("hidden");
      } else {
        customInput.classList.add("hidden");
      }
    });
  });

  setActivePreset(presetBtns[0]);

  startFocusBtn.addEventListener("click", function () {
    let minutes = selectedMinutes;
    if (minutes === 0) {
      minutes = parseInt(customMinutesInput.value, 10) || 25;
    }
    chrome.runtime.sendMessage({ type: "FOCUS_START", duration: minutes });
  });

  stopFocusBtn.addEventListener("click", function () {
    chrome.runtime.sendMessage({ type: "FOCUS_STOP" });
  });

  function relativeTime(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    return hrs + "h ago";
  }

  function actionEmoji(type) {
    if (!type) return "⚡";
    const t = type.toLowerCase();
    if (t.includes("email") || t.includes("draft") || t.includes("send")) return "📧";
    if (t.includes("calendar") || t.includes("event") || t.includes("conflict")) return "📅";
    if (t.includes("focus") || t.includes("timer")) return "⏱";
    if (t.includes("task")) return "✅";
    return "⚡";
  }

  function renderRecent(log) {
    const items = (log || []).slice().reverse().slice(0, 5);
    const remindersEls = recentActionsEl.querySelectorAll(".reminder-item");
    recentActionsEl.innerHTML = "";
    remindersEls.forEach(function (el) { recentActionsEl.appendChild(el); });

    items.forEach(function (entry) {
      const item = document.createElement("div");
      item.className = "recent-item";

      const timeSpan = document.createElement("span");
      timeSpan.className = "time";
      timeSpan.textContent = relativeTime(entry.timestamp || Date.now());

      item.appendChild(timeSpan);
      item.appendChild(document.createTextNode(actionEmoji(entry.type) + " " + (entry.description || entry.type || "")));
      recentActionsEl.prepend(item);
    });
  }

  function renderReminders(reminders) {
    const existing = recentActionsEl.querySelectorAll(".reminder-item");
    existing.forEach(function (el) { el.remove(); });

    (reminders || []).filter(function (r) { return !r.approved; }).forEach(function (reminder) {
      const item = document.createElement("div");
      item.className = "reminder-item";

      const text = document.createElement("span");
      text.className = "reminder-text";
      text.textContent = "💡 " + reminder.suggestedReminder;

      const approveBtn = document.createElement("button");
      approveBtn.className = "btn-approve";
      approveBtn.textContent = "Approve";
      approveBtn.addEventListener("click", function () {
        chrome.runtime.sendMessage({ type: "APPROVE_REMINDER", reminderId: reminder.id });
        item.remove();
      });

      item.appendChild(text);
      item.appendChild(approveBtn);
      recentActionsEl.appendChild(item);
    });
  }

  function renderTasks(tasks) {
    currentTasks = tasks || [];
    const buckets = ["today", "needs_attention", "tomorrow"];

    buckets.forEach(function (bucket) {
      const container = document.getElementById("items-" + bucket);
      container.innerHTML = "";
    });

    const grouped = { today: [], needs_attention: [], tomorrow: [] };
    currentTasks.forEach(function (task) {
      const b = task.bucket || "today";
      if (grouped[b]) grouped[b].push(task);
    });

    buckets.forEach(function (bucket) {
      const container = document.getElementById("items-" + bucket);
      const countEl = document.getElementById("count-" + bucket);
      const list = grouped[bucket] || [];
      countEl.textContent = list.length;

      list.forEach(function (task) {
        const item = document.createElement("div");
        item.className = "task-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!task.completedAt;

        const label = document.createElement("span");
        label.className = "task-title" + (task.completedAt ? " completed" : "");
        label.textContent = task.title;

        const pushBtn = document.createElement("button");
        pushBtn.className = "task-push";
        pushBtn.textContent = "→ tmrw";

        checkbox.addEventListener("change", function () {
          chrome.runtime.sendMessage({
            type: "UPDATE_TASK",
            task: { id: task.id, completedAt: checkbox.checked ? Date.now() : null }
          }, function () {
            chrome.storage.local.get("tasks", function (data) {
              renderTasks(data.tasks || []);
            });
          });
        });

        pushBtn.addEventListener("click", function () {
          chrome.runtime.sendMessage({
            type: "UPDATE_TASK",
            task: { id: task.id, bucket: "tomorrow" }
          }, function () {
            chrome.storage.local.get("tasks", function (data) {
              renderTasks(data.tasks || []);
            });
          });
        });

        item.appendChild(checkbox);
        item.appendChild(label);
        item.appendChild(pushBtn);
        container.appendChild(item);
      });
    });
  }

  function addTask() {
    const title = taskInput.value.trim();
    if (!title) return;
    const bucket = taskBucketSelect.value;
    chrome.runtime.sendMessage({ type: "ADD_TASK", task: { title: title, bucket: bucket } }, function () {
      chrome.storage.local.get("tasks", function (data) {
        renderTasks(data.tasks || []);
      });
    });
    taskInput.value = "";
  }

  addTaskBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTask();
  });

  function startFocusCountdownPoll(endsAt) {
    if (focusCountdownInterval) clearInterval(focusCountdownInterval);
    focusCountdownInterval = setInterval(function () {
      chrome.storage.session.get(["focusMode", "focusEndsAt"], function (data) {
        if (!data.focusMode) {
          clearInterval(focusCountdownInterval);
          focusCountdownInterval = null;
          focusBanner.classList.add("hidden");
          document.body.classList.remove("focus-active");
          statusDot.className = "status-dot green";
          return;
        }
        const end = data.focusEndsAt || endsAt;
        if (end) {
          const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;
          focusCountdownEl.textContent = "Focus mode — " + mins + ":" + (secs < 10 ? "0" : "") + secs + " left";
        } else {
          focusCountdownEl.textContent = "Focus mode active";
        }
      });
    }, 1000);
  }

  function loadFilterSettings() {
    chrome.storage.sync.get(["onlyKnownSenders", "includeUCSC"], function (s) {
      onlyKnownCheck.checked = s.onlyKnownSenders !== false;
      includeUCSCCheck.checked = s.includeUCSC !== false;
    });
  }

  onlyKnownCheck.addEventListener("change", function () {
    chrome.storage.sync.set({ onlyKnownSenders: onlyKnownCheck.checked });
  });

  includeUCSCCheck.addEventListener("change", function () {
    chrome.storage.sync.set({ includeUCSC: includeUCSCCheck.checked });
  });

  function loadState() {
    chrome.storage.local.get(["authToken", "isAuthenticated"], function (result) {
      if (result.isAuthenticated && result.authToken) {
        updateAuthUI(true);
      } else {
        updateAuthUI(false);
      }
    });

    chrome.runtime.sendMessage({ type: "GET_STATUS" }, function (status) {
      if (!status) return;
      if (status.focusMode) {
        statusDot.className = "status-dot purple";
        focusBanner.classList.remove("hidden");
        document.body.classList.add("focus-active");
        startFocusCountdownPoll();
      } else if (status.conflictsCount > 0) {
        statusDot.className = "status-dot red";
      } else if (status.pendingDraftsCount > 0) {
        statusDot.className = "status-dot yellow";
      } else {
        statusDot.className = "status-dot green";
      }
    });

    chrome.storage.local.get(["pendingDrafts", "pendingConflicts", "tasks", "actionLog", "suggestedReminders"], function (data) {
      renderTasks(data.tasks || []);
      renderRecent(data.actionLog || []);
      renderReminders(data.suggestedReminders || []);
    });
  }

  openDashboardBtn.addEventListener("click", function () {
    chrome.storage.sync.get("dashboardUrl", function (data) {
      chrome.tabs.create({ url: data.dashboardUrl || "http://localhost:3000" });
    });
  });

  function updateAuthUI(success, errorMsg) {
    const errEl = document.getElementById("auth-error");
    if (success) {
      authBtn.innerHTML = '<i class="ph ph-check-circle"></i> Connected';
      authBtn.style.color = "#22c55e";
      if (errEl) errEl.remove();
    } else {
      authBtn.innerHTML = '<i class="ph ph-gear"></i> Connect Google';
      authBtn.style.color = "";
      if (errorMsg) {
        let el = errEl;
        if (!el) {
          el = document.createElement("div");
          el.id = "auth-error";
          el.style.cssText = "color:#ef4444;font-size:11px;padding:2px 16px 6px;word-break:break-all;line-height:1.4;";
          authBtn.parentNode.insertBefore(el, authBtn.nextSibling);
        }
        el.textContent = errorMsg;
      }
    }
  }

  authBtn.addEventListener("click", function () {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        console.error("Auth error:", chrome.runtime.lastError.message);
        updateAuthUI(false, chrome.runtime.lastError.message);
        return;
      }
      chrome.storage.local.set({
        authToken: token,
        isAuthenticated: true,
        authTimestamp: Date.now()
      });
      updateAuthUI(true);
    });
  });

  function showSessionModal(summary) {
    const existing = document.getElementById("slugmind-session-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "slugmind-session-overlay";
    overlay.className = "session-overlay";

    const modal = document.createElement("div");
    modal.className = "session-modal";

    const heading = document.createElement("h2");
    heading.textContent = "Session complete!";

    const desc = document.createElement("p");
    desc.textContent = (summary.duration || 0) + " min. " + (summary.actionsCount || 0) + " actions taken.";

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn-primary";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", function () {
      overlay.remove();
    });

    modal.appendChild(heading);
    modal.appendChild(desc);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === "FOCUS_ENDED") {
      if (focusCountdownInterval) clearInterval(focusCountdownInterval);
      focusCountdownInterval = null;
      focusBanner.classList.add("hidden");
      document.body.classList.remove("focus-active");
      statusDot.className = "status-dot green";
      showSessionModal(msg.summary || {});
      loadState();
    }
  });

  // Clear notification badge when popup opens (focus badge takes priority)
  chrome.storage.session.get("focusMode", function (data) {
    if (!data.focusMode) {
      chrome.action.setBadgeText({ text: "" });
    }
  });

  loadState();
  loadFilterSettings();

  function sendToActiveTab(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, msg);
    });
  }

  document.getElementById("testEmailBtn").addEventListener("click", function () {
    sendToActiveTab({
      type: "SHOW_EMAIL_ALERT",
      emailId: "demo-001",
      messageId: "<demo-001@ucsc.edu>",
      threadId: "demo-thread-001",
      from: "Professor Smith <smith@ucsc.edu>",
      subject: "RE: Office Hours Tomorrow",
      preview: "Hi! Yes, office hours are confirmed for 3pm in E2 room 506. See you then!",
      draft: "Hi Professor Smith,\n\nThank you for confirming! I'll see you at 3pm tomorrow in E2-506.\n\nBest,\nPratik",
      to: "Professor Smith <smith@ucsc.edu>"
    });
  });

  document.getElementById("testConflictBtn").addEventListener("click", function () {
    sendToActiveTab({
      type: "SHOW_CONFLICT_ALERT",
      conflictId: "demo-conflict-001",
      conflictType: "hard",
      event1: {
        id: "evt1", title: "CS101 Discussion Section",
        start: new Date(Date.now() + 3600000).toISOString(),
        end:   new Date(Date.now() + 7200000).toISOString()
      },
      event2: {
        id: "evt2", title: "Study Group with Maria",
        start: new Date(Date.now() + 5400000).toISOString(),
        end:   new Date(Date.now() + 9000000).toISOString()
      },
      alternatives: [
        { label: "Today 6:00 PM", date: new Date().toISOString().slice(0,10), time: "18:00" },
        { label: "Tomorrow 10:00 AM", date: new Date(Date.now()+86400000).toISOString().slice(0,10), time: "10:00" },
        { label: "Tomorrow 4:00 PM", date: new Date(Date.now()+86400000).toISOString().slice(0,10), time: "16:00" }
      ],
      attendees: ["maria@ucsc.edu"]
    });
  });

  document.getElementById("testReminderBtn").addEventListener("click", function () {
    sendToActiveTab({
      type: "SHOW_REMINDER",
      event: {
        id: "evt-reminder-001",
        title: "CS146 Lecture",
        summary: "CS146 Lecture",
        start: new Date(Date.now() + 900000).toISOString(),
        meetLink: "https://meet.google.com/abc-defg-hij"
      }
    });
  });
});
