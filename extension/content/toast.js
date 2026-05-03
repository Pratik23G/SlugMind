(function () {
  const style = document.createElement("style");
  style.textContent = `
    .slugmind-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .slugmind-toast-item {
      background: #1a1a2e;
      color: white;
      border-radius: 12px;
      padding: 14px 18px;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slugmindSlideInRight 0.3s ease;
    }
    .slugmind-toast-item.red {
      border-left: 4px solid #ef4444;
    }
    .slugmind-toast-item.yellow {
      border-left: 4px solid #f59e0b;
    }
    .slugmind-toast-item.green {
      border-left: 4px solid #22c55e;
    }
    .slugmind-toast-icon {
      font-size: 20px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    .slugmind-toast-icon i {
      font-size: 20px;
    }
    .slugmind-toast-body {
      flex: 1;
    }
    .slugmind-toast-title {
      font-weight: 600;
      margin-bottom: 2px;
    }
    .slugmind-toast-msg {
      opacity: 0.8;
      font-size: 13px;
    }
    .slugmind-toast-close {
      cursor: pointer;
      opacity: 0.5;
      font-size: 18px;
      line-height: 1;
      background: none;
      border: none;
      color: white;
      padding: 0;
    }
    .slugmind-toast-close:hover {
      opacity: 1;
    }
    @keyframes slugmindSlideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  if (!document.getElementById("slugmind-phosphor-css")) {
    const link = document.createElement("link");
    link.id = "slugmind-phosphor-css";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("icons/phosphor/style.css");
    document.head.appendChild(link);
  }

  const container = document.createElement("div");
  container.id = "slugmind-toast-container";
  container.className = "slugmind-toast";
  document.body.appendChild(container);

  const iconMap = {
    red:    '<i class="ph ph-warning" style="color:#ef4444"></i>',
    yellow: '<i class="ph ph-warning-circle" style="color:#f59e0b"></i>',
    green:  '<i class="ph ph-check-circle" style="color:#22c55e"></i>',
  };

  function showToast(type, title, message, duration) {
    if (duration === undefined) duration = 8000;

    const item = document.createElement("div");
    item.className = "slugmind-toast-item " + (type || "green");

    const icon = document.createElement("span");
    icon.className = "slugmind-toast-icon";
    icon.innerHTML = iconMap[type] || iconMap.green;

    const body = document.createElement("div");
    body.className = "slugmind-toast-body";

    const titleEl = document.createElement("div");
    titleEl.className = "slugmind-toast-title";
    titleEl.textContent = title;

    const msgEl = document.createElement("div");
    msgEl.className = "slugmind-toast-msg";
    msgEl.textContent = message;

    body.appendChild(titleEl);
    body.appendChild(msgEl);

    const closeBtn = document.createElement("button");
    closeBtn.className = "slugmind-toast-close";
    closeBtn.innerHTML = '<i class="ph ph-x"></i>';
    closeBtn.addEventListener("click", function () {
      hideToast(item);
    });

    item.appendChild(icon);
    item.appendChild(body);
    item.appendChild(closeBtn);
    container.appendChild(item);

    if (duration > 0) {
      setTimeout(function () {
        hideToast(item);
      }, duration);
    }

    return item;
  }

  function hideToast(el) {
    if (!el || !el.parentNode) return;
    el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    el.style.opacity = "0";
    el.style.transform = "translateX(120%)";
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }

  window.SlugMindToast = { showToast: showToast, hideToast: hideToast };

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === "SHOW_TOAST") {
      chrome.storage.session.get("focusMode", function (data) {
        if (data.focusMode) return;
        showToast(msg.toastType, msg.title, msg.message);
      });
    }

    if (msg.type === "NEW_CONFLICT") {
      const conflict = msg.conflict;
      const toastType = conflict.type === "hard" ? "red" : "yellow";
      const title = conflict.type === "hard" ? "Calendar Conflict" : "Near Conflict";
      const alts = (conflict.alternatives || []).slice(0, 2).map(function (a) { return a.label; }).join(", ");
      const message = conflict.eventA.title + " overlaps " + conflict.eventB.title + (alts ? "\nAlternatives: " + alts : "");
      showToast(toastType, title, message);
    }
  });
})();
