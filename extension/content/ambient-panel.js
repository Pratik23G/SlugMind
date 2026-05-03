(function () {
  'use strict';
  if (window.__slugmindLoaded) return;
  window.__slugmindLoaded = true;

  // ── Fonts + Phosphor ────────────────────────────────────────────────────────
  function injectAssets() {
    if (!document.getElementById('slugmind-inter')) {
      const link = document.createElement('link');
      link.id = 'slugmind-inter';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('slugmind-ph-css')) {
      const link = document.createElement('link');
      link.id = 'slugmind-ph-css';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('icons/phosphor/style.css');
      document.head.appendChild(link);
    }
    if (!document.getElementById('slugmind-css')) {
      const s = document.createElement('style');
      s.id = 'slugmind-css';
      s.textContent = `
        #slugmind-ambient * { box-sizing: border-box; }
        .sm-panel {
          pointer-events: all;
          width: 320px;
          background: #0f1117;
          border-left: 3px solid #7c3aed;
          border-radius: 12px 0 0 12px;
          padding: 16px;
          box-shadow: -4px 0 32px rgba(0,0,0,0.55);
          color: #f1f5f9;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          will-change: transform, opacity;
        }
        .sm-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 11px;
        }
        .sm-panel-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
          font-size: 13px;
          color: #e2e8f0;
          letter-spacing: -0.1px;
        }
        .sm-close {
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 0;
          font-size: 16px;
          line-height: 1;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .sm-close:hover { color: #94a3b8; }
        .sm-divider {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          margin: 5px 0;
        }
        .sm-event-block {
          background: #1e293b;
          border-radius: 8px;
          padding: 9px 11px;
          margin-bottom: 5px;
        }
        .sm-event-name { font-weight: 600; font-size: 13px; color: #e2e8f0; }
        .sm-event-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .sm-draft-box {
          background: #1e293b;
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          color: #cbd5e1;
          line-height: 1.6;
          max-height: 90px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .sm-draft-area {
          width: 100%;
          background: #1e293b;
          border: 1.5px solid #6366f1;
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          color: #e2e8f0;
          line-height: 1.6;
          resize: vertical;
          min-height: 72px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .sm-section-label {
          font-size: 11px;
          font-weight: 600;
          color: #7c3aed;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 10px 0 6px;
        }
        .sm-actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .sm-btn {
          padding: 7px 13px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', system-ui, sans-serif;
          transition: opacity 0.15s, background 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: none;
          white-space: nowrap;
        }
        .sm-btn:hover { opacity: 0.82; }
        .sm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .sm-btn-primary { background: #6366f1; color: #fff; }
        .sm-btn-success { background: #059669; color: #fff; }
        .sm-btn-muted   { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
        .sm-btn-ghost   { background: transparent; color: #64748b; border: 1px solid #2d3748; }
        .sm-check-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          cursor: pointer;
          font-size: 11px;
          color: #64748b;
          user-select: none;
        }
        .sm-check-row input { accent-color: #6366f1; }
        .sm-alt-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          background: #1e293b;
          border-radius: 8px;
          margin-bottom: 4px;
          cursor: pointer;
          font-size: 12px;
          color: #e2e8f0;
          border: 1.5px solid transparent;
          transition: border-color 0.15s;
        }
        .sm-alt-option:has(input:checked) { border-color: #7c3aed; }
        .sm-alt-option input { accent-color: #7c3aed; }
        .sm-overflow {
          pointer-events: all;
          align-self: flex-end;
          background: #7c3aed;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 999px 0 0 999px;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
          border: none;
          margin-right: 0;
          transition: background 0.15s;
        }
        .sm-overflow:hover { background: #6d28d9; }
      `;
      document.head.appendChild(s);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    const dayPart = isToday ? 'Today' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dayPart} · ${timePart}`;
  }

  function ph(icon, size) {
    return `<i class="ph ${icon}" style="font-size:${size || 15}px"></i>`;
  }

  // ── AmbientPanel ────────────────────────────────────────────────────────────
  class AmbientPanel {
    constructor() {
      this.active = [];
      this.queue = [];
      this.MAX = 3;
      injectAssets();
      this._buildContainer();
    }

    _buildContainer() {
      const c = document.createElement('div');
      c.id = 'slugmind-ambient';
      Object.assign(c.style, {
        position: 'fixed', right: '0', top: '0',
        height: '100vh', zIndex: '2147483647',
        pointerEvents: 'none',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: '10px',
        padding: '20px 0',
      });
      document.body.appendChild(c);
      this.container = c;
    }

    show(cfg) {
      if (this.active.length >= this.MAX) {
        this.queue.push(cfg);
        this._refreshOverflow();
        return;
      }
      this._mount(cfg);
    }

    _mount(cfg) {
      const panel = this._build(cfg);
      this.active.push(panel);
      this.container.appendChild(panel);
      panel.style.transform = 'translateX(104%)';
      panel.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        panel.style.transition = 'transform 0.38s cubic-bezier(.16,1,.3,1), opacity 0.3s ease';
        panel.style.transform = 'translateX(0)';
        panel.style.opacity = '1';
      }));
    }

    dismiss(panel) {
      panel.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
      panel.style.transform = 'translateX(110%)';
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.remove();
        this.active = this.active.filter(p => p !== panel);
        if (this.queue.length > 0) this._mount(this.queue.shift());
        this._refreshOverflow();
        if (this.active.length === 0 && this.queue.length === 0) {
          try { chrome.runtime.sendMessage({ type: 'CLEAR_BADGE' }); } catch {}
        }
      }, 220);
    }

    _refreshOverflow() {
      let b = this.container.querySelector('.sm-overflow');
      if (this.queue.length === 0) { if (b) b.remove(); return; }
      if (!b) {
        b = document.createElement('button');
        b.className = 'sm-overflow';
        b.onclick = () => {
          if (this.queue.length && this.active.length < this.MAX) {
            this._mount(this.queue.shift());
            this._refreshOverflow();
          }
        };
        this.container.appendChild(b);
      }
      b.textContent = `+${this.queue.length} more`;
    }

    _build(cfg) {
      switch (cfg.type) {
        case 'email':    return this._email(cfg);
        case 'conflict': return this._conflict(cfg);
        case 'reminder': return this._reminder(cfg);
        default:         return this._generic(cfg);
      }
    }

    _shell(color) {
      const p = document.createElement('div');
      p.className = 'sm-panel';
      p.style.borderLeftColor = color || '#7c3aed';
      return p;
    }

    _header(icon, title, color, panel) {
      const row = document.createElement('div');
      row.className = 'sm-panel-header';
      const left = document.createElement('div');
      left.className = 'sm-panel-title';
      left.innerHTML = `${ph(icon, 16)} <span>${title}</span>`;
      left.style.color = color || '#e2e8f0';
      const x = document.createElement('button');
      x.className = 'sm-close';
      x.innerHTML = ph('ph-x', 15);
      x.onclick = () => this.dismiss(panel);
      row.appendChild(left); row.appendChild(x);
      return row;
    }

    _btn(label, cls, onClick) {
      const b = document.createElement('button');
      b.className = `sm-btn ${cls}`;
      b.innerHTML = label;
      b.onclick = onClick;
      return b;
    }

    _actions(...btns) {
      const r = document.createElement('div');
      r.className = 'sm-actions';
      btns.forEach(b => r.appendChild(b));
      return r;
    }

    // ── Email panel ────────────────────────────────────────────────────────
    _email(cfg) {
      const panel = this._shell('#6366f1');
      panel.appendChild(this._header('ph-envelope', 'New email', '#a5b4fc', panel));

      const from = document.createElement('div');
      from.style.cssText = 'font-weight:600;font-size:13px;color:#e2e8f0;margin-bottom:2px;';
      from.textContent = cfg.from || 'Unknown';
      panel.appendChild(from);

      if (cfg.subject) {
        const subj = document.createElement('div');
        subj.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        subj.textContent = cfg.subject;
        panel.appendChild(subj);
      }

      if (cfg.preview) {
        const prev = document.createElement('div');
        prev.style.cssText = 'font-size:12px;color:#94a3b8;margin-bottom:9px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;';
        prev.textContent = cfg.preview;
        panel.appendChild(prev);
      }

      const draftLabel = document.createElement('div');
      draftLabel.className = 'sm-section-label';
      draftLabel.textContent = 'AI Draft';
      panel.appendChild(draftLabel);

      const draftBox = document.createElement('div');
      draftBox.className = 'sm-draft-box';
      draftBox.textContent = cfg.draft || '';
      panel.appendChild(draftBox);

      const editArea = document.createElement('textarea');
      editArea.className = 'sm-draft-area';
      editArea.value = cfg.draft || '';
      editArea.style.display = 'none';
      panel.appendChild(editArea);

      let editing = false;

      const checkRow = document.createElement('label');
      checkRow.className = 'sm-check-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = cfg.autoSend || false;
      cb.onchange = () => {
        if (cb.checked && cfg.fromEmail) {
          try { chrome.runtime.sendMessage({ type: 'ADD_TRUSTED_SENDER', email: cfg.fromEmail }); } catch {}
        }
      };
      checkRow.appendChild(cb);
      checkRow.appendChild(document.createTextNode('Auto-send future emails from this sender'));
      panel.appendChild(checkRow);

      const sendBtn = this._btn(`${ph('ph-paper-plane-tilt')} Send Now`, 'sm-btn-primary', () => {
        const body = editing ? editArea.value : (cfg.draft || '');
        try { chrome.runtime.sendMessage({ type: 'SEND_DRAFT', draftId: cfg.draftId, draftText: body }); } catch {}
        this.dismiss(panel);
      });

      const editBtn = this._btn(`${ph('ph-pencil-simple')} Edit`, 'sm-btn-muted', () => {
        editing = !editing;
        draftBox.style.display = editing ? 'none' : '';
        editArea.style.display = editing ? '' : 'none';
        if (editing) { editBtn.innerHTML = `${ph('ph-check')} Done`; editArea.focus(); }
        else { editBtn.innerHTML = `${ph('ph-pencil-simple')} Edit`; draftBox.textContent = editArea.value; }
      });

      const dismissBtn = this._btn(`${ph('ph-x')} Dismiss`, 'sm-btn-ghost', () => {
        try { chrome.runtime.sendMessage({ type: 'DISMISS_DRAFT', draftId: cfg.draftId }); } catch {}
        this.dismiss(panel);
      });

      panel.appendChild(this._actions(sendBtn, editBtn, dismissBtn));
      return panel;
    }

    // ── Conflict panel ─────────────────────────────────────────────────────
    _conflict(cfg) {
      const panel = this._shell('#ef4444');
      panel.appendChild(this._header('ph-warning', 'Schedule Conflict', '#fca5a5', panel));

      const block = (ev, highlight) => {
        const d = document.createElement('div');
        d.className = 'sm-event-block';
        if (highlight) d.style.borderLeft = '3px solid #ef4444';
        d.innerHTML = `<div class="sm-event-name">${ev.title}</div><div class="sm-event-time">${fmtTime(ev.start)}</div>`;
        return d;
      };

      panel.appendChild(block(cfg.event1, false));
      const vs = document.createElement('div');
      vs.className = 'sm-divider';
      vs.style.color = '#ef4444';
      vs.textContent = cfg.conflictType === 'hard' ? '⚡ overlaps with' : '⚡ back-to-back';
      panel.appendChild(vs);
      panel.appendChild(block(cfg.event2, true));

      const altSection   = document.createElement('div');
      const draftSection = document.createElement('div');
      panel.appendChild(altSection);
      panel.appendChild(draftSection);

      const reschedBtn = this._btn(`${ph('ph-calendar-plus')} Reschedule`, 'sm-btn-primary', () => {
        reschedBtn.disabled = true;
        reschedBtn.innerHTML = 'Finding times…';
        const alts = cfg.alternatives || [];
        if (alts.length) {
          this._renderAlts(cfg, altSection, draftSection);
          reschedBtn.disabled = false;
          reschedBtn.innerHTML = `${ph('ph-calendar-plus')} Reschedule`;
        } else {
          try {
            chrome.runtime.sendMessage({ type: 'GET_RESCHEDULE_OPTIONS', event1: cfg.event1, event2: cfg.event2 }, resp => {
              cfg.alternatives = resp?.alternatives || [];
              this._renderAlts(cfg, altSection, draftSection);
              reschedBtn.disabled = false;
              reschedBtn.innerHTML = `${ph('ph-calendar-plus')} Reschedule`;
            });
          } catch {
            reschedBtn.disabled = false;
            reschedBtn.innerHTML = `${ph('ph-calendar-plus')} Reschedule`;
          }
        }
      });

      const emailBtn = this._btn(`${ph('ph-envelope')} Email Attendees`, 'sm-btn-muted', () => {
        emailBtn.disabled = true;
        emailBtn.innerHTML = 'Drafting…';
        try {
          chrome.runtime.sendMessage({
            type: 'DRAFT_CONFLICT_EMAIL',
            event1: cfg.event1, event2: cfg.event2,
            attendees: cfg.attendees || [],
            alternatives: cfg.alternatives || [],
          }, resp => {
            emailBtn.disabled = false;
            emailBtn.innerHTML = `${ph('ph-envelope')} Email Attendees`;
            if (resp?.draft) this._draftSection(draftSection, resp.draft, cfg);
          });
        } catch { emailBtn.disabled = false; }
      });

      const ignoreBtn = this._btn(`${ph('ph-x')} Ignore`, 'sm-btn-ghost', () => this.dismiss(panel));

      panel.appendChild(this._actions(reschedBtn, emailBtn, ignoreBtn));
      return panel;
    }

    _renderAlts(cfg, section, draftSection) {
      section.innerHTML = '';
      const alts = cfg.alternatives || [];
      const label = document.createElement('div');
      label.className = 'sm-section-label';
      label.textContent = alts.length ? 'Pick a time:' : 'No alternatives found.';
      section.appendChild(label);

      if (!alts.length) return;

      const name = `sm-alt-${Date.now()}`;
      alts.forEach((alt, i) => {
        const row = document.createElement('label');
        row.className = 'sm-alt-option';
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = name; radio.value = i;
        radio.style.accentColor = '#7c3aed';
        row.appendChild(radio);
        row.appendChild(document.createTextNode(alt.label || `${alt.date} ${alt.time}`));
        section.appendChild(row);
      });

      const go = this._btn(`${ph('ph-paper-plane-tilt')} Draft reschedule email`, 'sm-btn-primary', () => {
        const sel = section.querySelector(`input[name="${name}"]:checked`);
        if (!sel) return;
        go.disabled = true; go.innerHTML = 'Drafting…';
        try {
          chrome.runtime.sendMessage({
            type: 'DRAFT_RESCHEDULE_EMAIL',
            event: cfg.event2, attendees: cfg.attendees || [],
            newTime: alts[parseInt(sel.value)],
          }, resp => {
            go.disabled = false;
            go.innerHTML = `${ph('ph-paper-plane-tilt')} Draft reschedule email`;
            if (resp?.draft) this._draftSection(draftSection, resp.draft, cfg);
          });
        } catch { go.disabled = false; }
      });
      section.appendChild(go);
    }

    _draftSection(section, draft, cfg) {
      section.innerHTML = '';
      const label = document.createElement('div');
      label.className = 'sm-section-label';
      label.textContent = 'Email Draft';
      section.appendChild(label);

      const area = document.createElement('textarea');
      area.className = 'sm-draft-area';
      area.value = draft;
      section.appendChild(area);

      const sendBtn = this._btn(`${ph('ph-paper-plane-tilt')} Send`, 'sm-btn-success', () => {
        try {
          chrome.runtime.sendMessage({
            type: 'SEND_PLAIN_EMAIL',
            body: area.value,
            to: (cfg.attendees || []).join(', '),
            subject: `Re: ${cfg.event2?.title || 'Schedule'}`,
          });
        } catch {}
        section.innerHTML = '<div style="color:#22c55e;font-size:12px;padding:6px 0;">✓ Sent!</div>';
        setTimeout(() => { section.innerHTML = ''; }, 2500);
      });
      section.appendChild(sendBtn);
    }

    // ── Reminder panel ─────────────────────────────────────────────────────
    _reminder(cfg) {
      const ev = cfg.event || {};
      const panel = this._shell('#f59e0b');
      panel.appendChild(this._header('ph-timer', 'Starting in 15 min', '#fcd34d', panel));

      const title = document.createElement('div');
      title.style.cssText = 'font-size:15px;font-weight:700;color:#e2e8f0;margin-bottom:5px;';
      title.textContent = ev.title || 'Event';
      panel.appendChild(title);

      const time = document.createElement('div');
      time.style.cssText = 'font-size:12px;color:#94a3b8;margin-bottom:12px;';
      time.textContent = fmtTime(ev.start);
      panel.appendChild(time);

      const btns = [];

      if (ev.meetLink) {
        btns.push(this._btn(`${ph('ph-video-camera')} Join Meeting`, 'sm-btn-primary', () => {
          window.open(ev.meetLink, '_blank');
          this.dismiss(panel);
        }));
      }

      btns.push(this._btn(`${ph('ph-alarm')} Snooze 5 min`, 'sm-btn-muted', () => {
        this.dismiss(panel);
        setTimeout(() => this.show({ ...cfg }), 5 * 60 * 1000);
      }));

      btns.push(this._btn(`${ph('ph-x')} Dismiss`, 'sm-btn-ghost', () => {
        try { chrome.runtime.sendMessage({ type: 'MARK_REMINDER_DISMISSED', eventId: ev.id }); } catch {}
        this.dismiss(panel);
      }));

      panel.appendChild(this._actions(...btns));
      return panel;
    }

    _generic(cfg) {
      const panel = this._shell('#7c3aed');
      panel.appendChild(this._header('ph-bell', cfg.title || 'SlugMind', '#a78bfa', panel));
      if (cfg.body) {
        const b = document.createElement('div');
        b.style.cssText = 'font-size:13px;color:#94a3b8;margin-bottom:10px;';
        b.textContent = cfg.body;
        panel.appendChild(b);
      }
      panel.appendChild(this._actions(
        this._btn(`${ph('ph-x')} Dismiss`, 'sm-btn-ghost', () => this.dismiss(panel))
      ));
      return panel;
    }
  }

  // ── Init + message listener ─────────────────────────────────────────────────
  window.slugmindPanel = new AmbientPanel();

  chrome.runtime.onMessage.addListener((msg) => {
    if (!window.slugmindPanel) return;

    if (msg.type === 'SHOW_EMAIL_ALERT') {
      window.slugmindPanel.show({
        type: 'email',
        draftId:   msg.draftId,
        threadId:  msg.threadId,
        from:      msg.from,
        fromEmail: msg.fromEmail,
        subject:   msg.subject,
        preview:   msg.preview,
        draft:     msg.draft,
        autoSend:  msg.autoSend || false,
      });
    }

    if (msg.type === 'SHOW_CONFLICT_ALERT') {
      window.slugmindPanel.show({
        type:         'conflict',
        conflictType: msg.conflictType,
        event1:       msg.event1,
        event2:       msg.event2,
        alternatives: msg.alternatives || [],
        attendees:    msg.attendees || [],
      });
    }

    if (msg.type === 'SHOW_REMINDER') {
      window.slugmindPanel.show({ type: 'reminder', event: msg.event });
    }
  });
})();
